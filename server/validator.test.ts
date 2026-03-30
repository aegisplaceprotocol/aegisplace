import { describe, it, expect } from "vitest";
import { validateInvocation, calculateFees } from "./validator";

describe("validateInvocation", () => {
  it("returns high score for fast, successful response with content", () => {
    const result = validateInvocation({
      responseMs: 300,
      statusCode: 200,
      responseBody: { data: "some result", count: 42 },
    });
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.trustDelta).toBeGreaterThan(0);
    expect(result.flags).toHaveLength(0);
  });

  it("returns low score for server error", () => {
    const result = validateInvocation({
      responseMs: 1000,
      statusCode: 500,
      responseBody: { error: "Internal server error" },
    });
    expect(result.score).toBeLessThan(65);
    expect(result.trustDelta).toBeLessThanOrEqual(0);
    expect(result.flags).toContain("server_error");
  });

  it("flags slow responses", () => {
    const result = validateInvocation({
      responseMs: 8000,
      statusCode: 200,
      responseBody: { result: "ok" },
    });
    expect(result.flags).toContain("slow_response");
  });

  it("flags empty responses", () => {
    const result = validateInvocation({
      responseMs: 500,
      statusCode: 200,
      responseBody: null,
    });
    expect(result.flags).toContain("empty_response");
  });

  it("checks schema compliance when schema is provided", () => {
    const result = validateInvocation({
      responseMs: 400,
      statusCode: 200,
      responseBody: { name: "test" },
      expectedSchema: { name: "string", score: "number", data: "array" },
    });
    // Only 1 of 3 expected keys present
    expect(result.breakdown.schema).toBeLessThan(50);
    expect(result.flags).toContain("schema_mismatch");
  });

  it("gives benefit of doubt when no schema defined", () => {
    const result = validateInvocation({
      responseMs: 400,
      statusCode: 200,
      responseBody: { anything: "goes" },
    });
    expect(result.breakdown.schema).toBe(80);
  });

  it("handles rate limited responses", () => {
    const result = validateInvocation({
      responseMs: 100,
      statusCode: 429,
      responseBody: { error: "rate limited" },
    });
    expect(result.breakdown.status).toBe(40);
  });
});

describe("calculateFees", () => {
  it("splits fees correctly at 60/15/12/8/3/2", () => {
    const fees = calculateFees(1.0);
    expect(fees.creator).toBe(0.60);
    expect(fees.validators).toBe(0.15);
    expect(fees.stakers).toBe(0.12);
    expect(fees.treasury).toBe(0.08);
    expect(fees.insurance).toBe(0.03);
    expect(fees.burn).toBe(0.02);
  });

  it("handles small amounts", () => {
    const fees = calculateFees(0.003);
    expect(fees.creator).toBeCloseTo(0.0018, 4);
    expect(fees.validators).toBeCloseTo(0.00045, 5);
    expect(fees.stakers).toBeCloseTo(0.00036, 5);
    expect(fees.treasury).toBeCloseTo(0.00024, 5);
    expect(fees.insurance).toBeCloseTo(0.00009, 5);
    expect(fees.burn).toBeCloseTo(0.00006, 5);
  });

  it("sums to approximately the input", () => {
    const amount = 0.05;
    const fees = calculateFees(amount);
    const total = fees.creator + fees.validators + fees.stakers + fees.treasury + fees.insurance + fees.burn;
    expect(total).toBeCloseTo(amount, 6);
  });
});
