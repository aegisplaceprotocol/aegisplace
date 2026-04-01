import { describe, it, expect, vi } from "vitest";

// Mock @solana/web3.js
vi.mock("@solana/web3.js", () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getTransaction: vi.fn().mockResolvedValue(null),
    getConfirmedTransaction: vi.fn().mockResolvedValue(null),
  })),
  PublicKey: vi.fn().mockImplementation((key: string) => ({
    toBase58: () => key,
    toBuffer: () => Buffer.from(key),
    toString: () => key,
  })),
}));

describe("Solana payment verification", () => {
  it("exports verifyPayment function", async () => {
    const mod = await import("./solana");
    expect(typeof mod.verifyPayment).toBe("function");
  });

  it("returns error when transaction not found", async () => {
    const { verifyPayment } = await import("./solana");
    const result = await verifyPayment(
      "fakeTxSignature12345678901234567890123456789012345678901234567890",
      0.05,
      "senderWallet123",
      "treasuryWallet456"
    );
    expect(result.verified).toBe(false);
    expect(result.error).toBeDefined();
  });
});
