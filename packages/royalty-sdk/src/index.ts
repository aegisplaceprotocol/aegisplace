/**
 * @aegis/royalty-sdk
 *
 * On-chain composable royalty system for Aegis Protocol skill dependencies.
 * Works with both the REST API backend and exposes helpers for constructing
 * Solana transactions.
 *
 * Compatible with Node.js (18+) and modern browser environments.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A directed edge in the dependency graph, representing one skill depending
 * on another and the royalty terms that apply.
 */
export interface DependencyEdge {
  /** The upstream skill that is being depended upon. */
  parentSkillSlug: string;
  /** The downstream skill that declares the dependency. */
  childSkillSlug: string;
  /** Solana wallet address of the parent skill's creator. */
  parentCreatorWallet: string;
  /** Solana wallet address of the child skill's creator. */
  childCreatorWallet: string;
  /**
   * Royalty rate expressed in basis points (1 bps = 0.01 %).
   * E.g. 500 = 5 %.
   */
  royaltyBps: number;
  /**
   * How many hops away this parent is from the originating invocation.
   * Direct parents are depth 1; grandparents are depth 2; etc.
   */
  depth: number;
  /** ISO-8601 timestamp at which this edge was registered on-chain. */
  registeredAt: string;
}

/**
 * Cumulative royalty earnings for a creator wallet.
 * Amounts are expressed in USDC base units (1 USDC = 1_000_000 units).
 */
export interface RoyaltyEarnings {
  /** Royalties earned but not yet claimed. */
  unclaimed: number;
  /** All-time total royalties earned (claimed + unclaimed). */
  totalEarned: number;
  /** All-time total royalties that have been claimed. */
  totalClaimed: number;
  /** The most recent royalty payment events. */
  recentPayments: RoyaltyPayment[];
  /**
   * The child skills that have contributed the most royalties to this wallet,
   * sorted descending by total paid.
   */
  topSources: { skillName: string; slug: string; totalPaid: number }[];
}

/**
 * A single royalty payment event recorded on the protocol.
 */
export interface RoyaltyPayment {
  /** The skill whose invocation triggered the payment. */
  childSkillSlug: string;
  /** The upstream skill that received (or will receive) the payment. */
  parentSkillSlug: string;
  /** Payment amount in USDC base units. */
  amount: number;
  /** Ancestry depth at the time of the triggering invocation. */
  depth: number;
  /** ISO-8601 timestamp of the payment event. */
  timestamp: string;
  /** Lifecycle state of the payment. */
  status: 'pending' | 'deposited' | 'claimed';
}

/**
 * A node in the recursive dependency tree for a skill.
 */
export interface DependencyTree {
  /** Human-readable skill name. */
  skill: string;
  /** URL-safe identifier for the skill. */
  slug: string;
  /**
   * Royalty rate (bps) this node charges its child.
   * Present on every node except the root.
   */
  royaltyBps?: number;
  /**
   * Depth of this node relative to the root skill queried.
   * Present on every node except the root.
   */
  depth?: number;
  /** Upstream ancestors this skill itself depends on. */
  parents: DependencyTree[];
}

/** Protocol-wide aggregate statistics. */
export interface RoyaltyStats {
  /** Total number of registered dependency edges across all skills. */
  totalDependencies: number;
  /** Cumulative USDC (base units) distributed as royalties since genesis. */
  totalRoyaltiesDistributed: number;
  /** USDC (base units) currently held in escrow, pending claim. */
  totalUnclaimed: number;
  /** Mean royalty rate (bps) across all active dependency edges. */
  avgRoyaltyBps: number;
}

/** A single row in the royalty earnings leaderboard. */
export interface RoyaltyLeaderboardEntry {
  rank: number;
  skillName: string;
  slug: string;
  /** Cumulative USDC base units earned by this skill as a dependency. */
  totalRoyaltiesEarned: number;
  /** Number of distinct downstream skills that depend on this skill. */
  totalDependents: number;
  creatorWallet: string;
}

// ---------------------------------------------------------------------------
// Error type
// ---------------------------------------------------------------------------

/**
 * Thrown when the Aegis Royalties API returns a non-2xx response or an
 * otherwise malformed payload.
 */
export class AegisRoyaltiesError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'AegisRoyaltiesError';
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Main SDK class
// ---------------------------------------------------------------------------

/**
 * Client for the Aegis Skill Royalties REST API.
 *
 * @example
 * ```ts
 * import { AegisRoyalties } from '@aegis/royalty-sdk';
 *
 * const client = new AegisRoyalties({ apiKey: process.env.AEGIS_API_KEY });
 *
 * // Register a dependency
 * const { edge } = await client.registerDependency({
 *   parentSkillSlug: 'web-search',
 *   childSkillSlug:  'research-agent',
 *   royaltyBps:      500,           // 5 %
 *   childCreatorWallet: 'AbCd…',
 * });
 *
 * // Check earnings
 * const earnings = await client.getCreatorEarnings('AbCd…');
 * console.log(earnings.unclaimed);  // USDC base units
 * ```
 */
export class AegisRoyalties {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(config: { baseUrl?: string; apiKey?: string } = {}) {
    this.baseUrl = (config.baseUrl ?? 'https://aegisplace.com/api/royalties').replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  // ── Internal fetch helper ─────────────────────────────────────────────────

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      ...((options?.headers as Record<string, string>) ?? {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, { ...options, headers });

    if (!res.ok) {
      const error = await res
        .json()
        .catch(() => ({ message: res.statusText })) as { message?: string };
      throw new AegisRoyaltiesError(
        `Aegis Royalties API error ${res.status}: ${error.message ?? res.statusText}`,
        res.status,
      );
    }

    return res.json() as Promise<T>;
  }

  // ── Dependency management ─────────────────────────────────────────────────

  /**
   * Register a dependency edge: declare that `childSkillSlug` depends on
   * `parentSkillSlug` and that the child's creator accepts paying
   * `royaltyBps` basis points to the parent creator on every invocation.
   *
   * The parent's `parentCreatorWallet` is resolved server-side from the
   * parent skill record; only the child's wallet is required here.
   *
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async registerDependency(params: {
    parentSkillSlug: string;
    childSkillSlug: string;
    royaltyBps: number;
    childCreatorWallet: string;
  }): Promise<{ success: boolean; edge: DependencyEdge }> {
    return this.fetch<{ success: boolean; edge: DependencyEdge }>(
      '/dependencies',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
    );
  }

  /**
   * Remove a previously registered dependency edge.
   * Only the child creator's wallet may authorise removal.
   *
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async removeDependency(params: {
    parentSkillSlug: string;
    childSkillSlug: string;
    childCreatorWallet: string;
  }): Promise<{ success: boolean }> {
    return this.fetch<{ success: boolean }>('/dependencies', {
      method: 'DELETE',
      body: JSON.stringify(params),
    });
  }

  // ── Dependency graph queries ──────────────────────────────────────────────

  /**
   * Recursively resolve the full upstream dependency tree for `skillSlug`.
   * The returned tree can be walked to enumerate all ancestors and their
   * royalty terms.
   *
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async getDependencyTree(skillSlug: string): Promise<DependencyTree> {
    const encoded = encodeURIComponent(skillSlug);
    return this.fetch<DependencyTree>(`/tree/${encoded}`);
  }

  // ── Earnings & claims ─────────────────────────────────────────────────────

  /**
   * Fetch the cumulative royalty earnings summary for a creator wallet
   * address, including unclaimed balance, recent payments, and top sources.
   *
   * @param wallet - Base-58 encoded Solana public key.
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async getCreatorEarnings(wallet: string): Promise<RoyaltyEarnings> {
    const encoded = encodeURIComponent(wallet);
    return this.fetch<RoyaltyEarnings>(`/earnings/${encoded}`);
  }

  /**
   * Claim the caller's accumulated (unclaimed) royalties.
   *
   * When operating in an on-chain-verified mode, supply the `txSignature`
   * of a Solana transaction that proves wallet ownership or pre-authorises
   * the claim.  When omitted the API falls back to API-key authentication.
   *
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async claimRoyalties(params: {
    creatorWallet: string;
    /** Optional Solana transaction signature for on-chain verification. */
    txSignature?: string;
  }): Promise<{ success: boolean; amountClaimed: number }> {
    return this.fetch<{ success: boolean; amountClaimed: number }>('/claim', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ── Discovery ─────────────────────────────────────────────────────────────

  /**
   * Retrieve the leaderboard of skills ranked by all-time royalties earned.
   *
   * @param limit - Maximum number of entries to return (default: 20, max: 100).
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async getLeaderboard(limit = 20): Promise<RoyaltyLeaderboardEntry[]> {
    const clampedLimit = Math.min(Math.max(1, limit), 100);
    return this.fetch<RoyaltyLeaderboardEntry[]>(
      `/leaderboard?limit=${clampedLimit}`,
    );
  }

  /**
   * Retrieve protocol-wide aggregate statistics.
   *
   * @throws {AegisRoyaltiesError} on API or network failure.
   */
  async getStats(): Promise<RoyaltyStats> {
    return this.fetch<RoyaltyStats>('/stats');
  }
}

// ---------------------------------------------------------------------------
// Pure calculation helpers
// ---------------------------------------------------------------------------

/**
 * Depth-decay weights used when splitting a royalty pool among multiple
 * ancestors.  Index 0 = depth 1 (direct parent), index 1 = depth 2, etc.
 *
 * Each successive weight is 60 % of the previous one, capping at depth 5.
 */
const DEPTH_WEIGHTS: readonly number[] = [100, 60, 36, 22, 13] as const;

/**
 * Calculate the USDC (base units) that a specific ancestor at a given depth
 * would receive from a single invocation.
 *
 * The distribution model is:
 * 1. `creatorAmount = invocationAmount × creatorFeeBps / 10_000`
 *    (the portion of the invocation fee that flows to creators)
 * 2. `royaltyPool = creatorAmount × royaltyBps / 10_000`
 *    (the slice of the creator amount reserved for ancestor royalties)
 * 3. The royalty pool is then split proportionally among all ancestors
 *    using exponentially decaying weights (`depthWeights`).
 *
 * @param params.invocationAmount - Total invocation fee in USDC base units.
 * @param params.creatorFeeBps    - Protocol creator-fee rate in bps (default: 6000 = 60 %).
 * @param params.royaltyBps       - Dependency royalty rate in bps agreed between creator and ancestor.
 * @param params.depth            - 1-indexed depth of this ancestor in the tree (1 = direct parent).
 * @param params.totalAncestors   - Total number of ancestors being paid (determines weight normalisation).
 * @returns The USDC base-unit amount allocated to this ancestor, truncated to an integer.
 *
 * @example
 * ```ts
 * // Direct parent of a skill with 500 bps royalty, 3 ancestors total
 * const amount = calculateRoyaltyDistribution({
 *   invocationAmount: 1_000_000,  // 1 USDC
 *   creatorFeeBps:    6_000,      // 60 %
 *   royaltyBps:       500,        // 5 %
 *   depth:            1,
 *   totalAncestors:   3,
 * });
 * // creatorAmount = 1_000_000 × 0.60 = 600_000
 * // royaltyPool   = 600_000   × 0.05 = 30_000
 * // weights[0..2] = [100, 60, 36] → sum = 196
 * // share         = 30_000 × (100 / 196) ≈ 15_306
 * ```
 */
export function calculateRoyaltyDistribution(params: {
  invocationAmount: number;
  creatorFeeBps: number;
  royaltyBps: number;
  depth: number;
  totalAncestors: number;
}): number {
  const { invocationAmount, creatorFeeBps, royaltyBps, depth, totalAncestors } = params;

  if (depth < 1 || depth > DEPTH_WEIGHTS.length) {
    throw new RangeError(
      `depth must be between 1 and ${DEPTH_WEIGHTS.length}, got ${depth}`,
    );
  }
  if (totalAncestors < 1 || totalAncestors > DEPTH_WEIGHTS.length) {
    throw new RangeError(
      `totalAncestors must be between 1 and ${DEPTH_WEIGHTS.length}, got ${totalAncestors}`,
    );
  }
  if (depth > totalAncestors) {
    throw new RangeError(
      `depth (${depth}) cannot exceed totalAncestors (${totalAncestors})`,
    );
  }

  // Step 1: creator's portion of the invocation fee.
  const creatorAmount = (invocationAmount * creatorFeeBps) / 10_000;

  // Step 2: royalty pool carved out of the creator amount.
  const royaltyPool = (creatorAmount * royaltyBps) / 10_000;

  // Step 3: normalise by the sum of weights for all ancestors present.
  const weightSlice = DEPTH_WEIGHTS.slice(0, totalAncestors);
  const weightSum = weightSlice.reduce((acc, w) => acc + w, 0);

  // depth is 1-indexed; DEPTH_WEIGHTS is 0-indexed.
  const thisWeight = DEPTH_WEIGHTS[depth - 1];

  return Math.floor((royaltyPool * thisWeight) / weightSum);
}

// ---------------------------------------------------------------------------
// Solana transaction helpers
// ---------------------------------------------------------------------------

/**
 * Parameters required to build a royalty claim instruction.
 * Import `@solana/web3.js` at runtime to use the Solana helpers below.
 */
export interface ClaimInstructionParams {
  /** Base-58 encoded public key of the claimant (creator wallet). */
  creatorWallet: string;
  /**
   * Base-58 encoded public key of the USDC token account owned by
   * `creatorWallet` that should receive the claimed royalties.
   */
  destinationTokenAccount: string;
  /** USDC base units to claim (must match the amount held in escrow). */
  amount: number;
  /** Base-58 encoded public key of the Aegis Royalties program. */
  programId: string;
}

/**
 * Serialise a royalty claim into a minimal instruction-data buffer that
 * matches the Aegis on-chain program's `ClaimRoyalties` discriminator.
 *
 * The buffer layout is:
 * ```
 * [0]       - instruction discriminator (0x01 = ClaimRoyalties)
 * [1..8]    - amount as a little-endian uint64
 * ```
 *
 * This helper is intentionally dependency-free so that it can be used in
 * environments where `@solana/web3.js` is not bundled.  Callers are
 * responsible for assembling the full `TransactionInstruction` using the
 * keys and program-id from `ClaimInstructionParams`.
 *
 * @returns A `Uint8Array` containing the serialised instruction data.
 */
export function buildClaimInstructionData(amount: number): Uint8Array {
  const buf = new Uint8Array(9);
  // Discriminator byte for ClaimRoyalties
  buf[0] = 0x01;
  // Little-endian uint64 encoding of amount (safe for values < 2^53)
  let remaining = amount;
  for (let i = 1; i <= 8; i++) {
    buf[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }
  return buf;
}

/**
 * Derive the canonical program-derived address (PDA) for a creator's royalty
 * escrow account, given the Aegis Royalties program ID.
 *
 * This is an **async** helper that requires `@solana/web3.js` to be
 * available at runtime.  It dynamically imports the library so that
 * environments that do not need Solana integration are not forced to bundle
 * `@solana/web3.js`.
 *
 * @param creatorWallet - Base-58 encoded creator public key.
 * @param programId     - Base-58 encoded Aegis Royalties program ID.
 * @returns A tuple of `[pdaPublicKey, bump]`.
 *
 * @example
 * ```ts
 * const [escrowPda, bump] = await deriveRoyaltyEscrowPda(
 *   'AbCd…',
 *   'AEGSroyLTYFa…',
 * );
 * ```
 */
export async function deriveRoyaltyEscrowPda(
  creatorWallet: string,
  programId: string,
): Promise<[unknown, number]> {
  // Dynamic import keeps @solana/web3.js optional for non-Solana consumers.
  const web3 = await import('@solana/web3.js').catch(() => {
    throw new Error(
      'deriveRoyaltyEscrowPda requires @solana/web3.js to be installed. ' +
        'Add it as a dependency: npm install @solana/web3.js',
    );
  });

  const { PublicKey } = web3;

  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('royalty_escrow'),
      new PublicKey(creatorWallet).toBuffer(),
    ],
    new PublicKey(programId),
  );
}

/**
 * Build a complete Solana `Transaction` that claims all unclaimed royalties
 * for a creator wallet.
 *
 * Requires `@solana/web3.js` at runtime.
 *
 * @param params            - Claim instruction parameters.
 * @param recentBlockhash   - A recent blockhash to attach to the transaction.
 * @returns A `Transaction` object ready to be signed and submitted.
 */
export async function buildClaimTransaction(
  params: ClaimInstructionParams,
  recentBlockhash: string,
): Promise<unknown> {
  const web3 = await import('@solana/web3.js').catch(() => {
    throw new Error(
      'buildClaimTransaction requires @solana/web3.js to be installed. ' +
        'Add it as a dependency: npm install @solana/web3.js',
    );
  });

  const { PublicKey, Transaction, TransactionInstruction } = web3;

  const creatorKey = new PublicKey(params.creatorWallet);
  const destinationKey = new PublicKey(params.destinationTokenAccount);
  const programKey = new PublicKey(params.programId);

  const [escrowPda] = await PublicKey.findProgramAddressSync(
    [Buffer.from('royalty_escrow'), creatorKey.toBuffer()],
    programKey,
  );

  const data = buildClaimInstructionData(params.amount);

  const instruction = new TransactionInstruction({
    programId: programKey,
    keys: [
      { pubkey: creatorKey,    isSigner: true,  isWritable: false },
      { pubkey: escrowPda,     isSigner: false, isWritable: true  },
      { pubkey: destinationKey, isSigner: false, isWritable: true  },
    ],
    data: Buffer.from(data),
  });

  const tx = new Transaction();
  tx.recentBlockhash = recentBlockhash;
  tx.feePayer = creatorKey;
  tx.add(instruction);

  return tx;
}

// ---------------------------------------------------------------------------
// Convenience re-exports & constants
// ---------------------------------------------------------------------------

/** Semver version string of this SDK build. */
export const SDK_VERSION = '0.1.0';

/**
 * Default base URL for the Aegis Royalties REST API.
 * Override via `AegisRoyalties({ baseUrl: '...' })`.
 */
export const DEFAULT_BASE_URL = 'https://aegisplace.com/api/royalties';

/**
 * The default protocol creator fee expressed in basis points (60 %).
 * Pass this as `creatorFeeBps` to `calculateRoyaltyDistribution` unless
 * the protocol has been configured differently for a specific deployment.
 */
export const DEFAULT_CREATOR_FEE_BPS = 6_000;

/**
 * Maximum supported ancestor depth for royalty calculations.
 * Ancestors beyond this depth are not eligible for royalty payments.
 */
export const MAX_ROYALTY_DEPTH = DEPTH_WEIGHTS.length;
