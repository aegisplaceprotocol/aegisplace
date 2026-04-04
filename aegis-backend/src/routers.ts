import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createOperator, getOperatorBySlug, getOperatorById, listOperators,
  updateOperator, softDeleteOperator, getOperatorsByCreator, getOperatorsByUserId,
  getOperatorCount, getOperatorEarnings,
  recordInvocation, getInvocationById, getInvocationsByOperator,
  getInvocationsByCaller, getRecentInvocations,
  createValidator, getValidatorByWallet, getValidatorById, listValidators,
  updateValidator, incrementValidatorCount, slashValidator,
  createBond, getBondsByOperator, releaseBond, slashBond,
  createDispute, getDisputeById, listDisputes, resolveDispute,
  createReview, getReviewsByOperator, getAverageRating,
  createReport, getReportsByOperator,
  createPayment, settlePayment, getPaymentsByInvocation,
  checkRateLimit, cleanupRateLimits,
  logAudit, getAuditLog, getAdminStats,
  getProtocolStats, updateUserWallet,
  getGuardrailStats,
  getGuardrailViolationTypes,
  getRecentGuardrailViolations,
} from "./db";
import { validateInvocation, calculateFees } from "./validator";
import { checkInput, checkOutput } from "./guardrails";
import { prepareSkillRegistrationPlan, verifyPayment } from "./solana";
import { validateEndpoint } from "./operator-health";
import { ENV } from "./_core/env";
import { broadcastEvent } from "./sse";

function sameId(left: unknown, right: unknown): boolean {
  if (left == null || right == null) return false;
  return String(left) === String(right);
}

function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
    if (host === "169.254.169.254") return true; // AWS/GCP metadata
    if (host === "100.100.100.200") return true; // Alibaba metadata
    if (host.startsWith("10.")) return true;
    if (host.startsWith("192.168.")) return true;
    if (host.startsWith("172.") && parseInt(host.split(".")[1]) >= 16 && parseInt(host.split(".")[1]) <= 31) return true;
    if (host.endsWith(".internal") || host.endsWith(".local")) return true;
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    return false;
  } catch { return true; }
}
import { getTrustBreakdown } from "./trust-engine";
import { getCreatorEarnings, getCreatorAnalytics, getCreatorOperators } from "./earnings";
import {
  getDependencyTree,
  getCreatorEarnings as getRoyaltyEarnings,
  getRoyaltyLeaderboard,
  getRoyaltyStats,
  registerDependency,
} from "./royalties";

// ── Admin guard middleware ──
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ────────────────────────────────────────────────────────
  // Auth
  // ────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    /** Link a Solana wallet to the authenticated user */
    linkWallet: protectedProcedure
      .input(z.object({ walletAddress: z.string().min(32).max(64) }))
      .mutation(async ({ input, ctx }) => {
        await updateUserWallet(ctx.user.id, input.walletAddress);
        await logAudit({
          userId: ctx.user.id,
          action: "link_wallet",
          details: { wallet: input.walletAddress },
        });
        return { success: true };
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Operator Registry
  // ────────────────────────────────────────────────────────
  operator: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        sortBy: z.enum(["trust", "invocations", "earnings", "newest"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return listOperators(input || {});
      }),

    bySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const op = await getOperatorBySlug(input.slug);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        return op;
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const op = await getOperatorById(input.id);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        return op;
      }),

    earnings: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        return getOperatorEarnings(input.operatorId);
      }),

    /** My operators (requires auth) */
    mine: protectedProcedure.query(async ({ ctx }) => {
      return getOperatorsByUserId(ctx.user.id);
    }),

    prepareRegistration: protectedProcedure
      .input(z.object({
        slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/),
        creatorWallet: z.string().min(32).max(64),
        apiBaseUrl: z.string().url(),
        endpointUrl: z.string().url().optional(),
      }))
      .query(async ({ input, ctx }) => {
        const existing = await getOperatorBySlug(input.slug);
        if (existing) {
          throw new TRPCError({ code: "CONFLICT", message: "An operator with this slug already exists" });
        }

        if (ctx.user.walletAddress && ctx.user.walletAddress !== input.creatorWallet) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Creator wallet must match the wallet linked to your account",
          });
        }

        if (input.endpointUrl) {
          const endpointCheck = await validateEndpoint(input.endpointUrl);
          if (!endpointCheck.reachable) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Endpoint validation failed: ${endpointCheck.error || "Endpoint did not respond within 15 seconds"}`,
            });
          }
        }

        return prepareSkillRegistrationPlan(input);
      }),

    register: protectedProcedure
      .input(z.object({
        name: z.string().min(2).max(256),
        slug: z.string().min(2).max(128).regex(/^[a-z0-9-]+$/),
        tagline: z.string().max(512).optional(),
        description: z.string().optional(),
        category: z.enum([
          "code-review", "sentiment-analysis", "data-extraction",
          "image-generation", "text-generation", "translation",
          "summarization", "classification", "search",
          "financial-analysis", "security-audit", "other"
        ]),
        endpointUrl: z.string().url().optional(),
        httpMethod: z.enum(["GET", "POST", "PUT"]).optional(),
        requestSchema: z.any().optional(),
        responseSchema: z.any().optional(),
        pricePerCall: z.string().optional(),
        creatorWallet: z.string().min(32).max(64),
        tags: z.array(z.string()).optional(),
        iconUrl: z.string().url().optional(),
        docsUrl: z.string().url().optional(),
        githubUrl: z.string().url().optional(),
        onChainProgramId: z.string().min(32).max(64).optional(),
        onChainConfigPda: z.string().min(32).max(64).optional(),
        onChainOperatorPda: z.string().min(32).max(64).optional(),
        onChainOperatorId: z.number().int().min(0).optional(),
        onChainTxSignature: z.string().min(32).max(128).optional(),
        onChainMetadataUri: z.string().url().optional(),
        onChainCluster: z.enum(["devnet", "mainnet-beta", "testnet", "localnet"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 5 operator registrations per hour
        const rl = await checkRateLimit(`user:${ctx.user.id}`, "operator.register", 5, 3600);
        if (!rl.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Registration rate limit exceeded. Try again later." });
        }

        const existing = await getOperatorBySlug(input.slug);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "An operator with this slug already exists" });

        if (ctx.user.walletAddress && ctx.user.walletAddress !== input.creatorWallet) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Creator wallet must match the wallet linked to your account",
          });
        }

        // Validate endpoint URL is reachable before accepting registration
        if (input.endpointUrl) {
          const endpointCheck = await validateEndpoint(input.endpointUrl);
          if (!endpointCheck.reachable) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Endpoint validation failed: ${endpointCheck.error || "Endpoint did not respond within 15 seconds"}. Please ensure your endpoint is reachable before registering.`,
            });
          }
        }

        const operator = await createOperator({
          ...input,
          creatorId: ctx.user.id,
          pricePerCall: input.pricePerCall || "0.003",
          trustScore: 50,
          totalInvocations: 0,
          successfulInvocations: 0,
          totalEarned: "0",
          avgResponseMs: 0,
          isActive: true,
          isVerified: false,
          healthStatus: input.endpointUrl ? "healthy" : "unknown",
          consecutiveFailures: 0,
          onChainRegisteredAt: input.onChainTxSignature ? new Date() : null,
          onChainSyncStatus: input.onChainTxSignature ? "confirmed" : "unregistered",
        });

        await logAudit({
          userId: ctx.user.id,
          action: "operator.register",
          targetType: "operator",
          targetId: operator?.id,
          details: { slug: input.slug, name: input.name },
        });

        broadcastEvent("registration", {
          operatorId: operator?.id,
          slug: input.slug,
          name: input.name,
          category: input.category,
          creatorId: ctx.user.id,
        });

        return operator;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).max(256).optional(),
        tagline: z.string().max(512).optional(),
        description: z.string().optional(),
        endpointUrl: z.string().url().optional(),
        httpMethod: z.enum(["GET", "POST", "PUT"]).optional(),
        requestSchema: z.any().optional(),
        responseSchema: z.any().optional(),
        pricePerCall: z.string().optional(),
        isActive: z.boolean().optional(),
        tags: z.array(z.string()).optional(),
        iconUrl: z.string().url().optional(),
        docsUrl: z.string().url().optional(),
        githubUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const op = await getOperatorById(input.id);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        if (!sameId(op.creatorId, ctx.user.id) && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to update this operator" });
        }

        const { id, ...data } = input;
        await logAudit({
          userId: ctx.user.id,
          action: "operator.update",
          targetType: "operator",
          targetId: id,
          details: data,
        });

        return updateOperator(id, data);
      }),

    /** Soft-delete an operator (creator or admin) */
    deactivate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const op = await getOperatorById(input.id);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        if (!sameId(op.creatorId, ctx.user.id) && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await softDeleteOperator(input.id);
        await logAudit({
          userId: ctx.user.id,
          action: "operator.deactivate",
          targetType: "operator",
          targetId: input.id,
        });
        return { success: true };
      }),

    byCreator: publicProcedure
      .input(z.object({ walletAddress: z.string() }))
      .query(async ({ input }) => {
        return getOperatorsByCreator(input.walletAddress);
      }),

    /** Get trust score breakdown for an operator (5 components + overall) */
    trustBreakdown: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        const op = await getOperatorById(input.operatorId);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        return getTrustBreakdown(input.operatorId);
      }),

    /** Get NeMo Guardrails stats for an operator (or all operators if no ID) */
    guardrailStats: publicProcedure
      .input(z.object({ operatorId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        return getGuardrailStats(input?.operatorId);
      }),

    /** Top guardrail violation types aggregated from invocations */
    guardrailViolationTypes: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(20).default(5) }).optional())
      .query(async ({ input }) => {
        return getGuardrailViolationTypes(input?.limit ?? 5);
      }),

    /** Recent invocations that failed guardrail checks */
    guardrailViolations: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
      .query(async ({ input }) => {
        return getRecentGuardrailViolations(input?.limit ?? 10);
      }),

    /** Adaptive guardrails engine stats (self-improving safety) */
    adaptiveGuardrails: publicProcedure.query(async () => {
      const { getAdaptiveStats } = await import("./guardrails");
      return getAdaptiveStats();
    }),
  }),

  // ────────────────────────────────────────────────────────
  // Invocation Engine
  // ────────────────────────────────────────────────────────
  invoke: router({
    execute: publicProcedure
      .input(z.object({
        operatorId: z.number(),
        callerWallet: z.string().optional(),
        payload: z.any().optional(),
        paymentToken: z.string().optional(),
        txSignature: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 60 invocations per minute per IP
        const clientIp = ctx.req.ip || ctx.req.headers["x-forwarded-for"] || "unknown";
        const identifier = `ip:${clientIp}`;
        const rl = await checkRateLimit(identifier, "invoke.execute", 60, 60);
        if (!rl.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Rate limit exceeded. ${rl.remaining} requests remaining. Resets at ${rl.resetAt.toISOString()}` });
        }

        const operator = await getOperatorById(input.operatorId);
        if (!operator) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });
        if (!operator.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Operator is not active" });

        const price = parseFloat(operator.pricePerCall);
        const fees = calculateFees(price);

        // ── Guardrail input check ──
        let guardrailInputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
        let guardrailOutputResult = { passed: true, violations: [] as string[], latencyMs: 0 };
        let totalGuardrailLatencyMs = 0;

        guardrailInputResult = await checkInput(operator.category, input.payload);
        totalGuardrailLatencyMs += guardrailInputResult.latencyMs;

        // If input guardrail blocked, record and return immediately
        if (!guardrailInputResult.passed) {
          const invocationId = await recordInvocation({
            operatorId: operator.id,
            callerWallet: input.callerWallet || null,
            amountPaid: "0",
            creatorShare: "0",
            validatorShare: "0",
            treasuryShare: "0",
            burnAmount: "0",
            responseMs: 0,
            success: false,
            statusCode: 403,
            trustDelta: 0,
            paymentToken: input.paymentToken,
            guardrailInputPassed: false,
            guardrailOutputPassed: true,
            guardrailViolations: guardrailInputResult.violations,
            guardrailLatencyMs: totalGuardrailLatencyMs,
          });

          broadcastEvent("invocation", {
            invocationId,
            operatorId: operator.id,
            operatorName: operator.name,
            operatorSlug: operator.slug,
            callerWallet: input.callerWallet || null,
            success: false,
            responseMs: 0,
            amountPaid: "0",
            trustDelta: 0,
          });

          return {
            success: false,
            invocationId,
            operatorId: operator.id,
            operatorName: operator.name,
            responseMs: 0,
            statusCode: 403,
            response: { error: "Blocked by Aegis NeMo Guardrails safety check", violations: guardrailInputResult.violations },
            validation: { score: 0, trustDelta: 0, newTrustScore: operator.trustScore, flags: ["guardrail_input_blocked"] },
            fees: { total: 0, creator: 0, validator: 0, treasury: 0, burn: 0 },
            guardrails: {
              inputPassed: false,
              outputPassed: true,
              violations: guardrailInputResult.violations,
              latencyMs: totalGuardrailLatencyMs,
            },
          };
        }

        // ── Payment verification ──
        let paymentVerified = false;

        if (input.txSignature) {
          // Verify on-chain USDC payment
          if (!input.callerWallet) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "callerWallet is required when providing txSignature" });
          }
          if (!ENV.treasuryWallet) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Treasury wallet not configured" });
          }

          const verification = await verifyPayment(
            input.txSignature,
            price,
            input.callerWallet,
            ENV.treasuryWallet,
          );

          if (!verification.verified) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Payment verification failed: ${verification.error}`,
            });
          }
          paymentVerified = true;
        } else if (operator.endpointUrl && price > 0) {
          // Real operator with a price requires payment - demo operators (no endpoint) are free
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This operator requires payment. Provide a txSignature for an on-chain USDC transfer to the treasury wallet.",
          });
        }

        let responseMs = 0;
        let statusCode = 200;
        let responseBody: unknown = null;
        let success = true;

        // Call the real endpoint if it exists
        if (operator.endpointUrl) {
          if (isPrivateUrl(operator.endpointUrl)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid operator endpoint" });
          }
          const start = Date.now();
          try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 15000);

            const res = await fetch(operator.endpointUrl, {
              method: operator.httpMethod || "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Aegis-Operator-Id": String(operator.id),
                "X-Aegis-Caller": input.callerWallet || "anonymous",
              },
              body: input.payload ? JSON.stringify(input.payload) : undefined,
              signal: controller.signal,
            });

            clearTimeout(timeout);
            responseMs = Date.now() - start;
            statusCode = res.status;

            try {
              responseBody = await res.json();
            } catch {
              responseBody = await res.text();
            }

            success = statusCode >= 200 && statusCode < 400;
          } catch (err: any) {
            responseMs = Date.now() - start;
            statusCode = 0;
            success = false;
            responseBody = { error: err.message || "Request failed" };
          }
        } else {
          // No endpoint deployed - operator must configure an endpoint URL
          responseMs = 0;
          statusCode = 503;
          success = false;
          responseBody = {
            error: "OPERATOR_NOT_DEPLOYED",
            message: "This operator is not yet deployed.",
          };
        }

        // ── Guardrail output check ──
        if (success) {
          guardrailOutputResult = await checkOutput(operator.category, responseBody);
          totalGuardrailLatencyMs += guardrailOutputResult.latencyMs;

          if (!guardrailOutputResult.passed) {
            success = false;
          }
        }

        // Validate the response
        const validation = validateInvocation({
          responseMs,
          statusCode,
          responseBody,
          expectedSchema: operator.responseSchema as Record<string, unknown> | undefined,
        });

        // Apply guardrail output penalty to trust delta
        let trustDelta = validation.trustDelta;
        if (!guardrailOutputResult.passed) {
          trustDelta = -5;
        }

        // Combine all guardrail violations
        const allViolations = [
          ...guardrailInputResult.violations,
          ...guardrailOutputResult.violations,
        ];

        // Record the invocation
        const invocationId = await recordInvocation({
          operatorId: operator.id,
          callerWallet: input.callerWallet || null,
          amountPaid: price.toFixed(8),
          creatorShare: fees.creator.toFixed(8),
          validatorShare: fees.validators.toFixed(8),
          treasuryShare: fees.treasury.toFixed(8),
          burnAmount: fees.burn.toFixed(8),
          stakersShare: fees.stakers.toFixed(8),
          insuranceShare: fees.insurance.toFixed(8),
          responseMs,
          success,
          statusCode,
          trustDelta,
          txSignature: input.txSignature || null,
          paymentToken: input.paymentToken,
          paymentVerified,
          guardrailInputPassed: guardrailInputResult.passed,
          guardrailOutputPassed: guardrailOutputResult.passed,
          guardrailViolations: allViolations.length > 0 ? allViolations : undefined,
          guardrailLatencyMs: totalGuardrailLatencyMs,
        });

        // Update trust score
        const newTrust = Math.max(0, Math.min(100, operator.trustScore + trustDelta));
        await updateOperator(operator.id, { trustScore: newTrust });

        // Create payment record
        await createPayment({
          invocationId,
          txSignature: input.txSignature || input.paymentToken || "awaiting_confirmation",
          totalAmount: price.toFixed(8),
          operatorShare: fees.creator.toFixed(8),
          protocolShare: fees.treasury.toFixed(8),
          validatorShare: fees.validators.toFixed(8),
          burnAmount: fees.burn.toFixed(8),
          stakersShare: fees.stakers.toFixed(8),
          insuranceShare: fees.insurance.toFixed(8),
          status: paymentVerified ? "settled" : (input.paymentToken ? "settled" : "pending"),
          settledAt: paymentVerified || input.paymentToken ? new Date() : undefined,
        });

        broadcastEvent("invocation", {
          invocationId,
          operatorId: operator.id,
          operatorName: operator.name,
          operatorSlug: operator.slug,
          callerWallet: input.callerWallet || null,
          success,
          responseMs,
          amountPaid: price.toFixed(8),
          trustDelta,
        });

        return {
          success,
          invocationId,
          operatorId: operator.id,
          operatorName: operator.name,
          responseMs,
          statusCode,
          response: responseBody,
          validation: {
            score: validation.score,
            trustDelta,
            newTrustScore: newTrust,
            flags: [
              ...validation.flags,
              ...(!guardrailOutputResult.passed ? ["guardrail_output_blocked"] : []),
            ],
          },
          fees: {
            total: price,
            creator: fees.creator,
            validators: fees.validators,
            stakers: fees.stakers,
            treasury: fees.treasury,
            insurance: fees.insurance,
            burn: fees.burn,
          },
          guardrails: {
            inputPassed: guardrailInputResult.passed,
            outputPassed: guardrailOutputResult.passed,
            violations: allViolations,
            latencyMs: totalGuardrailLatencyMs,
          },
        };
      }),

    recent: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        return getRecentInvocations(input?.limit || 20);
      }),

    byOperator: publicProcedure
      .input(z.object({
        operatorId: z.number(),
        limit: z.number().min(1).max(100).optional(),
      }))
      .query(async ({ input }) => {
        return getInvocationsByOperator(input.operatorId, input.limit || 50);
      }),

    /** Get invocations by caller wallet */
    byCaller: publicProcedure
      .input(z.object({
        callerWallet: z.string(),
        limit: z.number().min(1).max(100).optional(),
      }))
      .query(async ({ input }) => {
        return getInvocationsByCaller(input.callerWallet, input.limit || 50);
      }),

    /** Get a single invocation by ID */
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const inv = await getInvocationById(input.id);
        if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invocation not found" });
        return inv;
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Validators
  // ────────────────────────────────────────────────────────
  validator: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
        sortBy: z.enum(["reputation", "stake", "validated", "newest"]).optional(),
      }).optional())
      .query(async ({ input }) => {
        return listValidators(input || {});
      }),

    byWallet: publicProcedure
      .input(z.object({ wallet: z.string() }))
      .query(async ({ input }) => {
        const v = await getValidatorByWallet(input.wallet);
        if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Validator not found" });
        return v;
      }),

    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const v = await getValidatorById(input.id);
        if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Validator not found" });
        return v;
      }),

    /** Register as a validator (requires auth + wallet) */
    register: protectedProcedure
      .input(z.object({
        wallet: z.string().min(32).max(64),
        name: z.string().min(2).max(256),
        description: z.string().optional(),
        commissionBps: z.number().min(0).max(5000).optional(),
        website: z.string().url().optional(),
        avatarUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const existing = await getValidatorByWallet(input.wallet);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Validator with this wallet already exists" });

        const validator = await createValidator({
          ...input,
          userId: ctx.user.id,
          status: "pending",
          commissionBps: input.commissionBps || 500,
        });

        await logAudit({
          userId: ctx.user.id,
          action: "validator.register",
          targetType: "validator",
          details: { wallet: input.wallet, name: input.name },
        });

        broadcastEvent("validator_join", {
          wallet: input.wallet,
          name: input.name,
          userId: ctx.user.id,
        });

        return validator;
      }),

    /** Update validator profile */
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(2).max(256).optional(),
        description: z.string().optional(),
        commissionBps: z.number().min(0).max(5000).optional(),
        website: z.string().url().optional(),
        avatarUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const v = await getValidatorById(input.id);
        if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Validator not found" });
        if (v.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        const { id, ...data } = input;
        return updateValidator(id, data);
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Operator Bonds
  // ────────────────────────────────────────────────────────
  bond: router({
    /** Post a bond for an operator */
    create: protectedProcedure
      .input(z.object({
        operatorId: z.number(),
        bondWallet: z.string().min(32).max(64),
        amountLamports: z.number().min(1),
        txSignature: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const op = await getOperatorById(input.operatorId);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });

        await createBond(input);

        await logAudit({
          userId: ctx.user.id,
          action: "bond.create",
          targetType: "operator",
          targetId: input.operatorId,
          details: { amount: input.amountLamports, wallet: input.bondWallet },
        });

        return { success: true };
      }),

    /** List bonds for an operator */
    byOperator: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        return getBondsByOperator(input.operatorId);
      }),

    /** Release a bond (admin or bond owner only) */
    release: protectedProcedure
      .input(z.object({ bondId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const bonds = await getBondsByOperator(input.bondId);
        const bond = bonds?.[0];
        if (!bond) throw new Error("Bond not found");
        if (bond.bondWallet !== ctx.user.walletAddress && ctx.user.role !== "admin") {
          throw new Error("Not authorized to release this bond");
        }
        await releaseBond(input.bondId);
        await logAudit({
          userId: ctx.user.id,
          action: "bond.release",
          targetType: "bond",
          targetId: input.bondId,
        });
        return { success: true };
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Disputes
  // ────────────────────────────────────────────────────────
  dispute: router({
    /** File a dispute against an invocation */
    create: protectedProcedure
      .input(z.object({
        invocationId: z.number(),
        challengerWallet: z.string().min(32).max(64),
        reason: z.enum(["incorrect_output", "timeout", "overcharge", "schema_violation", "malicious_response", "other"]),
        description: z.string().optional(),
        evidenceUrl: z.string().url().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 10 disputes per hour
        const rl = await checkRateLimit(`user:${ctx.user.id}`, "dispute.create", 10, 3600);
        if (!rl.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Dispute rate limit exceeded" });
        }

        const inv = await getInvocationById(input.invocationId);
        if (!inv) throw new TRPCError({ code: "NOT_FOUND", message: "Invocation not found" });

        const disputeId = await createDispute({
          ...input,
          operatorId: inv.operatorId,
        });

        await logAudit({
          userId: ctx.user.id,
          action: "dispute.create",
          targetType: "dispute",
          targetId: disputeId,
          details: { invocationId: input.invocationId, reason: input.reason },
        });

        broadcastEvent("dispute", {
          disputeId,
          invocationId: input.invocationId,
          operatorId: inv.operatorId,
          reason: input.reason,
          userId: ctx.user.id,
        });

        return { disputeId };
      }),

    /** Get a single dispute */
    byId: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const d = await getDisputeById(input.id);
        if (!d) throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });
        return d;
      }),

    /** List disputes with filtering */
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        operatorId: z.number().optional(),
        limit: z.number().min(1).max(100).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return listDisputes(input || {});
      }),

    /** Resolve a dispute (admin only) */
    resolve: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["resolved_for_challenger", "resolved_for_operator", "dismissed"]),
        resolutionNotes: z.string().optional(),
        refundAmount: z.string().optional(),
        slashAmount: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dispute = await getDisputeById(input.id);
        if (!dispute) throw new TRPCError({ code: "NOT_FOUND", message: "Dispute not found" });

        await resolveDispute(input.id, input);

        // If resolved for challenger, slash operator trust
        if (input.status === "resolved_for_challenger") {
          const op = await getOperatorById(dispute.operatorId);
          if (op) {
            const newTrust = Math.max(0, op.trustScore - 10);
            await updateOperator(dispute.operatorId, { trustScore: newTrust });
          }
        }

        await logAudit({
          userId: ctx.user.id,
          action: "dispute.resolve",
          targetType: "dispute",
          targetId: input.id,
          details: input,
        });

        return { success: true };
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Skill Reviews
  // ────────────────────────────────────────────────────────
  review: router({
    /** Submit a review for an operator */
    create: protectedProcedure
      .input(z.object({
        operatorId: z.number(),
        reviewerWallet: z.string().min(32).max(64),
        rating: z.number().min(1).max(5),
        comment: z.string().max(2000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Rate limit: 20 reviews per hour
        const rl = await checkRateLimit(`user:${ctx.user.id}`, "review.create", 20, 3600);
        if (!rl.allowed) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Review rate limit exceeded" });
        }

        const op = await getOperatorById(input.operatorId);
        if (!op) throw new TRPCError({ code: "NOT_FOUND", message: "Operator not found" });

        await createReview({
          ...input,
          reviewerUserId: ctx.user.id,
        });

        return { success: true };
      }),

    /** Get reviews for an operator */
    byOperator: publicProcedure
      .input(z.object({
        operatorId: z.number(),
        limit: z.number().min(1).max(100).optional(),
      }))
      .query(async ({ input }) => {
        return getReviewsByOperator(input.operatorId, input.limit || 50);
      }),

    /** Get average rating for an operator */
    averageRating: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        return getAverageRating(input.operatorId);
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Validator Reports
  // ────────────────────────────────────────────────────────
  report: router({
    submit: protectedProcedure
      .input(z.object({
        operatorId: z.number(),
        validatorId: z.number().optional(),
        reporterWallet: z.string().optional(),
        reportType: z.enum([
          "quality-check", "security-audit", "performance-test",
          "dispute", "periodic-validation"
        ]),
        score: z.number().min(0).max(100),
        findings: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createReport(input);

        // If score is very low, flag the operator
        if (input.score < 30) {
          const op = await getOperatorById(input.operatorId);
          if (op) {
            const newTrust = Math.max(0, op.trustScore - 5);
            await updateOperator(input.operatorId, { trustScore: newTrust });
          }
        }

        // Credit the validator if one is specified
        if (input.validatorId) {
          await incrementValidatorCount(input.validatorId, "0");
        }

        return { success: true };
      }),

    byOperator: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        return getReportsByOperator(input.operatorId);
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Protocol Stats
  // ────────────────────────────────────────────────────────
  stats: router({
    overview: publicProcedure.query(async () => {
      return getProtocolStats();
    }),
  }),

  // ────────────────────────────────────────────────────────
  // Admin Panel
  // ────────────────────────────────────────────────────────
  admin: router({
    /** Get admin dashboard stats */
    stats: adminProcedure.query(async () => {
      return getAdminStats();
    }),

    /** Verify an operator */
    verifyOperator: adminProcedure
      .input(z.object({ operatorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await updateOperator(input.operatorId, { isVerified: true });
        await logAudit({
          userId: ctx.user.id,
          action: "admin.verify_operator",
          targetType: "operator",
          targetId: input.operatorId,
        });
        return { success: true };
      }),

    /** Suspend an operator */
    suspendOperator: adminProcedure
      .input(z.object({
        operatorId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await updateOperator(input.operatorId, {
          isActive: false,
          suspensionReason: input.reason,
        });
        await logAudit({
          userId: ctx.user.id,
          action: "admin.suspend_operator",
          targetType: "operator",
          targetId: input.operatorId,
          details: { reason: input.reason },
        });
        return { success: true };
      }),

    /** Activate a validator */
    activateValidator: adminProcedure
      .input(z.object({ validatorId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await updateValidator(input.validatorId, { status: "active" });
        await logAudit({
          userId: ctx.user.id,
          action: "admin.activate_validator",
          targetType: "validator",
          targetId: input.validatorId,
        });
        return { success: true };
      }),

    /** Slash a validator */
    slashValidator: adminProcedure
      .input(z.object({
        validatorId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await slashValidator(input.validatorId);
        await updateValidator(input.validatorId, { status: "slashed" });
        await logAudit({
          userId: ctx.user.id,
          action: "admin.slash_validator",
          targetType: "validator",
          targetId: input.validatorId,
          details: { reason: input.reason },
        });
        return { success: true };
      }),

    /** Slash an operator bond */
    slashBond: adminProcedure
      .input(z.object({
        bondId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await slashBond(input.bondId, input.reason);
        await logAudit({
          userId: ctx.user.id,
          action: "admin.slash_bond",
          targetType: "bond",
          targetId: input.bondId,
          details: { reason: input.reason },
        });
        return { success: true };
      }),

    /** Get audit log */
    auditLog: adminProcedure
      .input(z.object({
        userId: z.number().optional(),
        action: z.string().optional(),
        limit: z.number().min(1).max(200).optional(),
        offset: z.number().min(0).optional(),
      }).optional())
      .query(async ({ input }) => {
        return getAuditLog(input || {});
      }),

    /** Run rate limit cleanup */
    cleanupRateLimits: adminProcedure.mutation(async () => {
      await cleanupRateLimits();
      return { success: true };
    }),
  }),

  // ────────────────────────────────────────────────────────
  // Creator Dashboard
  // ────────────────────────────────────────────────────────
  creator: router({
    /** Get earnings summary for the authenticated creator */
    earnings: protectedProcedure.query(async ({ ctx }) => {
      const wallet = ctx.user.walletAddress;
      if (!wallet) {
        return { total: "0", last24h: "0", last7d: "0", last30d: "0", pending: "0", settled: "0", byOperator: [] };
      }
      return getCreatorEarnings(wallet);
    }),

    /** Get daily analytics for charting (invocations + revenue per day) */
    analytics: protectedProcedure
      .input(z.object({ days: z.number().min(1).max(365).default(30) }))
      .query(async ({ input, ctx }) => {
        const wallet = ctx.user.walletAddress;
        if (!wallet) {
          return { daily: [] };
        }
        return getCreatorAnalytics(wallet, input.days);
      }),

    /** Get operators owned by the authenticated creator with stats */
    operators: protectedProcedure.query(async ({ ctx }) => {
      const wallet = ctx.user.walletAddress;
      if (!wallet) {
        return [];
      }
      return getCreatorOperators(wallet);
    }),
  }),

  // ────────────────────────────────────────────────────────
  // Royalty System
  // ────────────────────────────────────────────────────────
  royalties: router({
    /** Get full upstream dependency tree for a skill */
    tree: publicProcedure
      .input(z.object({ skillSlug: z.string().min(1) }))
      .query(async ({ input }) => {
        const tree = await getDependencyTree(input.skillSlug);
        if (!tree) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Skill not found" });
        }
        return tree;
      }),

    /** Get royalty earnings for a creator wallet */
    earnings: publicProcedure
      .input(z.object({ wallet: z.string().min(32).max(64) }))
      .query(async ({ input }) => getRoyaltyEarnings(input.wallet)),

    /** Top skills by total royalties earned */
    leaderboard: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }))
      .query(async ({ input }) => getRoyaltyLeaderboard(input.limit ?? 20)),

    /** Protocol-wide royalty statistics */
    stats: publicProcedure.query(async () => getRoyaltyStats()),

    /** Register a dependency edge (protected - caller must be child skill creator) */
    register: protectedProcedure
      .input(
        z.object({
          parentSkillSlug: z.string().min(1).max(128),
          childSkillSlug: z.string().min(1).max(128),
          royaltyBps: z.number().int().min(1).max(2000),
          onChainEdgePda: z.string().min(1).max(128),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const wallet = ctx.user.walletAddress;
        if (!wallet) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Authenticated user must have a linked wallet to register a dependency",
          });
        }

        try {
          const edge = await registerDependency({
            parentSkillSlug: input.parentSkillSlug,
            childSkillSlug: input.childSkillSlug,
            royaltyBps: input.royaltyBps,
            childCreatorWallet: wallet,
            onChainEdgePda: input.onChainEdgePda,
          });
          return { success: true, edge };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to register dependency";
          if (message.includes("not found")) {
            throw new TRPCError({ code: "NOT_FOUND", message });
          }
          throw new TRPCError({ code: "BAD_REQUEST", message });
        }
      }),
  }),

  // ────────────────────────────────────────────────────────
  // API Keys
  // ────────────────────────────────────────────────────────
  apiKey: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { listApiKeys } = await import("./api-keys");
      return listApiKeys((ctx as any).user._id ?? ctx.user.id);
    }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(50),
        scopes: z.array(z.enum(["read", "invoke", "register", "admin"])).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createApiKey } = await import("./api-keys");
        return createApiKey((ctx as any).user._id ?? ctx.user.id, input.name, input.scopes);
      }),
    revoke: protectedProcedure
      .input(z.object({ keyId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const { revokeApiKey } = await import("./api-keys");
        await revokeApiKey(input.keyId, (ctx as any).user._id ?? ctx.user.id);
        return { success: true };
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Know Your Agent (KYA) Verification
  // ────────────────────────────────────────────────────────
  kya: router({
    report: publicProcedure
      .input(z.object({ operatorId: z.number() }))
      .query(async ({ input }) => {
        const { generateKYAReport } = await import("./kya-engine");
        return generateKYAReport(input.operatorId);
      }),

    grade: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const op = await getOperatorBySlug(input.slug);
        if (!op) throw new TRPCError({ code: "NOT_FOUND" });
        const { generateKYAReport } = await import("./kya-engine");
        const report = await generateKYAReport(op.id);
        return { slug: input.slug, grade: report.grade, score: report.overallScore };
      }),
  }),

  // ────────────────────────────────────────────────────────
  // Swarm Engine
  // ────────────────────────────────────────────────────────
  swarm: router({
    /** Returns current swarm engine stats and active swarm state */
    status: publicProcedure.query(async () => {
      const { getSwarmStatus } = await import("./swarm-engine");
      return getSwarmStatus();
    }),
  }),

  // ────────────────────────────────────────────────────────
  // MCP Server Verification
  // ────────────────────────────────────────────────────────
  mcpVerify: router({
    submit: protectedProcedure
      .input(z.object({
        serverUrl: z.string().url(),
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { submitForVerification } = await import("./mcp-verify");
        const server = await submitForVerification({
          ...input,
          ownerWallet: (ctx as any).user?.walletAddress,
        });
        return { success: true, server };
      }),
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).optional() }).optional())
      .query(async ({ input }) => {
        const { getVerifiedServers } = await import("./mcp-verify");
        return getVerifiedServers(input?.limit ?? 50);
      }),
    status: publicProcedure
      .input(z.object({ serverUrl: z.string() }))
      .query(async ({ input }) => {
        const { McpServer } = await import("./db");
        return McpServer.findOne({ serverUrl: input.serverUrl }).lean();
      }),
  }),
});

export type AppRouter = typeof appRouter;
