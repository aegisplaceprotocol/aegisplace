import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./auth";
import { ENV } from "./env";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { handleSSE } from "../sse";
import { handleMCP, handleMCPDiscovery } from "../mcp";
import { recalculateTrustScores } from "../trust-engine";
import { startHealthCheckLoop } from "../operator-health";
import { cleanupRateLimits } from "../db";
import { logger } from "../logger";
import restApi from "../rest-api";
import royaltyRoutes from "../routes/royalties";
import a2aRoutes from "../routes/a2a";
import metricsRoutes from "../routes/metrics";
import receiptRoutes from "../routes/receipts";
import badgeRoutes from "../routes/badge";
import kyaRoutes from "../routes/kya";
import { startHealthMonitor } from "../health-monitor";
import { getSwarmStatus } from "../swarm-engine";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ── Rate limiters ────────────────────────────────────────────

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authNonceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many nonce requests, please try again later." },
});

const authVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: "Too many auth attempts, please try again later." },
});

const mcpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "MCP rate limit exceeded." },
});

const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function getAllowedOrigins() {
  return ENV.frontendUrls.length > 0 ? ENV.frontendUrls : DEFAULT_DEV_ORIGINS;
}

async function startServer() {
  const app = express();

  // Trust proxy for accurate IP
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
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

  // Permissions-Policy header (not built into helmet v8)
  app.use((_req, res, next) => {
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  // CORS configuration
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = getAllowedOrigins();

    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Vary", "Origin");
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type,Authorization,X-API-Key,X-Payment,X-Payment-Proof,X-Payer-Wallet,X-Invocation-Receipt,X-Settlement-Method,Payment-Signature,Stripe-Payment-Token,Stripe-Payment-Receipt',
      );
      res.setHeader(
        'Access-Control-Expose-Headers',
        'X-Payment-Required,X-Payment-Amount,X-Payment-Currency,X-Payment-Chain,X-Payment-Recipient,X-Payment-Network,X-Payment-Description,PAYMENT-REQUIRED,PAYMENT-RESPONSE',
      );
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // Global rate limiter
  app.use(globalLimiter);

  // Body parsing
  app.use(express.json({ limit: '100kb' }));

  // Auth rate limiters: nonce and verify are split so the handshake does not burn its own budget.
  app.use("/api/auth/nonce", authNonceLimiter);
  app.use("/api/auth/verify", authVerifyLimiter);

  // Register wallet-sign auth routes
  registerAuthRoutes(app);

  // MCP endpoint
  app.use("/mcp", mcpLimiter);
  app.post("/mcp", handleMCP);
  app.get("/mcp", handleMCPDiscovery);

  // REST API v1
  app.use("/api/v1", restApi);

  // Royalty system REST API
  app.use("/api/royalties", royaltyRoutes);

  // A2A (Agent2Agent) protocol endpoint
  app.use("/api/a2a", a2aRoutes);

  // Prometheus-compatible metrics endpoint
  app.use("/metrics", metricsRoutes);

  // cNFT receipt endpoints
  app.use("/api/receipts", receiptRoutes);

  // MCP Server verification badge endpoint
  app.use("/api/v1/badge", badgeRoutes);

  // KYA (Know Your Agent) trust verification
  app.use("/api/kya", kyaRoutes);

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

  const server = createServer(app);

  const requestedPort = parseInt(process.env.PORT ?? "3000", 10);
  const port = await findAvailablePort(requestedPort);

  // Trust score recalculation every 15 minutes
  const TRUST_RECALC_INTERVAL = 15 * 60 * 1000;
  setInterval(() => {
    recalculateTrustScores().catch(err =>
      logger.error({ err }, "[TrustEngine] Scheduled recalculation failed")
    );
  }, TRUST_RECALC_INTERVAL);
  logger.info("[TrustEngine] Scheduled recalculation every 15 minutes");

  // Start operator health check loop (every 5 minutes)
  startHealthCheckLoop();

  // Rate limit cleanup every 10 minutes
  setInterval(() => {
    cleanupRateLimits().catch(err =>
      logger.error({ err }, "[RateLimit] Cleanup failed")
    );
  }, 10 * 60 * 1000);

  server.listen(port, () => {
    logger.info(`Server running on http://localhost:${port}/`);
    startHealthMonitor();
    const swarm = getSwarmStatus();
    logger.info(
      { rufloConnected: swarm.rufloConnected },
      "[SwarmEngine] Available - ruflo runtime " + (swarm.rufloConnected ? "connected" : "not installed")
    );
  });
}

startServer().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});
