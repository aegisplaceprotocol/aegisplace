import type { Request, Response } from "express";

// ── Event types ──────────────────────────────────────────────────────────
export type SSEEventType = "invocation" | "registration" | "dispute" | "validator_join";

export interface SSEEvent {
  id: string;
  event: SSEEventType;
  data: Record<string, unknown>;
}

// ── State ────────────────────────────────────────────────────────────────
const clients = new Set<Response>();
const replayBuffer: SSEEvent[] = [];
const REPLAY_BUFFER_SIZE = 50;

let eventCounter = 0;

// ── Broadcast ────────────────────────────────────────────────────────────

/**
 * Broadcast an event to all connected SSE clients and store in the replay buffer.
 */
export function broadcastEvent(event: SSEEventType, data: Record<string, unknown>): void {
  eventCounter++;
  const sseEvent: SSEEvent = {
    id: String(eventCounter),
    event,
    data: { ...data, timestamp: Date.now() },
  };

  // Store in replay buffer
  replayBuffer.push(sseEvent);
  if (replayBuffer.length > REPLAY_BUFFER_SIZE) {
    replayBuffer.shift();
  }

  // Send to all connected clients
  const message = formatSSE(sseEvent);
  clients.forEach(client => {
    try {
      client.write(message);
    } catch {
      // Client disconnected; will be cleaned up by close handler
      clients.delete(client);
    }
  });
}

// ── SSE formatting ───────────────────────────────────────────────────────

function formatSSE(event: SSEEvent): string {
  return `id: ${event.id}\nevent: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

// ── SSE endpoint handler ─────────────────────────────────────────────────

export function handleSSE(req: Request, res: Response): void {
  // Set SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Send initial comment to establish connection
  res.write(":ok\n\n");

  // Replay buffered events
  for (const event of replayBuffer) {
    res.write(formatSSE(event));
  }

  // Track this client
  clients.add(res);

  // Send heartbeat every 30s to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
      clients.delete(res);
    }
  }, 30_000);

  // Cleanup on disconnect
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
}

// ── Utility ──────────────────────────────────────────────────────────────

/** Returns the number of currently connected SSE clients. */
export function getConnectedClientCount(): number {
  return clients.size;
}
