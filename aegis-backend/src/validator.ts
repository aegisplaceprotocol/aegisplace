/**
 * Aegis MVP Validator
 * Scores operator invocations based on response quality.
 * The trust score formula: weighted average of latency, status, and schema compliance.
 */

interface ValidationInput {
  responseMs: number;
  statusCode: number;
  responseBody: unknown;
  expectedSchema?: Record<string, unknown>;
}

interface ValidationResult {
  score: number;       // 0-100
  trustDelta: number;  // -10 to +3
  breakdown: {
    latency: number;
    status: number;
    schema: number;
    content: number;
  };
  flags: string[];
}

const WEIGHTS = {
  latency: 0.2,
  status: 0.3,
  schema: 0.25,
  content: 0.25,
};

function scoreLatency(ms: number): number {
  if (ms <= 500) return 100;
  if (ms <= 1000) return 90;
  if (ms <= 2000) return 75;
  if (ms <= 5000) return 50;
  if (ms <= 10000) return 25;
  return 10;
}

function scoreStatus(code: number): number {
  if (code >= 200 && code < 300) return 100;
  if (code === 429) return 40; // rate limited
  if (code >= 400 && code < 500) return 20;
  if (code >= 500) return 0;
  return 50;
}

function scoreSchema(body: unknown, schema?: Record<string, unknown>): number {
  if (!schema) return 80; // no schema defined, give benefit of doubt
  if (!body || typeof body !== "object") return 10;

  const expectedKeys = Object.keys(schema);
  if (expectedKeys.length === 0) return 80;

  const bodyObj = body as Record<string, unknown>;
  const presentKeys = expectedKeys.filter(k => k in bodyObj);
  const ratio = presentKeys.length / expectedKeys.length;

  return Math.round(ratio * 100);
}

function scoreContent(body: unknown): number {
  if (!body) return 0;
  if (typeof body === "string") {
    if (body.length === 0) return 0;
    if (body.length < 10) return 30;
    return 80;
  }
  if (typeof body === "object") {
    const keys = Object.keys(body as Record<string, unknown>);
    if (keys.length === 0) return 20;
    return 85;
  }
  return 60;
}

export function validateInvocation(input: ValidationInput): ValidationResult {
  const flags: string[] = [];

  const latency = scoreLatency(input.responseMs);
  const status = scoreStatus(input.statusCode);
  const schema = scoreSchema(input.responseBody, input.expectedSchema);
  const content = scoreContent(input.responseBody);

  if (input.responseMs > 5000) flags.push("slow_response");
  if (input.statusCode >= 500) flags.push("server_error");
  if (input.statusCode >= 400 && input.statusCode < 500) flags.push("client_error");
  if (schema < 50) flags.push("schema_mismatch");
  if (content < 30) flags.push("empty_response");

  const score = Math.round(
    latency * WEIGHTS.latency +
    status * WEIGHTS.status +
    schema * WEIGHTS.schema +
    content * WEIGHTS.content
  );

  // Trust delta: good scores slowly build trust, bad scores quickly erode it
  let trustDelta: number;
  if (score >= 90) trustDelta = 3;
  else if (score >= 75) trustDelta = 2;
  else if (score >= 60) trustDelta = 1;
  else if (score >= 40) trustDelta = 0;
  else if (score >= 20) trustDelta = -3;
  else trustDelta = -10;

  return {
    score,
    trustDelta,
    breakdown: { latency, status, schema, content },
    flags,
  };
}

/**
 * Calculate fee distribution for an invocation.
 * 60% creator, 15% validators, 12% stakers, 8% treasury, 3% insurance, 2% burn.
 */
export function calculateFees(amountUsdc: number) {
  return {
    creator: +(amountUsdc * 0.60).toFixed(8),
    validators: +(amountUsdc * 0.15).toFixed(8),
    stakers: +(amountUsdc * 0.12).toFixed(8),
    treasury: +(amountUsdc * 0.08).toFixed(8),
    insurance: +(amountUsdc * 0.03).toFixed(8),
    burn: +(amountUsdc * 0.02).toFixed(8),
  };
}
