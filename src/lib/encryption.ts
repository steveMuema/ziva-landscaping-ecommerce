import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import path from "path";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getEncryptionKey(): Buffer {
  let raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    try {
      require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
      raw = process.env.ENCRYPTION_KEY ?? "";
    } catch {
      // dotenv optional
    }
  }
  if (!raw || raw.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set and at least 32 characters (e.g. 64 hex chars or a long passphrase)"
    );
  }
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  return scryptSync(raw, "ziva-credentials", KEY_LENGTH);
}

/**
 * Encrypt a string for storage. Returns a single base64 string: iv + authTag + ciphertext.
 * Use only on the server (requires ENCRYPTION_KEY).
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt a string produced by encrypt(). Use only on the server.
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");
  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
}
