import { McpServer } from "./db";

// Check if a URL is reachable and returns valid JSON-RPC
async function checkConnectivity(url: string): Promise<{ ok: boolean; responseMs: number }> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return { ok: res.ok, responseMs: Date.now() - start };
  } catch {
    return { ok: false, responseMs: Date.now() - start };
  }
}

// Enumerate tools from an MCP server
async function enumerateTools(url: string): Promise<{ name: string; description: string }[]> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });
    const data = await res.json();
    return (data?.result?.tools || []).map((t: any) => ({
      name: t.name || "unknown",
      description: t.description || "",
    }));
  } catch {
    return [];
  }
}

// Full verification scan
export async function scanMcpServer(serverUrl: string): Promise<{
  connectivity: boolean;
  schemaValid: boolean;
  ssrfSafe: boolean;
  responseTimeMs: number;
  toolsEnumerated: number;
  tools: { name: string; description: string }[];
}> {
  // SSRF check
  const isPrivate = (url: string) => {
    try {
      const u = new URL(url);
      const h = u.hostname;
      return h === "localhost" || h === "127.0.0.1" || h === "0.0.0.0" || h === "::1" ||
        h.startsWith("10.") || h.startsWith("192.168.") || h.startsWith("172.") ||
        h === "169.254.169.254" || h.endsWith(".internal") || h.endsWith(".local");
    } catch { return true; }
  };

  if (isPrivate(serverUrl)) {
    return { connectivity: false, schemaValid: false, ssrfSafe: false, responseTimeMs: 0, toolsEnumerated: 0, tools: [] };
  }

  const conn = await checkConnectivity(serverUrl);
  const tools = conn.ok ? await enumerateTools(serverUrl) : [];

  return {
    connectivity: conn.ok,
    schemaValid: tools.length > 0,
    ssrfSafe: true,
    responseTimeMs: conn.responseMs,
    toolsEnumerated: tools.length,
    tools,
  };
}

// Submit server for verification
export async function submitForVerification(params: {
  serverUrl: string;
  name: string;
  ownerWallet?: string;
  description?: string;
}) {
  const slug = params.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  // Check if already exists
  const existing = await McpServer.findOne({ serverUrl: params.serverUrl });
  if (existing) return existing;

  // Run initial scan
  const scan = await scanMcpServer(params.serverUrl);

  const server = await McpServer.create({
    serverUrl: params.serverUrl,
    name: params.name,
    slug,
    ownerWallet: params.ownerWallet,
    description: params.description,
    toolCount: scan.toolsEnumerated,
    tools: scan.tools,
    verificationStatus: scan.connectivity && scan.schemaValid ? "verified" : "pending",
    trustScore: scan.connectivity ? (scan.schemaValid ? 70 : 30) : 0,
    lastScannedAt: new Date(),
    scanResults: scan,
    badgeType: scan.connectivity && scan.schemaValid ? "verified" : "none",
  });

  return server;
}

// Get verified servers
export async function getVerifiedServers(limit = 50) {
  return McpServer.find({ verificationStatus: "verified" })
    .sort({ trustScore: -1 })
    .limit(limit)
    .lean();
}
