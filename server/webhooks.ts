/**
 * Webhook notification system for Aegis Protocol.
 *
 * Dispatches events to registered webhook URLs for:
 * - Invocation completions/failures
 * - Earnings milestones
 * - Dispute updates
 * - Guardrail blocks
 */

interface WebhookEvent {
  type: "invocation.completed" | "invocation.failed" | "earnings.milestone" | "dispute.created" | "dispute.resolved" | "guardrail.blocked";
  timestamp: string;
  data: Record<string, any>;
}

interface WebhookSubscription {
  url: string;
  events: string[];
  secret?: string;
  createdAt: Date;
}

function isPrivateUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const host = u.hostname;
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
    if (host === "169.254.169.254") return true; // AWS/GCP metadata
    if (host === "100.100.100.200") return true; // Alibaba metadata
    if (host.startsWith("10.")) return true;
    if (host.startsWith("192.168.")) return true;
    if (host.startsWith("172.") && parseInt(host.split(".")[1]) >= 16 && parseInt(host.split(".")[1]) <= 31) return true;
    if (host.endsWith(".internal") || host.endsWith(".local")) return true;
    if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    return false;
  } catch { return true; }
}

// In-memory store (would be MongoDB in production)
const subscriptions = new Map<string, WebhookSubscription[]>();

export function registerWebhook(userId: string, sub: WebhookSubscription): void {
  const existing = subscriptions.get(userId) || [];
  existing.push(sub);
  subscriptions.set(userId, existing);
}

export function removeWebhook(userId: string, url: string): void {
  const existing = subscriptions.get(userId) || [];
  subscriptions.set(userId, existing.filter(s => s.url !== url));
}

export async function dispatchEvent(userId: string, event: WebhookEvent): Promise<void> {
  const subs = subscriptions.get(userId) || [];
  const matching = subs.filter(s =>
    s.events.includes("*") || s.events.includes(event.type)
  );

  await Promise.allSettled(
    matching.map(async (sub) => {
      if (isPrivateUrl(sub.url)) { return; }
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Aegis-Event": event.type,
          "X-Aegis-Timestamp": event.timestamp,
        };

        if (sub.secret) {
          // HMAC-SHA256 signature
          const crypto = await import("crypto");
          const body = JSON.stringify(event);
          const sig = crypto.createHmac("sha256", sub.secret).update(body).digest("hex");
          headers["X-Aegis-Signature"] = `sha256=${sig}`;
        }

        await fetch(sub.url, {
          method: "POST",
          headers,
          body: JSON.stringify(event),
          signal: AbortSignal.timeout(10_000),
        });
      } catch {
        // Log failure silently - don't break the main flow
      }
    })
  );
}

export function getWebhooks(userId: string): WebhookSubscription[] {
  return subscriptions.get(userId) || [];
}
