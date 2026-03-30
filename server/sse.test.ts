import { describe, it, expect } from "vitest";

describe("SSE module", () => {
  it("exports handleSSE and broadcastEvent", async () => {
    const mod = await import("./sse");
    expect(typeof mod.handleSSE).toBe("function");
    expect(typeof mod.broadcastEvent).toBe("function");
  });

  it("broadcastEvent does not throw with no connected clients", async () => {
    const { broadcastEvent } = await import("./sse");
    expect(() =>
      broadcastEvent("invocation", {
        operatorSlug: "test-op",
        callerWallet: "wallet123",
        amount: "0.025",
        success: true,
      })
    ).not.toThrow();
  });
});
