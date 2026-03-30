/**
 * Aegis x402 Gateway & MCP Server
 *
 * A standalone Fastify service that:
 * 1. Accepts x402 payment headers (HTTP 402 flow) for skill invocations
 * 2. Verifies USDC transfers on Solana
 * 3. Forwards requests to operator endpoints
 * 4. Validates response quality
 * 5. Serves as an MCP server via SSE transport
 *
 * Default port: 3001 (main app is 3000)
 * Run with: tsx src/index.ts
 */

import Fastify from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./routes/health.js";
import { operatorRoutes } from "./routes/operators.js";
import { invokeRoutes } from "./routes/invoke.js";
import { mountMcpRoutes } from "./mcp/server.js";

const PORT = parseInt(process.env.GATEWAY_PORT ?? process.env.PORT ?? "3001", 10);
const HOST = process.env.GATEWAY_HOST ?? "0.0.0.0";

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      transport: process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
    },
    // Increase body size for large payloads
    bodyLimit: 1024 * 1024, // 1MB
  });

  // ── CORS ────────────────────────────────────────────────
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Payment-Signature",
      "X-Payment-Required",
      "X-Payment-Response",
    ],
    exposedHeaders: [
      "X-Payment-Required",
      "X-Payment-Response",
    ],
    credentials: true,
  });

  // ── Raw body for MCP messages ───────────────────────────
  app.addContentTypeParser(
    "application/json",
    { parseAs: "string" },
    (req, body, done) => {
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  // ── Mount routes ────────────────────────────────────────
  await app.register(healthRoutes);
  await app.register(operatorRoutes);
  await app.register(invokeRoutes);
  await mountMcpRoutes(app);

  // ── Root info endpoint ──────────────────────────────────
  app.get("/", async (_request, reply) => {
    return reply.send({
      name: "Aegis x402 Gateway",
      version: "1.0.0",
      description: "Payment-gated AI skill invocation gateway with MCP server",
      endpoints: {
        health: "GET /v1/health",
        operators: "GET /v1/operators",
        operatorDetail: "GET /v1/operators/:slug",
        invoke: "POST /v1/invoke/:operatorSlug",
        mcpSse: "GET /mcp/sse",
        mcpMessages: "POST /mcp/messages",
      },
      protocol: "x402",
      network: "solana",
      currency: "USDC",
    });
  });

  // ── Start server ────────────────────────────────────────
  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`\n  Aegis x402 Gateway running on http://${HOST}:${PORT}`);
    console.log(`  MCP SSE endpoint: http://${HOST}:${PORT}/mcp/sse`);
    console.log(`  Health check:     http://${HOST}:${PORT}/v1/health\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
