import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function isCrossSiteRequest(req: Request) {
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] ?? req.headers.host;

  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    const requestProtocol = isSecureRequest(req) ? "https:" : "http:";
    const requestHost = Array.isArray(host) ? host[0] : host;
    const requestHostname = requestHost.split(":")[0];

    return (
      originUrl.protocol !== requestProtocol ||
      originUrl.hostname !== requestHostname
    );
  } catch {
    return false;
  }
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  const crossSite = isCrossSiteRequest(req) && secure;

  return {
    httpOnly: true,
    path: "/",
    sameSite: crossSite ? "none" : "lax",
    secure,
  };
}
