import { createHash, randomBytes } from "crypto";
import { prisma } from "@ecosystem/database";

const API_KEY_PREFIX = "exstr_live_";

/**
 * Generate a new API key
 * Format: exstr_live_[32 random hex chars]
 * Returns the full key (only shown once) and the hash for storage
 */
export function generateApiKey(): {
  fullKey: string;
  keyHash: string;
  keyPrefix: string;
} {
  const randomPart = randomBytes(16).toString("hex"); // 32 hex chars
  const fullKey = `${API_KEY_PREFIX}${randomPart}`;
  const keyHash = hashApiKey(fullKey);
  const keyPrefix = getKeyPrefix(fullKey);

  return { fullKey, keyHash, keyPrefix };
}

/**
 * Hash an API key using SHA-256
 */
export function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

/**
 * Extract prefix from API key for display (first 12 chars)
 */
export function getKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

/**
 * Validate an API key against the database
 * Returns the ApiKey record if valid, null otherwise
 */
export async function validateApiKey(key: string | null) {
  if (!key || !key.startsWith(API_KEY_PREFIX)) {
    return null;
  }

  const keyHash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
      isActive: true,
    },
  });

  if (apiKey) {
    // Update lastUsedAt (fire and forget - don't await)
    prisma.apiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {
        // Silently ignore update errors
      });
  }

  return apiKey;
}
