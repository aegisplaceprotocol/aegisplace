const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export function apiUrl(path: string): string {
  return API_BASE_URL ? `${API_BASE_URL}${path}` : path;
}

export function mcpConnectivityUrl(): string {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return "http://localhost:3000/mcp";
  }
  return "https://api.aegisplace.com/mcp";
}
