/**
 * Batch Settlement Engine
 *
 * Accumulates invocations in a rolling window and settles them
 * as a single batched Solana transaction every N seconds or M invocations.
 *
 * Cost savings:
 * - Individual: $0.00025/tx x 1000 invocations = $0.25
 * - Batched (8 per tx): $0.00025/tx x 125 batches = $0.03125
 * - Savings: 87.5%
 *
 * Trade-off: Settlement latency increases from ~400ms to ~5-30s
 * Configurable per operator: some want instant, some want cheap.
 */

export interface PendingInvocation {
  invocationId: number;
  operatorSlug: string;
  callerWallet: string;
  creatorWallet: string;
  amount: number; // USDC lamports (6 decimals)
  timestamp: number;
  feeSplit: {
    creator: number;
    validators: number;
    stakers: number;
    treasury: number;
    insurance: number;
    burned: number;
  };
}

export interface BatchResult {
  batchId: string;
  txSignature: string;
  invocationCount: number;
  totalAmount: number;
  settledAt: number;
  computeUnits: number;
}

export interface BatchConfig {
  maxBatchSize: number; // Max invocations per batch (default 8)
  maxWaitMs: number; // Max time before force-settling (default 10000)
  minBatchSize: number; // Don't settle less than this (default 2)
  priorityFeeLamports: number; // Priority fee for faster inclusion (default 1000)
}

const DEFAULT_CONFIG: BatchConfig = {
  maxBatchSize: 8,
  maxWaitMs: 10_000,
  minBatchSize: 2,
  priorityFeeLamports: 1_000,
};

class BatchSettlementEngine {
  private pending: PendingInvocation[] = [];
  private config: BatchConfig;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private batchCount = 0;
  private onSettle?: (result: BatchResult) => void;

  constructor(
    config: Partial<BatchConfig> = {},
    onSettle?: (result: BatchResult) => void
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.onSettle = onSettle;
  }

  /**
   * Add an invocation to the pending batch
   */
  enqueue(invocation: PendingInvocation): void {
    this.pending.push(invocation);

    // If we hit max batch size, settle immediately
    if (this.pending.length >= this.config.maxBatchSize) {
      this.settle();
      return;
    }

    // Start timer if this is the first in the batch
    if (this.pending.length === 1) {
      this.timer = setTimeout(() => this.settle(), this.config.maxWaitMs);
    }
  }

  /**
   * Force settle all pending invocations
   */
  async settle(): Promise<BatchResult | null> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.length === 0) return null;

    const batch = this.pending.splice(0, this.config.maxBatchSize);
    this.batchCount++;

    const batchId = `batch_${Date.now()}_${this.batchCount}`;
    const totalAmount = batch.reduce((sum, inv) => sum + inv.amount, 0);

    // Aggregate fee splits
    const aggregatedFees = batch.reduce(
      (acc, inv) => ({
        creator: acc.creator + inv.feeSplit.creator,
        validators: acc.validators + inv.feeSplit.validators,
        stakers: acc.stakers + inv.feeSplit.stakers,
        treasury: acc.treasury + inv.feeSplit.treasury,
        insurance: acc.insurance + inv.feeSplit.insurance,
        burned: acc.burned + inv.feeSplit.burned,
      }),
      {
        creator: 0,
        validators: 0,
        stakers: 0,
        treasury: 0,
        insurance: 0,
        burned: 0,
      }
    );

    // Calculate compute units needed
    // Each invocation's on-chain settlement needs ~50K CU
    // Batch overhead: ~10K CU
    const computeUnits = 10_000 + batch.length * 50_000;

    // In production, this would:
    // 1. Build a Solana transaction with SetComputeUnitLimit + SetComputeUnitPrice
    // 2. Add N invoke_skill instructions (one per invocation)
    // 3. Sign with the protocol authority keypair
    // 4. Send and confirm

    const result: BatchResult = {
      batchId,
      txSignature: `sim_${batchId}_${Math.random().toString(36).slice(2, 10)}`,
      invocationCount: batch.length,
      totalAmount,
      settledAt: Date.now(),
      computeUnits,
    };

    this.onSettle?.(result);
    return result;
  }

  /**
   * Get current batch stats
   */
  getStats(): {
    pendingCount: number;
    pendingAmount: number;
    totalBatches: number;
    config: BatchConfig;
  } {
    return {
      pendingCount: this.pending.length,
      pendingAmount: this.pending.reduce((sum, inv) => sum + inv.amount, 0),
      totalBatches: this.batchCount,
      config: this.config,
    };
  }

  /**
   * Drain all pending without settling (for shutdown)
   */
  drain(): PendingInvocation[] {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return this.pending.splice(0);
  }
}

export { BatchSettlementEngine };
export default BatchSettlementEngine;
