import "dotenv/config";
import express, { type Express } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleSSE } from "../sse";
import { handleMCP, handleMCPDiscovery } from "../mcp";
import restApi from "../rest-api";
import royaltyRoutes from "../routes/royalties";
import a2aRoutes from "../routes/a2a";
import metricsRoutes from "../routes/metrics";
import receiptRoutes from "../routes/receipts";
import badgeRoutes from "../routes/badge";
import kyaRoutes from "../routes/kya";

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 200 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (process.env.NODE_ENV !== "production") return true;
    if (req.method === "OPTIONS") return true;
    if (req.path === "/api/health") return true;
    return false;
  },
  message: {
    error: "Too many requests, please try again later.",
    code: "RATE_LIMITED",
  },
  handler: (req, res, _next, options) => {
    const resetMs = req.rateLimit?.resetTime
      ? Math.max(req.rateLimit.resetTime.getTime() - Date.now(), 0)
      : 0;
    const retryAfterSeconds = Math.ceil(resetMs / 1000);
    if (retryAfterSeconds > 0) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
    }
    return res.status(options.statusCode).json({
      error: "Too many requests, please try again later.",
      code: "RATE_LIMITED",
      retryAfterSeconds,
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts, please try again later." },
});

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MCP rate limit exceeded." },
});

export async function createApp(): Promise<Express> {
  const app = express();

  // Trust proxy for accurate client IP on managed runtimes.
  app.set("trust proxy", 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: [
            "'self'",
            "https://aegisplace.com",
            "https://www.aegisplace.com",
            "https://api.mainnet-beta.solana.com",
            "wss://api.mainnet-beta.solana.com",
            "https://api.devnet.solana.com",
            "wss://api.devnet.solana.com",
          ],
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

  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    const allowed = process.env.NODE_ENV === "production"
      ? ["https://aegisplace.com", "https://www.aegisplace.com", ...(vercelOrigin ? [vercelOrigin] : [])]
      : ["http://localhost:3000", "http://localhost:5173"];

    if (origin && allowed.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-API-Key,X-Payment");
    }

    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use("/api", globalLimiter);
  app.use(express.json({ limit: "100kb" }));
  app.use("/api/auth", authLimiter);

  registerAuthRoutes(app);

  const mcpAuthMiddleware = (req: any, res: any, next: any) => {
    if (req.method === "GET") return next();

    const body = req.body;
    const method = body?.method;
    if (method === "tools/list" || method === "initialize" || method === "notifications/initialized") {
      return next();
    }

    const readOnlyTools = [
      "aegis_list_operators",
      "aegis_get_operator",
      "aegis_search_operators",
      "aegis_get_categories",
      "aegis_get_stats",
      "aegis_get_trust_score",
      "aegis_discovery_stats",
      "aegis_list_tasks",
      "aegis_get_operator_token",
    ];

    if (method === "tools/call" && readOnlyTools.includes(body?.params?.name)) {
      return next();
    }

    const apiKey = req.headers["x-api-key"];
    if (!apiKey) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: body?.id || null,
        error: { code: -32001, message: "Authentication required. Provide X-API-Key header." },
      });
    }

    const validKey = process.env.MCP_API_KEY;
    if (!validKey || apiKey !== validKey) {
      return res.status(401).json({
        jsonrpc: "2.0",
        id: body?.id || null,
        error: { code: -32001, message: "Invalid API key" },
      });
    }

    next();
  };

  app.use("/api/mcp", mcpLimiter);
  app.use("/api/mcp", mcpAuthMiddleware);
  app.post("/api/mcp", handleMCP);
  app.get("/api/mcp", handleMCPDiscovery);

  app.use("/api/v1", restApi);
  app.use("/api/royalties", royaltyRoutes);
  app.use("/api/a2a", a2aRoutes);
  app.use("/metrics", metricsRoutes);
  app.use("/api/receipts", receiptRoutes);
  app.use("/api/v1/badge", badgeRoutes);
  app.use("/api/kya", kyaRoutes);

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

  app.get("/.well-known/agent.json", (_req, res) => {
    res.redirect(301, "/.well-known/agent-card.json");
  });

  app.get("/api/feed", handleSSE);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  return app;
}
