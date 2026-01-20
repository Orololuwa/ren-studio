import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

const API_KEY_PREFIX = "sk_live_";
const API_KEY_LENGTH = 32; // 32 hex characters = 16 bytes
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM

/**
 * Gets the encryption key from environment variables.
 * Falls back to COOKIE_SECRET if API_KEY_ENCRYPTION_KEY is not set.
 */
function getEncryptionKey(): Buffer {
  const key = process.env.API_KEY_ENCRYPTION_KEY || process.env.COOKIE_SECRET;
  if (!key) {
    throw new Error(
      "API_KEY_ENCRYPTION_KEY or COOKIE_SECRET must be set for API key encryption",
    );
  }
  // For AES-256, we need a 32-byte key
  // Hash the provided key to ensure it's exactly 32 bytes
  return createHash("sha256").update(key).digest();
}

/**
 * Generates a secure random API key.
 * Format: sk_live_<32 hex characters>
 * Example: sk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 */
export function generateApiKey(): string {
  const randomPart = randomBytes(API_KEY_LENGTH / 2)
    .toString("hex")
    .toLowerCase();
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Encrypts an API key using AES-256-GCM.
 * @param key - The plain API key to encrypt
 * @returns The encrypted key as a hex string (format: iv:authTag:encryptedData)
 */
export function encryptApiKey(key: string): string {
  const encryptionKey = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey, iv);

  let encrypted = cipher.update(key, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Return format: iv:authTag:encryptedData (all as hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an API key using AES-256-GCM.
 * @param encryptedKey - The encrypted key (format: iv:authTag:encryptedData)
 * @returns The plain API key
 */
export function decryptApiKey(encryptedKey: string): string {
  const encryptionKey = getEncryptionKey();
  const parts = encryptedKey.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted key format");
  }

  const [ivHex, authTagHex, encrypted] = parts;
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error("Invalid encrypted key format: missing components");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, encryptionKey, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Verifies an API key by decrypting and comparing.
 * @param key - The plain API key to verify
 * @param encryptedKey - The encrypted key to compare against
 * @returns True if the key matches, false otherwise
 */
export function verifyApiKey(key: string, encryptedKey: string): boolean {
  try {
    const decrypted = decryptApiKey(encryptedKey);
    return decrypted === key;
  } catch {
    return false;
  }
}

/**
 * Extracts the prefix from an API key for display purposes.
 * Returns the first 8 characters (e.g., "sk_live_")
 * @param key - The plain API key
 * @returns The prefix
 */
export function getApiKeyPrefix(key: string): string {
  return key.substring(0, 8);
}
