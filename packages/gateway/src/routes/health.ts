/**
 * Health check route.
 * Reports gateway status and Solana RPC connectivity.
 */

import type { FastifyInstance } from "fastify";
import { Connection } from "@solana/web3.js";

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com";

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get("/v1/health", async (_request, reply) => {
    const startTime = Date.now();
    let solanaStatus: "ok" | "degraded" | "down" = "down";
    let solanaLatencyMs = 0;
    let slotHeight = 0;

    try {
      const connection = new Connection(SOLANA_RPC_URL, "confirmed");
      const slot = await connection.getSlot();
      solanaLatencyMs = Date.now() - startTime;
      slotHeight = slot;
      solanaStatus = solanaLatencyMs < 2000 ? "ok" : "degraded";
    } catch {
      solanaStatus = "down";
      solanaLatencyMs = Date.now() - startTime;
    }

    const status = solanaStatus === "ok" ? "healthy" : "degraded";

    return reply.status(status === "healthy" ? 200 : 503).send({
      status,
      version: "1.0.0",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      solana: {
        rpc: SOLANA_RPC_URL,
        status: solanaStatus,
        latencyMs: solanaLatencyMs,
        slotHeight,
      },
    });
  });
}
