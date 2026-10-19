import "server-only";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompt";
import { getSettings } from "./settings";

export type ChatTurn = { role: "user" | "assistant"; content: string };
export type AIResult = {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  provider: string;
  model: string;
};

type Config = { key: string; model: string; defaultModel?: string; baseUrl?: string };

// Menambah penyedia baru yang kompatibel dengan OpenAI cukup menambah satu baris di sini.
const PROVIDERS: Record<string, Config> = {
  gemini: { key: "GEMINI_API_KEY", model: "GEMINI_MODEL", defaultModel: "gemini-3.6-flash" },
  groq: { key: "GROQ_API_KEY", model: "GROQ_MODEL", defaultModel: "openai/gpt-oss-120b", baseUrl: "https://api.groq.com/openai/v1" },
  mistral: { key: "MISTRAL_API_KEY", model: "MISTRAL_MODEL", defaultModel: "mistral-small-latest", baseUrl: "https://api.mistral.ai/v1" },
  cerebras: { key: "CEREBRAS_API_KEY", model: "CEREBRAS_MODEL", defaultModel: "gpt-oss-120b", baseUrl: "https://api.cerebras.ai/v1" },
  openrouter: { key: "OPENROUTER_API_KEY", model: "OPENROUTER_MODEL", baseUrl: "https://openrouter.ai/api/v1" },
};

type Raw = { text: string; inputTokens: number; outputTokens: number };

async function viaGemini(apiKey: string, model: string, history: ChatTurn[]): Promise<Raw> {
  const ai = new GoogleGenAI({ apiKey });
  const res = await ai.models.generateContent({
    model,
    contents: history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
  });
  const text = res.text?.trim();
  if (!text) throw new Error("Respons kosong");
  return {
    text,
    inputTokens: res.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: res.usageMetadata?.candidatesTokenCount ?? 0,
  };
}

async function viaOpenAICompat(baseUrl: string, apiKey: string, model: string, history: ChatTurn[]): Promise<Raw> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...history],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("Respons kosong");
  return {
    text,
    inputTokens: data.usage?.prompt_tokens ?? 0,
    outputTokens: data.usage?.completion_tokens ?? 0,
  };
}

function cost(provider: string, input: number, output: number) {
  const p = provider.toUpperCase();
  const priceIn = Number(process.env[`${p}_PRICE_IN`] ?? 0); // USD per 1 juta token
  const priceOut = Number(process.env[`${p}_PRICE_OUT`] ?? 0);
  return (input * priceIn + output * priceOut) / 1_000_000;
}

async function call(provider: string, history: ChatTurn[]): Promise<AIResult> {
  const cfg = PROVIDERS[provider];
  if (!cfg) throw new Error(`Penyedia AI tidak dikenal: "${provider}"`);
  const apiKey = process.env[cfg.key];
  if (!apiKey) throw new Error(`${cfg.key} belum diisi`);
  const model = process.env[cfg.model] || cfg.defaultModel;
  if (!model) throw new Error(`${cfg.model} belum diisi`);

  const raw = cfg.baseUrl
    ? await viaOpenAICompat(cfg.baseUrl, apiKey, model, history)
    : await viaGemini(apiKey, model, history);

  return { ...raw, provider, model, costUsd: cost(provider, raw.inputTokens, raw.outputTokens) };
}

// Coba penyedia utama; kalau gagal (kuota habis, error, dll.), coba penyedia cadangan jika ada.
export async function askAI(history: ChatTurn[]): Promise<AIResult> {
  const { aiProvider, aiFallback } = await getSettings();
  const names = [aiProvider, aiFallback]
    .map((n) => n?.trim().toLowerCase())
    .filter((n): n is string => !!n)
    .filter((n, i, a) => a.indexOf(n) === i);

  let lastError: unknown;
  for (const name of names) {
    try {
      return await call(name, history);
    } catch (e) {
      console.error(`[AI] ${name} gagal:`, e);
      lastError = e;
    }
  }
  throw lastError;
}

export const PROVIDER_NAMES = Object.keys(PROVIDERS);

// Status tiap penyedia untuk halaman Pengaturan (tidak pernah mengirim isi key).
export function providerStatus() {
  return PROVIDER_NAMES.map((name) => {
    const c = PROVIDERS[name];
    return { name, hasKey: !!process.env[c.key], model: process.env[c.model] || c.defaultModel || "" };
  });
}