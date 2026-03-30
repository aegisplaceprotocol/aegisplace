import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleSSE } from "../sse";
import { handleMCP, handleMCPDiscovery } from "../mcp";
import restApi from "../rest-api";

const isDev = process.env.NODE_ENV !== "production";

// ── Rate limiters ────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10_000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: isDev ? 10_000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MCP rate limit exceeded." },
});

/**
 * Creates and configures the Express application.
 * Shared between local dev (server/_core/index.ts) and Vercel (api/index.ts).
 * Does NOT call listen() or start background jobs.
 */
export function createApp() {
  const app = express();

  // Trust proxy for accurate IP
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:", "http:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "https:", "data:"],
          mediaSrc: ["'self'", "https:"],
          frameSrc: ["'self'", "https://dexscreener.com", "https://bags.fm"],
          upgradeInsecureRequests: null,
        },
      },
      crossOriginOpenerPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false,
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
    })
  );

  // Permissions-Policy header (not built into helmet v8)
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // Global rate limiter
  app.use(globalLimiter);

  // Body parsing
  app.use(express.json());

  // Auth rate limiter on auth routes
  app.use("/api/auth", authLimiter);

  // Register wallet-sign auth routes
  registerAuthRoutes(app);

  // MCP endpoint
  app.use("/api/mcp", mcpLimiter);
  app.post("/api/mcp", handleMCP);
  app.get("/api/mcp", handleMCPDiscovery);

  // REST API v1
  app.use("/api/v1", restApi);

  // Health check
  app.get("/api/health", async (_req, res) => {
    try {
      const { getDb } = await import("../db");
      const db = await getDb();
      const count = db ? await db.collection("operators").countDocuments() : 0;
      res.json({ status: "ok", uptime: process.uptime(), operators: count, version: "1.0.0" });
    } catch {
      res.json({ status: "ok", uptime: process.uptime(), operators: 0, version: "1.0.0" });
    }
  });

  // A2A agent.json (redirect to agent-card.json which is served as static)
  app.get("/.well-known/agent.json", (_req, res) => {
    res.redirect(301, "/.well-known/agent-card.json");
  });

  // SSE live feed endpoint
  app.get("/api/feed", handleSSE);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
