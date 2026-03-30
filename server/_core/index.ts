import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { serveStatic, setupVite } from "./vite";
import { recalculateTrustScores } from "../trust-engine";
import { startHealthCheckLoop } from "../operator-health";
import { cleanupRateLimits } from "../db";
import { logger } from "../logger";
import { startHealthMonitor } from "../health-monitor";
import { getSwarmStatus } from "../swarm-engine";
import { createApp } from "./app";

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

async function startServer() {
  const app = await createApp();

  const server = createServer(app);

  // In dev, use Vite middleware for HMR; in prod, serve static build
  if (process.env.NODE_ENV !== "production") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

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
