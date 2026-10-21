import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "../db";
import { ApiError } from "../auth";
import { encryptApiKey, decryptApiKey } from "./secrets";
import type { AIProviderSummary, TokenParameter } from "@/shared/ai-provider";

export function normalizeBaseURL(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new ApiError(400, "Enter a valid API base URL, including http:// or https://."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new ApiError(400, "Use an HTTP(S) base URL without credentials, query parameters, or fragments.");
  }
  if (/\/(chat\/completions|models|embeddings|audio\/transcriptions)\/?$/.test(url.pathname)) {
    throw new ApiError(400, "Enter the API base URL (usually ending in /v1), without /chat/completions or another endpoint.");
  }
  return url.toString().replace(/\/+$/, "");
}

export const providerInput = z.object({
  name: z.string().trim().min(1).max(80),
  baseURL: z.string().trim().min(1).max(2000).transform(normalizeBaseURL),
  model: z.string().trim().max(256).default(""),
  apiKey: z.string().trim().max(4096).regex(/^[^\r\n]*$/, "The API key must be a single line.").default(""),
  keyless: z.boolean().default(false),
  tokenParameter: z.enum(["max_tokens", "max_completion_tokens"]).default("max_tokens"),
  embeddingModel: z.string().trim().max(256).default(""),
  transcriptionModel: z.string().trim().max(256).default(""),
}).strict();

export type ProviderConfig = {
  name: string; base: string; model: string; key: string; keyless: boolean;
  tokenParameter: TokenParameter; embeddingModel: string; transcriptionModel: string;
};

function environmentSummary(): AIProviderSummary {
  return {
    source: process.env.AI_API_KEY ? "environment" : "none",
    name: "OpenAI compatible", baseURL: normalizeBaseURL(process.env.AI_BASE_URL || "https://api.openai.com/v1"),
    model: process.env.AI_MODEL || "gpt-4.1-mini", hasApiKey: !!process.env.AI_API_KEY, keyless: false,
    tokenParameter: process.env.AI_TOKEN_PARAMETER === "max_tokens" ? "max_tokens" : "max_completion_tokens",
    embeddingModel: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
    transcriptionModel: process.env.AI_TRANSCRIPTION_MODEL || "whisper-1",
  };
}

export async function providerSummary(userId: string): Promise<AIProviderSummary> {
  const saved = await db.aIProviderSetting.findUnique({ where: { userId } });
  if (!saved) return environmentSummary();
  return {
    source: "settings", name: saved.name, baseURL: saved.baseURL, model: saved.model,
    hasApiKey: !!saved.encryptedApiKey, keyless: saved.keyless,
    tokenParameter: saved.tokenParameter as TokenParameter,
    embeddingModel: saved.embeddingModel, transcriptionModel: saved.transcriptionModel,
  };
}

export async function providerConfig(userId: string): Promise<ProviderConfig> {
  const saved = await db.aIProviderSetting.findUnique({ where: { userId } });
  if (saved) {
    const key = saved.keyless ? "" : saved.encryptedApiKey ? await decryptApiKey(userId, saved.encryptedApiKey) : "";
    if (!key && !saved.keyless) throw new ApiError(503, "Add your AI API key in Settings → AI provider.");
    return { name: saved.name, base: saved.baseURL, model: saved.model, key, keyless: saved.keyless,
      tokenParameter: saved.tokenParameter as TokenParameter, embeddingModel: saved.embeddingModel, transcriptionModel: saved.transcriptionModel };
  }
  const summary = environmentSummary();
  if (!summary.hasApiKey) throw new ApiError(503, "No AI model is configured. Open Settings → AI provider, enter your provider and model, then save.");
  return { name: summary.name, base: summary.baseURL, model: summary.model, key: process.env.AI_API_KEY!, keyless: false,
    tokenParameter: summary.tokenParameter, embeddingModel: summary.embeddingModel, transcriptionModel: summary.transcriptionModel };
}

// Blank keys reuse a secret only for the same endpoint; a URL change never forwards a saved key to another provider.
export async function draftProvider(userId: string, raw: unknown, requireModel = true): Promise<ProviderConfig> {
  const input = providerInput.parse(raw);
  if (requireModel && !input.model) throw new ApiError(400, "Enter a model ID or load the provider's model list first.");
  let key = input.keyless ? "" : input.apiKey;
  if (!key && !input.keyless) {
    const saved = await db.aIProviderSetting.findUnique({ where: { userId } });
    if (saved?.encryptedApiKey && saved.baseURL === input.baseURL) key = await decryptApiKey(userId, saved.encryptedApiKey);
    else if (!saved && input.baseURL === environmentSummary().baseURL) key = process.env.AI_API_KEY || "";
    if (!key) throw new ApiError(400, "Enter an API key for this provider, or enable ‘No API key’ for a server that does not require authentication.");
  }
  return { name: input.name, base: input.baseURL, model: input.model, key, keyless: input.keyless,
    tokenParameter: input.tokenParameter, embeddingModel: input.embeddingModel, transcriptionModel: input.transcriptionModel };
}

export async function saveProvider(userId: string, raw: unknown) {
  const config = await draftProvider(userId, raw);
  const data = { name: config.name, baseURL: config.base, model: config.model, keyless: config.keyless,
    encryptedApiKey: config.key ? await encryptApiKey(userId, config.key) : null,
    tokenParameter: config.tokenParameter, embeddingModel: config.embeddingModel, transcriptionModel: config.transcriptionModel };
  await db.$transaction(async tx => {
    const previous = await tx.aIProviderSetting.findUnique({ where: { userId } });
    await tx.aIProviderSetting.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    // Vectors belong to a provider/model; clear cached knowledge embeddings when either changes.
    if (!previous || previous.baseURL !== config.base || previous.embeddingModel !== config.embeddingModel) {
      await tx.record.updateMany({ where: { userId, kind: "knowledge" }, data: { embedding: Prisma.DbNull } });
    }
  });
  return providerSummary(userId);
}

export async function removeProvider(userId: string) {
  await db.$transaction(async tx => {
    await tx.aIProviderSetting.deleteMany({ where: { userId } });
    await tx.record.updateMany({ where: { userId, kind: "knowledge" }, data: { embedding: Prisma.DbNull } });
  });
  return providerSummary(userId);
}

export function providerHeaders(config: ProviderConfig): Record<string, string> {
  return config.key ? { Authorization: `Bearer ${config.key}` } : {};
}

export function tokenLimit(config: ProviderConfig, count: number) { return { [config.tokenParameter]: count }; }

export async function providerRequest(config: ProviderConfig, endpoint: string, body?: unknown, timeout = 45000) {
  let response: Response;
  try {
    response = await fetch(`${config.base}/${endpoint}`, { method: body === undefined ? "GET" : "POST",
      headers: { ...providerHeaders(config), "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(timeout), redirect: "error", cache: "no-store" });
  } catch (error) {
    if (error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name)) throw new ApiError(504, "The AI provider timed out. Check that your model is running, then try again.");
    throw new ApiError(502, "Cannot reach the AI provider. Check the base URL and that the server is running.");
  }
  if (!response.ok) {
    const advice = response.status === 401 || response.status === 403 ? "Check your API key and access permissions." : response.status === 404 ? "Check the base URL and exact model ID." : response.status === 429 ? "Check the provider's quota or rate limit." : "Check the model, supported parameters, and provider availability.";
    throw new ApiError(502, `AI provider returned ${response.status}. ${advice}`);
  }
  try { return await response.json(); } catch { throw new ApiError(502, "The provider did not return OpenAI-compatible JSON. Check the API base URL."); }
}

export async function listProviderModels(config: ProviderConfig): Promise<string[]> {
  const response = await providerRequest(config, "models", undefined, 15000);
  if (!Array.isArray(response.data)) throw new ApiError(502, "This provider does not expose a compatible model list. Enter its model ID manually.");
  return [...new Set<string>(response.data.flatMap((item: { id?: unknown }) => typeof item?.id === "string" && item.id.length <= 256 ? [item.id] : []))].sort().slice(0, 1000);
}

export async function testProvider(config: ProviderConfig) {
  const result = await providerRequest(config, "chat/completions", {
    model: config.model,
    messages: [{ role: "user", content: "Test connection only. Call studio_connection_check with empty arguments. Do not perform any other action." }],
    tools: [{ type: "function", function: { name: "studio_connection_check", description: "Verify function calling without saving data.", parameters: { type: "object", properties: {}, additionalProperties: false } } }],
    tool_choice: "auto", ...tokenLimit(config, 512),
  }, 45000);
  const message = result.choices?.[0]?.message;
  if (!message || (!message.content && !message.tool_calls?.length)) throw new ApiError(502, "The model returned no usable chat response.");
  const supportsTools = Array.isArray(message.tool_calls) && message.tool_calls.some((call: { function?: { name?: string } }) => call.function?.name === "studio_connection_check");
  return { success: true, supportsTools, model: config.model,
    message: supportsTools ? "Connection and function calling verified. Save this provider to use it with all four agents." : "Chat connection succeeded, but function calling was not verified. Studio tasks require a model that supports tools. Try a tool-capable model before using Action." };
}

export async function embed(userId: string, text: string): Promise<number[]> {
  const config = await providerConfig(userId);
  if (!config.embeddingModel) throw new ApiError(503, "No embedding model configured; use keyword search.");
  const result = await providerRequest(config, "embeddings", { model: config.embeddingModel, input: text.slice(0, 12000) });
  const vector = result.data?.[0]?.embedding;
  if (!Array.isArray(vector) || !vector.length || !vector.every(n => typeof n === "number" && Number.isFinite(n))) throw new ApiError(502, "The embedding provider returned an invalid result.");
  return vector;
}
