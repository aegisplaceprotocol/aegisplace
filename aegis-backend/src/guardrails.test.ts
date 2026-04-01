import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Guardrails module", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("checkInput returns passed when guardrails disabled", async () => {
    vi.stubEnv("GUARDRAILS_ENABLED", "false");
    const { checkInput } = await import("./guardrails");
    const result = await checkInput("code-review", { prompt: "test" });
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
    expect(result.latencyMs).toBe(0);
  });

  it("checkOutput returns passed when guardrails disabled", async () => {
    vi.stubEnv("GUARDRAILS_ENABLED", "false");
    const { checkOutput } = await import("./guardrails");
    const result = await checkOutput("code-review", { response: "test output" });
    expect(result.passed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("checkInput fails open when server unreachable", async () => {
    vi.stubEnv("GUARDRAILS_ENABLED", "true");
    vi.stubEnv("GUARDRAILS_SERVER_URL", "http://localhost:59999");
    const { checkInput } = await import("./guardrails");
    const result = await checkInput("code-review", { prompt: "test" });
    // Should fail open (return passed) when server is unreachable
    expect(result.passed).toBe(true);
  });

  it("checkOutput fails open when server unreachable", async () => {
    vi.stubEnv("GUARDRAILS_ENABLED", "true");
    vi.stubEnv("GUARDRAILS_SERVER_URL", "http://localhost:59999");
    const { checkOutput } = await import("./guardrails");
    const result = await checkOutput("security-audit", { response: "clean" });
    expect(result.passed).toBe(true);
  });
});
