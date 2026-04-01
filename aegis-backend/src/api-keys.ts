import crypto from "crypto";
import { ApiKey } from "./db";

export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sk-aegis-${crypto.randomBytes(24).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const prefix = key.slice(0, 14);
  return { key, hash, prefix };
}

export async function createApiKey(userId: string, name: string, scopes: string[] = ["read", "invoke"]) {
  const { key, hash, prefix } = generateApiKey();
  const doc = await ApiKey.create({
    userId,
    name,
    keyHash: hash,
    keyPrefix: prefix,
    scopes,
  });
  return { id: doc._id, key, prefix, name, scopes, createdAt: (doc as any).createdAt };
}

export async function validateApiKey(key: string) {
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const doc = await ApiKey.findOneAndUpdate(
    { keyHash: hash, isActive: true },
    { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
    { new: true }
  ).lean();
  return doc;
}

export async function listApiKeys(userId: string) {
  return ApiKey.find({ userId, isActive: true })
    .select("-keyHash")
    .sort({ createdAt: -1 })
    .lean();
}

export async function revokeApiKey(keyId: string, userId: string) {
  return ApiKey.findOneAndUpdate(
    { _id: keyId, userId },
    { $set: { isActive: false } }
  );
}
