export type TokenParameter = "max_tokens" | "max_completion_tokens";
export type AIProviderSummary = {
  source: "settings" | "environment" | "none";
  name: string;
  baseURL: string;
  model: string;
  hasApiKey: boolean;
  keyless: boolean;
  tokenParameter: TokenParameter;
  embeddingModel: string;
  transcriptionModel: string;
};

export const providerPresets = [
  { name: "OpenAI", baseURL: "https://api.openai.com/v1", model: "gpt-4.1-mini", keyless: false, tokenParameter: "max_completion_tokens", embeddingModel: "text-embedding-3-small", transcriptionModel: "whisper-1" },
  { name: "OpenRouter", baseURL: "https://openrouter.ai/api/v1", model: "", keyless: false, tokenParameter: "max_tokens", embeddingModel: "", transcriptionModel: "" },
  { name: "Ollama (local)", baseURL: "http://localhost:11434/v1", model: "", keyless: true, tokenParameter: "max_tokens", embeddingModel: "", transcriptionModel: "" },
  { name: "Custom", baseURL: "", model: "", keyless: false, tokenParameter: "max_tokens", embeddingModel: "", transcriptionModel: "" },
] satisfies Omit<AIProviderSummary, "source" | "hasApiKey">[];
