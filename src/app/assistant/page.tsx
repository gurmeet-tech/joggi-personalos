"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi, Spinner, ErrorState, useToast } from "@/components/ui";
import { greetingForHour, cn } from "@/lib/utils";
import { ArrowUp, Mic, Square, Trash2, Sparkles } from "lucide-react";

interface Msg {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}
interface Profile {
  name: string;
}

const SUGGESTIONS = [
  "What should I study right now?",
  "Build me a 7-day plan for my weakest subject.",
  "How do I fix my biggest mistake pattern?",
  "Draft a polite follow-up for a quiet client.",
];

export default function AssistantPage() {
  const toast = useToast();
  const { data: history, loading, error, reload } = useApi<Msg[]>("/api/assistant");
  const { data: profile } = useApi<Profile>("/api/profile");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const firstName = (profile?.name || "Gurmeet").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());
  const empty = messages.length === 0;

  useEffect(() => {
    if (history) setMessages(history);
  }, [history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setInput("");
    const optimistic: Msg = { id: "tmp-" + Date.now(), role: "user", content, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Assistant failed.");
      setMessages((m) => [...m, { id: "a-" + Date.now(), role: "assistant", content: json.reply, createdAt: new Date().toISOString() }]);
    } catch (e) {
      toast((e as Error).message, "error");
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  async function clearAll() {
    await fetch("/api/assistant", { method: "DELETE" }).catch(() => null);
    setMessages([]);
    toast("Conversation cleared.", "info");
    reload();
  }

  function toggleVoice() {
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SR) {
      toast("Voice input is not supported in this browser. You can type instead.", "error");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => setInput(Array.from(e.results).map((r: any) => r[0].transcript).join(""));
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  if (loading) return <Spinner label="Loading assistant…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-2xl flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-sm">
        <div className="flex items-center gap-xs text-body-sm text-muted">
          <Sparkles size={14} />
          <span>Assistant</span>
        </div>
        {!empty && (
          <button onClick={clearAll} className="flex items-center gap-xxs rounded-full px-sm py-xs text-caption text-muted hover:bg-field hover:text-ink">
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Stream / empty greeting */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center px-md text-center">
            <h1 className="text-h3 text-ink">
              {greeting}, {firstName}.
            </h1>
            <p className="mt-sm max-w-md text-body text-muted">What are we working on today?</p>
            <div className="mt-lg flex w-full max-w-lg flex-col gap-xs">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-md border border-hairline px-md py-sm text-left text-body-sm text-muted transition-colors hover:border-ink hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-lg py-md">
            {messages.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-md bg-canvas-soft px-md py-sm text-body-sm text-ink">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="whitespace-pre-wrap text-body-sm leading-relaxed text-ink">{m.content}</div>
              )
            )}
            {sending && <div className="text-body-sm text-faint">Thinking…</div>}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="pt-md">
        {listening && <p className="mb-xs text-caption text-muted">Listening… speak now.</p>}
        <div className="flex items-end gap-xs rounded-md border border-hairline bg-canvas px-sm py-xs shadow-overlay focus-within:border-ink">
          <textarea
            className="max-h-40 flex-1 resize-none bg-transparent py-xs text-body-sm text-ink outline-none placeholder:text-faint"
            rows={1}
            placeholder={`Message your assistant…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            onClick={toggleVoice}
            aria-label="Voice input"
            className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-field hover:text-ink", listening && "text-accent")}
          >
            {listening ? <Square size={15} /> : <Mic size={16} />}
          </button>
          <button
            onClick={() => send()}
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-on-primary transition-opacity hover:opacity-85 disabled:opacity-30"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
