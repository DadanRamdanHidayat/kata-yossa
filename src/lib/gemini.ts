import "server-only";
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "./prompt";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const PRICE_IN = Number(process.env.GEMINI_PRICE_IN ?? 0.3); // USD per 1 juta token
const PRICE_OUT = Number(process.env.GEMINI_PRICE_OUT ?? 2.5);

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function askGemini(history: ChatTurn[]) {
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
  });

  const text = res.text?.trim();
  if (!text) throw new Error("Respons AI kosong");

  const inputTokens = res.usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = res.usageMetadata?.candidatesTokenCount ?? 0;
  const costUsd = (inputTokens * PRICE_IN + outputTokens * PRICE_OUT) / 1_000_000;

  return { text, inputTokens, outputTokens, costUsd };
}
