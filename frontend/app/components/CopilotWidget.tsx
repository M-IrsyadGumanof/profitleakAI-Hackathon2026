"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Bot, 
  X, 
  Send, 
  Loader2
} from "lucide-react";
import { copilotChat } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  source?: string;
  time: string;
}

let messageCounter = 0;
function createMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}`;
}

function getCurrentTimeStr(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

interface CopilotWidgetProps {
  summary?: unknown;
  rows?: unknown[];
  filename?: string;
}

const QUICK_PROMPTS = [
  {
    label: "🔍 Transaksi Terboros",
    text: "Jelaskan transaksi mana yang paling boros dan apa penyebab utamanya?",
  },
  {
    label: "✉️ Draf Surat Ekspedisi",
    text: "Buatkan draf email komplain resmi ke ekspedisi terkait selisih tarif audit ini.",
  },
  {
    label: "📦 Strategi Bundling",
    text: "Bagaimana strategi bundling dan harga agar ongkir tidak menghabiskan margin kotor?",
  },
];

export function CopilotWidget({ summary, rows, filename }: CopilotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "model",
      content:
        "Halo! Saya **ProfitLeak AI Copilot**. Saya memegang data hasil audit transaksi saat ini. Silakan tanyakan analisis transaksi terburuk, saran mitigasi, atau minta saya buatkan draf negosiasi ke ekspedisi!",
      source: "gemini",
      time: "Baru saja",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: createMessageId("user"),
      role: "user",
      content: text,
      time: getCurrentTimeStr(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await copilotChat({
        message: text,
        history,
        summary,
        rows,
        filename,
      });

      const botMsg: Message = {
        id: createMessageId("bot"),
        role: "model",
        content: res.reply,
        source: res.source,
        time: getCurrentTimeStr(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses respon AI.";
      const errorMsg: Message = {
        id: createMessageId("err"),
        role: "model",
        content: `Maaf, saya mengalami kendala: ${errMsg}`,
        source: "system",
        time: getCurrentTimeStr(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-copilot-widget="true" className="no-print fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="w-[360px] sm:w-[420px] h-[550px] max-h-[85vh] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-3 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white p-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight">ProfitLeak Copilot</h3>
                  <span className="text-[10px] bg-emerald-400/20 text-emerald-200 px-1.5 py-0.5 rounded-full font-medium border border-emerald-400/30">
                    Gemini Live
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/80">Asisten Logistik & Audit Profit</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/15 text-white/80 hover:text-white transition-colors"
              title="Tutup percakapan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-200/80 dark:border-zinc-800 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.text)}
                disabled={loading}
                className="text-[11px] whitespace-nowrap bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700 px-2.5 py-1 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-2xs disabled:opacity-50"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/60 dark:border-indigo-800/60">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-blue-600 text-white rounded-br-xs"
                        : "bg-slate-100 dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 rounded-bl-xs border border-slate-200/70 dark:border-zinc-700/60"
                    }`}
                  >
                    {/* Format text sederhana dengan whitespace preserved */}
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    <div
                      className={`text-[10px] mt-1 flex items-center justify-end gap-1.5 ${
                        isUser ? "text-blue-200" : "text-slate-400 dark:text-zinc-400"
                      }`}
                    >
                      <span>{msg.time}</span>
                      {msg.source === "gemini" && !isUser && (
                        <span className="font-semibold text-indigo-500">• Gemini AI</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-200/60">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-100 dark:bg-zinc-800/90 border border-slate-200/70 dark:border-zinc-700/60 rounded-2xl rounded-bl-xs px-3.5 py-2.5 text-slate-500 dark:text-zinc-400 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span className="text-xs">Copilot sedang menganalisis audit...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Field */}
          <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
              placeholder="Tanya apa saja seputar audit, saran mitigasi, atau negosiasi..."
              disabled={loading}
              className="flex-1 bg-slate-50 dark:bg-zinc-800/80 text-slate-900 dark:text-zinc-100 text-xs sm:text-sm rounded-xl px-3 py-2.5 border border-slate-200 dark:border-zinc-700 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-xs disabled:opacity-40 disabled:scale-100"
              title="Kirim pesan"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative inline-flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all border border-white/20 select-none cursor-pointer"
        aria-label="Tanya AI Copilot"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
        </span>
        <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
        <span>{isOpen ? "Tutup Copilot" : "Tanya AI Copilot"}</span>
      </button>
    </div>
  );
}
