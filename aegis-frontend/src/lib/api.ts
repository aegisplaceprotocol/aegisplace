const rawApiBase = (import.meta.env.VITE_API_BASE_URL ?? "").trim();

export const API_BASE_URL = rawApiBase.replace(/\/+$/, "");

export function withApiBase(pathname: string): string {
  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}
