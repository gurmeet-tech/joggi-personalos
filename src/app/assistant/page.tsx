"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi, Card, Button, Spinner, ErrorState, Badge, useToast } from "@/components/ui";
import { Sparkles, Send, Trash2, Mic, Volume2, VolumeX } from "lucide-react";

interface Msg {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

const SUGGESTIONS = [
  "What should I study right now?",
  "Build me a 7-day plan for my weakest subject.",
  "How do I fix my biggest mistake pattern?",
  "Draft a polite follow-up for a client who went quiet.",
  "Explain the mark distribution in my weakest chapter area.",
];

export default function AssistantPage() {
  const toast = useToast();
  const { data: history, loading, error, reload } = useApi<Msg[]>("/api/assistant");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [listening, setListening] = useState(false);
  const [speakReplies, setSpeakReplies] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

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
      setIsDemo(!!json.isDemo);
      setMessages((m) => [...m, { id: "a-" + Date.now(), role: "assistant", content: json.reply, createdAt: new Date().toISOString() }]);
      if (speakReplies && typeof window !== "undefined" && window.speechSynthesis) {
        const u = new SpeechSynthesisUtterance(json.reply);
        u.lang = "en-IN";
        window.speechSynthesis.speak(u);
      }
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
    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setInput(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    rec.start();
  }

  if (loading) return <Spinner label="Loading assistant…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-3xl flex-col">
      <div className="mb-md flex flex-wrap items-end justify-between gap-sm">
        <div>
          <p className="label-cap">AI companion</p>
          <h1 className="mt-xs text-h2 text-ink">Study assistant.</h1>
          <p className="mt-sm text-body text-muted">Grounded in your real syllabus, scores, mistakes and pipeline — not generic advice.</p>
        </div>
        <div className="flex items-center gap-xs">
          <Button variant="outline" className="!min-h-8 !text-caption" onClick={() => setSpeakReplies((s) => !s)} title="Read replies aloud">
            {speakReplies ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </Button>
          <Button variant="outline" className="!min-h-8 !text-caption" onClick={clearAll}>
            <Trash2 size={14} /> Clear
          </Button>
        </div>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto pr-xs">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-md text-center">
              <Sparkles size={28} className="text-muted" />
              <p className="text-body text-ink">Ask anything about your studies, revision, English or freelance work.</p>
              <div className="flex flex-wrap justify-center gap-xs">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-hairline-soft px-sm py-xs text-caption text-muted hover:border-ink hover:text-ink">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-md">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-md px-md py-sm text-body-sm ${m.role === "user" ? "bg-ink text-on-primary" : "bg-canvas-soft text-ink"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="rounded-md bg-canvas-soft px-md py-sm text-body-sm text-muted">Thinking…</div>
              </div>
            )}
          </div>
        </div>

        {listening && <p className="mt-xs text-caption text-ink">Listening… speak now, then press stop.</p>}

        <div className="mt-md flex items-end gap-xs border-t border-hairline-soft pt-md">
          <textarea
            className="input min-h-11 flex-1 resize-none"
            rows={1}
            placeholder="Ask your assistant…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button variant="outline" onClick={toggleVoice} className={listening ? "!border-ink !text-ink" : ""} aria-label="Voice input">
            <Mic size={16} />
          </Button>
          <Button onClick={() => send()} disabled={sending || !input.trim()} aria-label="Send">
            <Send size={16} />
          </Button>
        </div>
        {isDemo && (
          <p className="mt-xs text-caption text-muted">
            <Badge tone="neutral">Demo mode</Badge> Running without an AI key — responses use your real data with rules-based reasoning. Add AI_API_KEY for full natural language.
          </p>
        )}
      </Card>
    </div>
  );
}
