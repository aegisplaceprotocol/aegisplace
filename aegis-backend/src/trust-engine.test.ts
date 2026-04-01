import { describe, it, expect, vi } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  listOperators: vi.fn().mockResolvedValue({ operators: [], total: 0 }),
  getActiveOperatorIds: vi.fn().mockResolvedValue([]),
  getInvocationsByOperator: vi.fn().mockResolvedValue([]),
  getReviewsByOperator: vi.fn().mockResolvedValue([]),
  getAverageRating: vi.fn().mockResolvedValue(null),
  getDisputeById: vi.fn().mockResolvedValue(null),
  listDisputes: vi.fn().mockResolvedValue([]),
  updateOperator: vi.fn().mockResolvedValue(undefined),
  getOperatorById: vi.fn().mockResolvedValue(null),
}));

describe("Trust Engine", () => {
  it("exports recalculateTrustScores function", async () => {
    const mod = await import("./trust-engine");
    expect(typeof mod.recalculateTrustScores).toBe("function");
  });

  it("exports getTrustBreakdown function", async () => {
    const mod = await import("./trust-engine");
    expect(typeof mod.getTrustBreakdown).toBe("function");
  });

  it("recalculateTrustScores completes without error", async () => {
    const { recalculateTrustScores } = await import("./trust-engine");
    await expect(recalculateTrustScores()).resolves.not.toThrow();
  });
});
