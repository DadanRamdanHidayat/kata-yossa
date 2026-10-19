"use client";

import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogoMark } from "./Logo";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { label: "Analisis peluang bisnis", text: "Analisis peluang bisnis untuk ekspansi produk kuliner" },
  { label: "Strategi pemasaran", text: "Bagaimana strategi pemasaran digital hemat biaya tapi efektif?" },
  { label: "Pengembangan produk", text: "Langkah-langkah validasi pengembangan produk baru sebelum produksi massal" },
  { label: "Lainnya", text: "Bagaimana cara menstabilkan arus kas (cash flow) bisnis kecil?" },
];

export default function ChatWindow({
  conversationId,
  initialMessages,
}: {
  conversationId?: string;
  initialMessages: Msg[];
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [convId, setConvId] = useState(conversationId);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || loading) return;
    setError("");
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId: convId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Terjadi kesalahan.");
      setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      if (!convId) {
        setConvId(data.conversationId);
        window.history.replaceState(null, "", `/chat?c=${data.conversationId}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6">
        {empty && !loading ? (
          <div className="m-auto max-w-xl py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mb-1 text-2xl font-bold text-navy">Halo, 👋</h2>
            <p className="mb-6 text-sm text-slate-500">Saya Kata Yossa, AI Assistant untuk solusi bisnis Anda.</p>
            <p className="mb-2 text-xs font-semibold text-slate-900">Apa yang ingin Anda tanyakan hari ini?</p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.label}
                  onClick={() => send(s.text)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm transition hover:border-blue-600 hover:text-blue-600"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl space-y-4">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-navy px-4 py-3 text-sm text-white shadow-sm sm:max-w-md">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <LogoMark size={16} />
                  </span>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-md">
                    {m.content}
                  </div>
                </div>
              ),
            )}

            {loading && (
              <div className="flex w-fit items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
                <span className="font-medium text-blue-600">Kata Yossa sedang mengetik</span>
                <span className="flex gap-1">
                  {[0, 150, 300].map((d) => (
                    <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-600" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </span>
              </div>
            )}
            {error && <p className="rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
            <div ref={bottom} />
          </div>
        )}
        {empty && error && <p className="mx-auto mt-4 max-w-xl rounded-lg bg-red-50 p-3 text-xs text-red-700">{error}</p>}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-white p-3 md:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="mx-auto flex max-w-2xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20"
        >
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Tulis pesan Anda..."
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-1.5 text-sm text-slate-900 outline-none"
          />
          <button
            disabled={loading || !input.trim()}
            aria-label="Kirim"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-white transition hover:bg-blue-900 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">
          Tekan Enter untuk mengirim, Shift+Enter untuk baris baru
        </p>
      </div>
    </div>
  );
}