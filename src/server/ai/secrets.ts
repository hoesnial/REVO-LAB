import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError } from "../auth";

async function encryptionKey() {
  const supplied = process.env.AI_SETTINGS_ENCRYPTION_KEY;
  if (supplied) {
    if (!/^[a-f\d]{64}$/i.test(supplied)) throw new ApiError(503, "AI settings encryption key must contain 64 hexadecimal characters.");
    return Buffer.from(supplied, "hex");
  }
  // This private file is created at runtime and must never be bundled with a deployment.
  const filename = path.resolve(/* turbopackIgnore: true */ process.env.AI_SETTINGS_KEY_FILE || ".data/ai-provider.key");
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  try {
    await writeFile(filename, randomBytes(32), { flag: "wx", mode: 0o600 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const key = await readFile(/* turbopackIgnore: true */ filename);
  if (key.length !== 32) throw new ApiError(503, "The AI settings encryption key file is invalid. Restore the original key file.");
  return key;
}

export async function encryptApiKey(userId: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", await encryptionKey(), iv);
  cipher.setAAD(Buffer.from(userId));
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64"), cipher.getAuthTag().toString("base64"), ciphertext.toString("base64")].join(".");
}

export async function decryptApiKey(userId: string, value: string) {
  try {
    const [version, iv, tag, ciphertext] = value.split(".");
    if (version !== "v1" || !iv || !tag || !ciphertext) throw new Error("Invalid encrypted key");
    const cipher = createDecipheriv("aes-256-gcm", await encryptionKey(), Buffer.from(iv, "base64"));
    cipher.setAAD(Buffer.from(userId));
    cipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([cipher.update(Buffer.from(ciphertext, "base64")), cipher.final()]).toString("utf8");
  } catch {
    throw new ApiError(503, "The saved API key could not be unlocked. Restore the server encryption key or enter your provider API key again in Settings.");
  }
}
