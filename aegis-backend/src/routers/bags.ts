/**
 * Aegis Protocol - Bags tRPC Router
 *
 * Exposes Bags.fm integration endpoints to the frontend.
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { bags, BagsApiError } from "../bags";
import { OperatorTokenModel, getOperatorBySlug } from "../db";

const SOL_MINT = "So11111111111111111111111111111111111111112";

/** Wrap Bags API calls so missing key or network errors don't crash the server */
function handleBagsError(err: unknown): never {
  if (err instanceof BagsApiError) {
    if (err.status === 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Bags API key is not configured",
      });
    }
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: err.message,
    });
  }
  throw err;
}

export const bagsRouter = router({
  /**
   * Get token info for an operator (from local DB)
   */
  operatorToken: publicProcedure
    .input(z.object({ operatorSlug: z.string() }))
    .query(async ({ input }) => {
      const token = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      }).lean();
      return token ?? null;
    }),

  /**
   * Launch a Bags token for an operator
   */
  launchToken: publicProcedure
    .input(
      z.object({
        operatorSlug: z.string(),
        symbol: z.string().min(1).max(10),
        name: z.string().min(1).max(128),
        description: z.string().min(1).max(2000),
        imageUrl: z.string().url(),
        website: z.string().url().optional(),
        twitter: z.string().optional(),
        payerWallet: z.string().min(32).max(64),
        creatorBps: z.number().min(0).max(10000).optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // Verify operator exists
      const operator = await getOperatorBySlug(input.operatorSlug);
      if (!operator) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Operator not found",
        });
      }

      // Check if token already exists
      const existing = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Token already launched for this operator",
        });
      }

      try {
        // Step 1: Create token metadata via Bags
        const info = await bags.tokenLaunch.createInfo({
          name: input.name,
          symbol: input.symbol,
          description: input.description,
          image: input.imageUrl,
          website: input.website,
          twitter: input.twitter,
        });

        // Step 2: Generate launch transactions
        const launch = await bags.tokenLaunch.createLaunchTx({
          tokenMint: info.metadataUri, // Bags uses metadata URI as tokenMint reference
          payer: input.payerWallet,
          creatorBps: input.creatorBps,
        });

        // Step 3: Store in DB
        const tokenDoc = await OperatorTokenModel.create({
          operatorSlug: input.operatorSlug,
          tokenMint: launch.tokenMint,
          symbol: input.symbol,
          name: input.name,
          status: "PRE_LAUNCH",
          configKey: launch.configKey,
          feeShareConfig: null,
          launchedAt: new Date(),
        });

        return {
          tokenMint: launch.tokenMint,
          configKey: launch.configKey,
          metadataUri: info.metadataUri,
          transactions: launch.transactions,
          operatorToken: tokenDoc.toJSON(),
        };
      } catch (err) {
        handleBagsError(err);
      }
    }),

  /**
   * Get a trade quote for an operator token
   */
  getQuote: publicProcedure
    .input(
      z.object({
        operatorSlug: z.string(),
        action: z.enum(["buy", "sell"]),
        amountLamports: z.string(),
        slippageBps: z.number().min(0).max(10000).optional(),
      }),
    )
    .query(async ({ input }) => {
      const token = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      });
      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No token found for this operator",
        });
      }

      try {
        const inputMint = input.action === "buy" ? SOL_MINT : token.tokenMint;
        const outputMint = input.action === "buy" ? token.tokenMint : SOL_MINT;

        const quote = await bags.trade.quote({
          inputMint,
          outputMint,
          amount: input.amountLamports,
          slippageBps: input.slippageBps ?? 50,
        });

        return quote;
      } catch (err) {
        handleBagsError(err);
      }
    }),

  /**
   * Get swap transaction from a quote
   */
  getSwapTx: publicProcedure
    .input(
      z.object({
        quoteResponse: z.any(),
        userPublicKey: z.string().min(32).max(64),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const result = await bags.trade.swapTx({
          quoteResponse: input.quoteResponse,
          userPublicKey: input.userPublicKey,
        });
        return result;
      } catch (err) {
        handleBagsError(err);
      }
    }),

  /**
   * Claim accumulated fees for an operator token
   */
  claimFees: publicProcedure
    .input(
      z.object({
        operatorSlug: z.string(),
        partnerWallet: z.string().min(32).max(64),
      }),
    )
    .mutation(async ({ input }) => {
      const token = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      });
      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No token found for this operator",
        });
      }

      try {
        const txs = await bags.partnerFees.claimTxs({
          baseMint: token.tokenMint,
          partner: input.partnerWallet,
        });
        return txs;
      } catch (err) {
        handleBagsError(err);
      }
    }),

  /**
   * Get Aegis partner fee stats
   */
  partnerStats: publicProcedure
    .input(
      z.object({
        tokenMint: z.string().optional(),
        partnerWallet: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      const partnerWallet = input?.partnerWallet || process.env.BAGS_PARTNER_WALLET;
      if (!partnerWallet) {
        return { claimableAmount: "0", totalClaimed: "0", baseMint: "", partner: "" };
      }

      // If a specific token is requested
      if (input?.tokenMint) {
        try {
          const stats = await bags.partnerFees.claimStats({
            baseMint: input.tokenMint,
            partner: partnerWallet,
          });
          return stats;
        } catch (err) {
          if (err instanceof BagsApiError && err.status === 0) {
            return { claimableAmount: "0", totalClaimed: "0", baseMint: input.tokenMint, partner: partnerWallet };
          }
          throw err;
        }
      }

      // Return aggregate stats across all operator tokens
      const tokens = await OperatorTokenModel.find().lean();
      let totalClaimable = 0;
      let totalClaimed = 0;

      for (const t of tokens) {
        try {
          const stats = await bags.partnerFees.claimStats({
            baseMint: t.tokenMint,
            partner: partnerWallet,
          });
          if (stats) {
            totalClaimable += parseFloat(stats.claimableAmount || "0");
            totalClaimed += parseFloat(stats.totalClaimed || "0");
          }
        } catch {
          // skip tokens that fail
        }
      }

      return {
        claimableAmount: totalClaimable.toString(),
        totalClaimed: totalClaimed.toString(),
        baseMint: "",
        partner: partnerWallet,
        tokenCount: tokens.length,
      };
    }),

  /**
   * Get recent Bags token launches
   */
  tokenFeed: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.string().optional(),
      }).optional(),
    )
    .query(async ({ input }) => {
      try {
        const feed = await bags.tokenLaunch.feed();
        return feed;
      } catch (err) {
        if (err instanceof BagsApiError && err.status === 0) {
          return { tokens: [], total: 0 };
        }
        handleBagsError(err);
      }
    }),

  /**
   * Get token state by mint
   */
  tokenState: publicProcedure
    .input(z.object({ tokenMint: z.string() }))
    .query(async ({ input }) => {
      try {
        const state = await bags.token.state({ tokenMint: input.tokenMint });
        return state;
      } catch (err) {
        if (err instanceof BagsApiError && err.status === 0) {
          return null;
        }
        handleBagsError(err);
      }
    }),

  /**
   * Get fee share config for an operator token
   */
  feeShareConfig: publicProcedure
    .input(z.object({ operatorSlug: z.string() }))
    .query(async ({ input }) => {
      const token = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      });
      if (!token) return null;

      if (token.feeShareConfig) {
        return token.feeShareConfig as { claimers: string[]; basisPoints: number[] };
      }

      // Try fetching from Bags API
      const partnerWallet = process.env.BAGS_PARTNER_WALLET;
      if (!partnerWallet) return null;

      try {
        const adminList = await bags.feeShare.adminList(partnerWallet);
        if (!adminList) return null;

        const match = adminList.tokens.find((t) => t.baseMint === token.tokenMint);
        if (match) {
          // Cache in DB
          await OperatorTokenModel.updateOne(
            { _id: token._id },
            {
              feeShareConfig: {
                claimers: match.claimers,
                basisPoints: match.basisPoints,
              },
            },
          );
          return { claimers: match.claimers, basisPoints: match.basisPoints };
        }
      } catch {
        // ignore
      }

      return null;
    }),

  /**
   * Get operator token analytics (lifetime fees, claim events)
   */
  analytics: publicProcedure
    .input(z.object({ operatorSlug: z.string() }))
    .query(async ({ input }) => {
      const token = await OperatorTokenModel.findOne({
        operatorSlug: input.operatorSlug,
      });
      if (!token) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No token found for this operator",
        });
      }

      try {
        const [lifetimeFees, claimEvents, poolInfo] = await Promise.all([
          bags.tokenLaunch.lifetimeFees({ tokenMint: token.tokenMint }),
          bags.feeShare.claimEvents({ baseMint: token.tokenMint, limit: 20 }),
          bags.pool.byTokenMint({ tokenMint: token.tokenMint }),
        ]);

        return {
          tokenMint: token.tokenMint,
          symbol: token.symbol,
          name: token.name,
          status: token.status,
          lifetimeFees: lifetimeFees?.totalFees ?? "0",
          claimEvents: claimEvents?.events ?? [],
          pool: poolInfo,
          totalTradingVolume: token.totalTradingVolume,
          totalFeesEarned: token.totalFeesEarned,
          currentPrice: token.currentPrice,
        };
      } catch (err) {
        if (err instanceof BagsApiError && err.status === 0) {
          return {
            tokenMint: token.tokenMint,
            symbol: token.symbol,
            name: token.name,
            status: token.status,
            lifetimeFees: "0",
            claimEvents: [],
            pool: null,
            totalTradingVolume: token.totalTradingVolume,
            totalFeesEarned: token.totalFeesEarned,
            currentPrice: token.currentPrice,
          };
        }
        handleBagsError(err);
      }
    }),
});
