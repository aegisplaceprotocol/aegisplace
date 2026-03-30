/**
 * Rate Limiting Middleware for Aegis Protocol
 *
 * Provides tiered rate limits for different API surfaces:
 * - Global: 200 req / 15 min (matches existing config in index.ts)
 * - Invoke: 30 req / min per IP (tighter for paid endpoints)
 * - Auth: 10 req / 15 min (brute-force protection)
 * - MCP: 60 req / min
 * - Discovery: 120 req / min (read-heavy, generous)
 *
 * Uses express-rate-limit which is already a project dependency.
 * This module centralises the limiters so they can be imported from
 * one place instead of being defined inline in index.ts.
 */

import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import type { Request } from "express";

// ── Key extractor ─────────────────────────────────────────────

/**
 * Derive a per-client key from the request.
 * Prefers X-Payer-Wallet (wallet-based identity) then falls back to IP.
 */
function clientKey(req: Request): string {
  // Always include IP to prevent header-spoofing rate limit bypass
  const ip = req.ip || "unknown";
  const wallet = req.headers["x-payer-wallet"] as string | undefined;
  if (wallet && wallet.length >= 32) return `${ip}:wallet:${wallet}`;
  return ip;
}

// ── Limiters ──────────────────────────────────────────────────

/** Global fallback limiter -- 200 requests per 15 minutes per IP. */
export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

/** Auth endpoints -- 10 requests per 15 minutes (brute-force protection). */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

/** MCP endpoint -- 60 requests per minute. */
export const mcpLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MCP rate limit exceeded." },
});

/**
 * Invoke endpoint -- 30 requests per minute per client.
 * Uses wallet address when available so that agents sharing an IP
 * (e.g. behind a gateway) get independent quotas.
 */
export const invokeLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, trustProxy: false, ip: false, keyGeneratorIpFallback: false },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    return `invoke:${ip}`;
  },
  message: {
    error: "Invoke rate limit exceeded. Max 30 calls per minute.",
    retryAfterMs: 60_000,
  },
});

/** Discovery / read-only endpoints -- 120 per minute. */
export const discoveryLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Discovery rate limit exceeded." },
});

export default {
  globalLimiter,
  authLimiter,
  mcpLimiter,
  invokeLimiter,
  discoveryLimiter,
};
