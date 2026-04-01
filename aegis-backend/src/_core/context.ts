import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { resolveUserFromRequest } from "./auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: Record<string, any> | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: Record<string, any> | null = null;

  try {
    const resolved = await resolveUserFromRequest(opts.req);
    user = resolved ?? null;
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
