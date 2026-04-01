/**
 * Aegis Protocol - Bags API Client
 *
 * Typed wrapper for the Bags.fm public API v2.
 * All methods gracefully handle missing BAGS_API_KEY.
 */

// ────────────────────────────────────────────────────────────
// Error class
// ────────────────────────────────────────────────────────────

import { logger } from "./logger";

export class BagsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "BagsApiError";
  }
}

// ────────────────────────────────────────────────────────────
// Types - Token Launch
// ────────────────────────────────────────────────────────────

export interface CreateTokenInfoRequest {
  name: string;
  symbol: string;
  description: string;
  image: string;
  website?: string;
  twitter?: string;
}

export interface CreateTokenInfoResponse {
  metadataUri: string;
  name: string;
  symbol: string;
}

export interface CreateLaunchTxRequest {
  tokenMint: string;
  payer: string;
  creatorBps?: number;
  feeShareConfigType?: string;
}

export interface CreateLaunchTxResponse {
  transactions: string[];
  tokenMint: string;
  configKey: string;
}

// ────────────────────────────────────────────────────────────
// Types - Trading
// ────────────────────────────────────────────────────────────

export interface TradeQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
}

export interface TradeQuoteResponse {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct: number;
  routePlan: unknown[];
  otherAmountThreshold: string;
  swapMode: string;
}

export interface SwapTxRequest {
  quoteResponse: TradeQuoteResponse;
  userPublicKey: string;
}

export interface SwapTxResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
}

// ────────────────────────────────────────────────────────────
// Types - Fee Sharing
// ────────────────────────────────────────────────────────────

export interface CreateFeeShareConfigRequest {
  baseMint: string;
  claimersArray: string[];
  basisPointsArray: number[];
  payer: string;
}

export interface CreateFeeShareConfigResponse {
  transaction: string;
  configKey: string;
}

export interface UpdateFeeShareConfigRequest {
  baseMint: string;
  basisPointsArray: number[];
  claimersArray: string[];
  payer: string;
}

export interface UpdateFeeShareConfigResponse {
  transaction: string;
}

export interface FeeShareAdminListResponse {
  tokens: Array<{
    baseMint: string;
    configKey: string;
    claimers: string[];
    basisPoints: number[];
  }>;
}

export interface TransferAdminRequest {
  baseMint: string;
  newAdmin: string;
  payer: string;
}

export interface TransferAdminResponse {
  transaction: string;
}

export interface ClaimEventsParams {
  baseMint: string;
  claimer?: string;
  limit?: number;
  offset?: number;
}

export interface ClaimEvent {
  claimer: string;
  amount: string;
  timestamp: string;
  txSignature: string;
}

export interface ClaimEventsResponse {
  events: ClaimEvent[];
  total: number;
}

// ────────────────────────────────────────────────────────────
// Types - Partner Fees
// ────────────────────────────────────────────────────────────

export interface CreatePartnerConfigRequest {
  baseMint: string;
  partner: string;
  bps: number;
  payer: string;
}

export interface CreatePartnerConfigResponse {
  transaction: string;
  configKey: string;
}

export interface PartnerConfigParams {
  baseMint: string;
  partner: string;
}

export interface PartnerConfigResponse {
  baseMint: string;
  partner: string;
  bps: number;
  configKey: string;
}

export interface PartnerClaimStatsParams {
  baseMint: string;
  partner: string;
}

export interface PartnerClaimStatsResponse {
  claimableAmount: string;
  totalClaimed: string;
  baseMint: string;
  partner: string;
}

export interface PartnerClaimTxsRequest {
  baseMint: string;
  partner: string;
}

export interface PartnerClaimTxsResponse {
  transactions: string[];
}

// ────────────────────────────────────────────────────────────
// Types - Analytics
// ────────────────────────────────────────────────────────────

export interface LifetimeFeesParams {
  tokenMint: string;
}

export interface LifetimeFeesResponse {
  totalFees: string;
  tokenMint: string;
}

export interface TokenCreatorsParams {
  tokenMint: string;
}

export interface TokenCreatorsResponse {
  creators: Array<{
    address: string;
    share: number;
  }>;
}

export interface TokenClaimStatsParams {
  tokenMint: string;
}

export interface TokenClaimStatsResponse {
  claimers: Array<{
    claimer: string;
    totalClaimed: string;
    claimable: string;
  }>;
}

export interface TokenFeedParams {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface TokenFeedItem {
  tokenMint: string;
  name: string;
  symbol: string;
  status: string;
  createdAt: string;
  marketCap?: string;
  volume24h?: string;
}

export interface TokenFeedResponse {
  tokens: TokenFeedItem[];
  total: number;
}

// ────────────────────────────────────────────────────────────
// Types - State
// ────────────────────────────────────────────────────────────

export interface PoolInfoParams {
  tokenMint: string;
}

export interface PoolInfoResponse {
  poolAddress: string;
  tokenMint: string;
  baseMint: string;
  quoteMint: string;
  liquidity: string;
  price: string;
  volume24h: string;
}

export interface TokenStateParams {
  tokenMint: string;
}

export interface TokenStateResponse {
  tokenMint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  status: string;
  supply: string;
  decimals: number;
  metadata: Record<string, unknown>;
}

// ────────────────────────────────────────────────────────────
// Types - Agent Auth
// ────────────────────────────────────────────────────────────

export interface AgentAuthInitRequest {
  agentUsername: string;
}

export interface AgentAuthInitResponse {
  publicIdentifier: string;
  secret: string;
  postId: string;
}

export interface AgentAuthLoginRequest {
  publicIdentifier: string;
  secret: string;
  postId: string;
}

export interface AgentAuthLoginResponse {
  token: string;
  expiresAt: string;
}

export interface AgentWalletListRequest {
  token: string;
}

export interface AgentWalletListResponse {
  wallets: Array<{
    address: string;
    label: string;
  }>;
}

export interface AgentDevKeysRequest {
  token: string;
}

export interface AgentDevKeysResponse {
  keys: Array<{
    id: string;
    name: string;
    createdAt: string;
    lastUsed: string | null;
  }>;
}

export interface AgentDevKeysCreateRequest {
  token: string;
  name: string;
}

export interface AgentDevKeysCreateResponse {
  id: string;
  name: string;
  apiKey: string;
}

// ────────────────────────────────────────────────────────────
// Types - DexScreener
// ────────────────────────────────────────────────────────────

export interface DexScreenerOrderCreateRequest {
  tokenMint: string;
  payer: string;
  orderType: string;
  headerImage?: string;
  description?: string;
  links?: Array<{ label: string; url: string }>;
}

export interface DexScreenerOrderCreateResponse {
  orderId: string;
  paymentAmount: string;
  paymentAddress: string;
}

export interface DexScreenerOrderSubmitPaymentRequest {
  orderId: string;
  txSignature: string;
}

export interface DexScreenerOrderSubmitPaymentResponse {
  success: boolean;
  status: string;
}

// ────────────────────────────────────────────────────────────
// Types - Transaction
// ────────────────────────────────────────────────────────────

export interface TransactionSendRequest {
  signedTransaction: string;
}

export interface TransactionSendResponse {
  txSignature: string;
  status: string;
}

// ────────────────────────────────────────────────────────────
// Client
// ────────────────────────────────────────────────────────────

const BAGS_API_BASE = "https://public-api-v2.bags.fm/api/v1";

function getApiKey(): string | null {
  return process.env.BAGS_API_KEY || null;
}

function log(method: string, path: string, extra?: string) {
  logger.info({ method, path, extra }, "Bags API request");
}

async function request<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>,
): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new BagsApiError(0, "BAGS_API_KEY is not configured");
  }

  let url = `${BAGS_API_BASE}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) {
        params.set(k, String(v));
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  log(method, path, body ? JSON.stringify(body).slice(0, 120) : undefined);

  const headers: Record<string, string> = {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
    "User-Agent": "Aegis-Protocol/1.0",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = `Bags API error: ${res.status} ${res.statusText}`;
    try {
      const errBody = await res.json() as Record<string, unknown>;
      if (errBody.message) message = String(errBody.message);
      else if (errBody.error) message = String(errBody.error);
    } catch {
      // ignore parse error
    }
    throw new BagsApiError(res.status, message);
  }

  const json = await res.json() as Record<string, unknown>;
  // Bags API wraps responses in { success, response }
  if (json.success !== undefined && json.response !== undefined) {
    return json.response as T;
  }
  return json as T;
}

/** Safe wrapper: returns null instead of throwing when API key is missing */
async function safeRequest<T>(
  method: "GET" | "POST",
  path: string,
  body?: unknown,
  query?: Record<string, string | number | undefined>,
): Promise<T | null> {
  try {
    return await request<T>(method, path, body, query);
  } catch (err) {
    if (err instanceof BagsApiError && err.status === 0) {
      logger.warn("Bags API key not configured, returning null");
      return null;
    }
    throw err;
  }
}

// ────────────────────────────────────────────────────────────
// API Methods
// ────────────────────────────────────────────────────────────

export const bags = {
  // ── Token Launch ──
  tokenLaunch: {
    createInfo: (data: CreateTokenInfoRequest) =>
      request<CreateTokenInfoResponse>("POST", "/token-launch/create-info", data),

    createLaunchTx: (data: CreateLaunchTxRequest) =>
      request<CreateLaunchTxResponse>("POST", "/token-launch/create-launch-tx", data),

    lifetimeFees: (params: LifetimeFeesParams) =>
      safeRequest<LifetimeFeesResponse>("GET", "/token-launch/lifetime-fees", undefined, {
        tokenMint: params.tokenMint,
      }),

    creators: (params: TokenCreatorsParams) =>
      safeRequest<TokenCreatorsResponse>("GET", "/token-launch/creator/v3", undefined, {
        tokenMint: params.tokenMint,
      }),

    claimStats: (params: TokenClaimStatsParams) =>
      safeRequest<TokenClaimStatsResponse>("GET", "/token-launch/claim-stats", undefined, {
        tokenMint: params.tokenMint,
      }),

    feed: () =>
      safeRequest<TokenFeedResponse>("GET", "/token-launch/feed"),
  },

  // ── Trading ──
  trade: {
    quote: (params: TradeQuoteParams) =>
      safeRequest<TradeQuoteResponse>("GET", "/trade/quote", undefined, {
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        slippageBps: params.slippageBps,
      }),

    swapTx: (data: SwapTxRequest) =>
      request<SwapTxResponse>("POST", "/trade/swap-tx", data),
  },

  // ── Fee Sharing ──
  feeShare: {
    createConfig: (data: CreateFeeShareConfigRequest) =>
      request<CreateFeeShareConfigResponse>("POST", "/fee-share/config/create-v2", data),

    updateConfig: (data: UpdateFeeShareConfigRequest) =>
      request<UpdateFeeShareConfigResponse>("POST", "/fee-share/admin/update-config", data),

    adminList: (wallet: string) =>
      safeRequest<FeeShareAdminListResponse>("GET", "/fee-share/admin/list", undefined, {
        wallet,
      }),

    transferAdmin: (data: TransferAdminRequest) =>
      request<TransferAdminResponse>("POST", "/fee-share/admin/transfer-tx", data),

    claimEvents: (params: ClaimEventsParams) =>
      safeRequest<ClaimEventsResponse>("GET", "/fee-share/token/claim-events", undefined, {
        baseMint: params.baseMint,
        claimer: params.claimer,
        limit: params.limit,
        offset: params.offset,
      }),
  },

  // ── Partner Fees ──
  partnerFees: {
    createConfig: (data: CreatePartnerConfigRequest) =>
      request<CreatePartnerConfigResponse>("POST", "/partner-fees/create-config", data),

    getConfig: (params: PartnerConfigParams) =>
      safeRequest<PartnerConfigResponse>("GET", "/partner-fees/config", undefined, {
        baseMint: params.baseMint,
        partner: params.partner,
      }),

    claimStats: (params: PartnerClaimStatsParams) =>
      safeRequest<PartnerClaimStatsResponse>("GET", "/partner-fees/claim-stats", undefined, {
        baseMint: params.baseMint,
        partner: params.partner,
      }),

    claimTxs: (data: PartnerClaimTxsRequest) =>
      request<PartnerClaimTxsResponse>("POST", "/partner-fees/claim-txs", data),
  },

  // ── State ──
  pool: {
    byTokenMint: (params: PoolInfoParams) =>
      safeRequest<PoolInfoResponse>("GET", "/pool/by-token-mint", undefined, {
        tokenMint: params.tokenMint,
      }),
  },

  token: {
    state: (params: TokenStateParams) =>
      safeRequest<TokenStateResponse>("GET", "/token/state", undefined, {
        tokenMint: params.tokenMint,
      }),
  },

  // ── Agent Auth ──
  agent: {
    authInit: (data: AgentAuthInitRequest) =>
      request<AgentAuthInitResponse>("POST", "/agent/auth/init", data),

    authLogin: (data: AgentAuthLoginRequest) =>
      request<AgentAuthLoginResponse>("POST", "/agent/auth/login", data),

    walletList: (data: AgentWalletListRequest) =>
      request<AgentWalletListResponse>("POST", "/agent/wallet/list", data),

    devKeys: (data: AgentDevKeysRequest) =>
      request<AgentDevKeysResponse>("POST", "/agent/dev/keys", data),

    devKeysCreate: (data: AgentDevKeysCreateRequest) =>
      request<AgentDevKeysCreateResponse>("POST", "/agent/dev/keys/create", data),
  },

  // ── DexScreener ──
  dexscreener: {
    orderCreate: (data: DexScreenerOrderCreateRequest) =>
      request<DexScreenerOrderCreateResponse>("POST", "/dexscreener/order/create", data),

    orderSubmitPayment: (data: DexScreenerOrderSubmitPaymentRequest) =>
      request<DexScreenerOrderSubmitPaymentResponse>("POST", "/dexscreener/order/submit-payment", data),
  },

  // ── Transaction ──
  transaction: {
    send: (data: TransactionSendRequest) =>
      request<TransactionSendResponse>("POST", "/transaction/send", data),
  },
} as const;

export default bags;
