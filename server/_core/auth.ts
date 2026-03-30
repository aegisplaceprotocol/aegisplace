/**
 * Solana wallet-sign authentication.
 *
 * Flow:
 *   1. GET  /api/auth/nonce?wallet=<base58>  → { nonce }
 *   2. POST /api/auth/verify  { wallet, signature, nonce }  → sets session cookie
 *
 * The server stores nonces in memory (short-lived, 5 min TTL).
 * Signature is verified with tweetnacl / ed25519.
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const";
import type { Express, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";

// ── Nonce store (in-memory, auto-expires) ──────────────────────────

const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_NONCE_STORE_SIZE = 10_000;
const nonceStore = new Map<string, { nonce: string; createdAt: number }>();

function cleanExpiredNonces() {
  const now = Date.now();
  nonceStore.forEach((entry, key) => {
    if (now - entry.createdAt > NONCE_TTL_MS) nonceStore.delete(key);
  });
}

// Periodic cleanup every 60 s
setInterval(cleanExpiredNonces, 60_000);

// ── JWT helpers ────────────────────────────────────────────────────

const getSecret = () => new TextEncoder().encode(ENV.jwtSecret);

export async function createSessionToken(wallet: string): Promise<string> {
  return new SignJWT({ wallet })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string
): Promise<{ wallet: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { wallet: string };
  } catch {
    return null;
  }
}

// ── Signature verification (ed25519 via tweetnacl) ─────────────────

async function verifySignature(
  wallet: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    // Dynamic import so the module is optional at type-check time
    const nacl = await import("tweetnacl");
    const bs58 = await import("bs58");

    const publicKey = bs58.default.decode(wallet);
    const sig = bs58.default.decode(signature);
    const msg = new TextEncoder().encode(message);

    return nacl.default.sign.detached.verify(msg, sig, publicKey);
  } catch {
    return false;
  }
}

// ── Express routes ─────────────────────────────────────────────────

export function registerAuthRoutes(app: Express) {
  /** Step 1: Request a nonce for the given wallet */
  app.get("/api/auth/nonce", (req: Request, res: Response) => {
    const wallet =
      typeof req.query.wallet === "string" ? req.query.wallet : undefined;

    if (!wallet || wallet.length < 32 || wallet.length > 64) {
      res.status(400).json({ error: "wallet query param required (32-64 chars)" });
      return;
    }

    if (nonceStore.size >= MAX_NONCE_STORE_SIZE) {
      cleanExpiredNonces();
      if (nonceStore.size >= MAX_NONCE_STORE_SIZE) {
        res.status(429).json({ error: "Too many pending auth requests" });
        return;
      }
    }
    const nonce = nanoid(32);
    nonceStore.set(wallet, { nonce, createdAt: Date.now() });
    res.json({ nonce });
  });

  /** Step 2: Verify signed nonce and issue session */
  app.post("/api/auth/verify", async (req: Request, res: Response) => {
    const { wallet, signature, nonce } = req.body ?? {};

    if (!wallet || !signature || !nonce) {
      res.status(400).json({ error: "wallet, signature, and nonce are required" });
      return;
    }

    // Check nonce exists and hasn't expired
    const stored = nonceStore.get(wallet);
    if (!stored || stored.nonce !== nonce) {
      res.status(401).json({ error: "Invalid or expired nonce" });
      return;
    }

    // Verify the wallet signed the expected message
    const message = `Sign in to Aegis Protocol\nNonce: ${nonce}`;
    const valid = await verifySignature(wallet, signature, message);

    if (!valid) {
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    // Consume nonce
    nonceStore.delete(wallet);

    // Upsert user
    const role = ENV.adminWallets.includes(wallet) ? "admin" : "user";
    await db.upsertUser({
      openId: wallet, // wallet address serves as the unique user identifier
      name: wallet.slice(0, 8),
      email: null,
      loginMethod: "wallet",
      lastSignedIn: new Date(),
    });

    // Issue session cookie
    const token = await createSessionToken(wallet);
    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: ONE_YEAR_MS });

    res.json({ success: true, wallet });
  });
}

// ── Middleware helper: resolve user from session cookie ─────────────

export async function resolveUserFromRequest(
  req: Request
): Promise<Record<string, any> | null> {
  const { parse: parseCookieHeader } = await import("cookie");

  const raw = req.headers.cookie;
  if (!raw) return null;

  const cookies = parseCookieHeader(raw);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload?.wallet) return null;

  return (await db.getUserByOpenId(payload.wallet)) ?? null;
}
