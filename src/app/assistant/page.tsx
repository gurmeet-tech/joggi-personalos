"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi, Spinner, ErrorState, useToast } from "@/components/ui";
import { greetingForHour } from "@/lib/utils";
import { Trash2, Sparkles } from "lucide-react";
import PromptBar from "@/components/reactbits/PromptBar";
import ThoughtLine from "@/components/reactbits/ThoughtLine";
import LatticeLoader from "@/components/reactbits/LatticeLoader";

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
  const { loading, error, reload } = useApi<Msg[]>("/api/assistant");
  const { data: profile } = useApi<Profile>("/api/profile");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const firstName = (profile?.name || "Gurmeet").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());
  const empty = messages.length === 0;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  async function send(text?: string) {
    const content = (text ?? "").trim();
    if (!content || sending) return;
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

  function dictate(): Promise<string> {
    return new Promise((resolve) => {
      const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
      if (!SR) {
        toast("Voice input is not supported in this browser. You can type instead.", "error");
        resolve("");
        return;
      }
      const rec = new SR();
      recognitionRef.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (e: any) => resolve(Array.from(e.results).map((r: any) => r[0].transcript).join(" "));
      rec.onerror = () => resolve("");
      rec.onend = () => resolve("");
      rec.start();
    });
  }

  async function attach(): Promise<string> {
    toast("Attachments are visual only — paste the text in and I'll read it.", "info");
    return "notes.txt";
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
            {sending && (
              <div className="flex items-center gap-sm">
                <LatticeLoader label="Thinking" status="working" grid={3} pattern="orbit" cellSize={5} fontSize={12} color="var(--chart-ink)" />
                <ThoughtLine label="Working it out" working showTimer={false} fontSize={12} color="var(--chart-axis)" glyphColor="var(--chart-axis)" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Composer — sticky on mobile so it rides above the bottom nav */}
      <div className="sticky bottom-14 z-10 -mx-md mt-md bg-gradient-to-t from-canvas via-canvas to-transparent px-md pb-sm pt-md lg:static lg:bottom-auto lg:mx-0 lg:px-0 lg:pt-md">
        <PromptBar
          placeholder="Message your assistant…"
          busy={sending}
          width={768}
          radius={16}
          background="var(--chart-soft)"
          menuBackground="var(--chart-tip-bg)"
          color="var(--chart-ink)"
          sparkColor="var(--chart-ink)"
          sources={[
            { key: "tasks", name: "Tasks", description: "Your open tasks and to-dos" },
            { key: "mistakes", name: "Mistakes", description: "Your mistake notebook" },
            { key: "revisions", name: "Revisions", description: "Chapters due for revision" },
            { key: "leads", name: "Freelance", description: "Client leads and follow-ups" },
          ]}
          commands={[
            { key: "plan", name: "plan", description: "Build a study plan" },
            { key: "test", name: "test", description: "Generate a mock test" },
            { key: "review", name: "review", description: "Review weak chapters" },
          ]}
          models={[
            { key: "big-pickle", name: "MY OS model", tag: "fast" },
          ]}
          onSend={(text) => send(text)}
          onStop={() => setSending(false)}
          onAttach={attach}
          onDictate={dictate}
        />
      </div>
    </div>
  );
}
