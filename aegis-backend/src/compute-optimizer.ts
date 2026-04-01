/**
 * Solana Compute Budget Optimizer
 *
 * Dynamically calculates optimal compute unit limits and priority fees
 * based on recent network conditions. Prevents overpaying for compute
 * while ensuring transactions land.
 *
 * Uses a sliding window of recent transaction data to:
 * - Set compute unit limits tight (avoid waste)
 * - Set priority fees based on network congestion
 * - Detect high-congestion periods and adjust
 */

export interface ComputeEstimate {
  computeUnits: number;
  priorityFeePerCu: number; // microlamports per CU
  totalPriorityFee: number; // lamports
  baseFee: number; // lamports (5000 per signature)
  totalCost: number; // lamports
  totalCostUsd: number; // approximate USD cost
  confidence: "high" | "medium" | "low";
}

interface TransactionRecord {
  computeUsed: number;
  priorityFee: number;
  landed: boolean;
  timestamp: number;
  instructionType: string;
}

const SOL_PRICE_USD = 150; // Approximate, would be fetched from oracle
const LAMPORTS_PER_SOL = 1_000_000_000;

// Known compute costs per instruction type (from testing)
const COMPUTE_ESTIMATES: Record<string, { base: number; perAccount: number }> =
  {
    invoke_skill: { base: 45_000, perAccount: 2_000 },
    register_operator: { base: 25_000, perAccount: 1_500 },
    register_dependency: { base: 30_000, perAccount: 1_500 },
    deposit_royalty: { base: 40_000, perAccount: 2_000 },
    claim_royalties: { base: 35_000, perAccount: 1_800 },
    create_proposal: { base: 30_000, perAccount: 1_500 },
    cast_vote: { base: 20_000, perAccount: 1_000 },
    batch_settlement: { base: 10_000, perAccount: 50_000 }, // per invocation in batch
  };

class ComputeBudgetOptimizer {
  private history: TransactionRecord[] = [];
  private readonly windowSize = 100; // Keep last 100 txs

  /**
   * Record a completed transaction for learning
   */
  record(tx: TransactionRecord): void {
    this.history.push(tx);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }
  }

  /**
   * Estimate compute budget for an instruction
   */
  estimate(
    instructionType: string,
    accountCount: number = 10
  ): ComputeEstimate {
    const known = COMPUTE_ESTIMATES[instructionType];

    // Base estimate from known costs
    let computeUnits: number;
    if (known) {
      computeUnits = known.base + known.perAccount * accountCount;
    } else {
      computeUnits = 200_000; // Conservative default
    }

    // Add 20% safety margin
    computeUnits = Math.ceil(computeUnits * 1.2);

    // Cap at 1.4M (Solana limit)
    computeUnits = Math.min(computeUnits, 1_400_000);

    // Calculate priority fee based on recent network conditions
    const recentLanded = this.history.filter(
      (tx) => tx.landed && tx.timestamp > Date.now() - 300_000
    );

    let priorityFeePerCu: number;
    let confidence: "high" | "medium" | "low";

    if (recentLanded.length >= 10) {
      // Use p75 of recent successful priority fees
      const fees = recentLanded
        .map((tx) => tx.priorityFee / Math.max(1, tx.computeUsed))
        .sort((a, b) => a - b);
      const p75Index = Math.floor(fees.length * 0.75);
      priorityFeePerCu = Math.ceil(fees[p75Index]);
      confidence = "high";
    } else if (recentLanded.length >= 3) {
      const avgFee =
        recentLanded.reduce((sum, tx) => sum + tx.priorityFee, 0) /
        recentLanded.length;
      priorityFeePerCu = Math.ceil(avgFee / 200_000); // Normalize to per-CU
      confidence = "medium";
    } else {
      // Default: 1000 microlamports per CU (reasonable for Solana)
      priorityFeePerCu = 1000;
      confidence = "low";
    }

    // Minimum 100 microlamports/CU
    priorityFeePerCu = Math.max(100, priorityFeePerCu);

    const totalPriorityFee = Math.ceil(
      (computeUnits * priorityFeePerCu) / 1_000_000
    );
    const baseFee = 5000; // 5000 lamports per signature
    const totalCost = baseFee + totalPriorityFee;
    const totalCostUsd = (totalCost / LAMPORTS_PER_SOL) * SOL_PRICE_USD;

    return {
      computeUnits,
      priorityFeePerCu,
      totalPriorityFee,
      baseFee,
      totalCost,
      totalCostUsd: parseFloat(totalCostUsd.toFixed(8)),
      confidence,
    };
  }

  /**
   * Estimate batch settlement cost
   */
  estimateBatch(
    invocationCount: number
  ): ComputeEstimate & {
    costPerInvocation: number;
    savingsVsIndividual: string;
  } {
    const batchEstimate = this.estimate("batch_settlement", invocationCount);
    const individualEstimate = this.estimate("invoke_skill", 10);

    const individualTotal = individualEstimate.totalCost * invocationCount;
    const savings = 1 - batchEstimate.totalCost / individualTotal;

    return {
      ...batchEstimate,
      costPerInvocation: Math.ceil(batchEstimate.totalCost / invocationCount),
      savingsVsIndividual: `${(savings * 100).toFixed(1)}%`,
    };
  }

  /**
   * Get optimizer stats
   */
  getStats(): {
    samplesInWindow: number;
    avgComputeUsed: number;
    avgPriorityFee: number;
    landingRate: string;
  } {
    if (this.history.length === 0) {
      return {
        samplesInWindow: 0,
        avgComputeUsed: 0,
        avgPriorityFee: 0,
        landingRate: "N/A",
      };
    }

    const landed = this.history.filter((tx) => tx.landed);
    return {
      samplesInWindow: this.history.length,
      avgComputeUsed: Math.round(
        this.history.reduce((s, tx) => s + tx.computeUsed, 0) /
          this.history.length
      ),
      avgPriorityFee: Math.round(
        this.history.reduce((s, tx) => s + tx.priorityFee, 0) /
          this.history.length
      ),
      landingRate: `${((landed.length / this.history.length) * 100).toFixed(1)}%`,
    };
  }
}

export { ComputeBudgetOptimizer };
export default ComputeBudgetOptimizer;
