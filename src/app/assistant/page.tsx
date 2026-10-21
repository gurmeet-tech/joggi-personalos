"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApi, useToast } from "@/components/ui";
import { greetingForHour } from "@/lib/utils";
import { Sparkles, Plus, History, Trash2, MessageSquare } from "lucide-react";
import PromptBar from "@/components/reactbits/PromptBar";
import LatticeLoader from "@/components/reactbits/LatticeLoader";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
interface Thread {
  id: string;
  title: string;
  messages: Msg[];
  updatedAt: number;
}
interface Profile {
  name: string;
}

const STORE_KEY = "myos-assistant-threads";
const MAX_THREADS = 20;

const uid = () => Math.random().toString(36).slice(2, 10);

const newThread = (): Thread => ({
  id: uid(),
  title: "New chat",
  messages: [],
  updatedAt: Date.now(),
});

const SUGGESTIONS = [
  "What should I study right now?",
  "Build a 7-day plan",
  "Review my weak chapters",
];

function loadThreads(): Thread[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveThreads(threads: Thread[]) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(threads.slice(0, MAX_THREADS)));
  } catch {
    /* ignore quota errors */
  }
}

export default function AssistantPage() {
  const toast = useToast();
  const { data: profile } = useApi<Profile>("/api/profile");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [sending, setSending] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = threads.find((t) => t.id === activeId);
  const messages = active?.messages ?? [];
  const empty = messages.length === 0;
  const pastChats = threads
    .filter((t) => t.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const firstName = (profile?.name || "Gurmeet").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());

  const commit = useCallback((updater: (prev: Thread[]) => Thread[]) => {
    setThreads((prev) => {
      const next = updater(prev);
      saveThreads(next);
      return next;
    });
  }, []);

  // Every time the assistant is opened, start a fresh chat — previous ones stay in history.
  useEffect(() => {
    const stored = loadThreads().filter((t) => t.messages?.length);
    const fresh = newThread();
    const next = [fresh, ...stored].slice(0, MAX_THREADS);
    setThreads(next);
    setActiveId(fresh.id);
    saveThreads(next);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, sending, activeId]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || sending || !activeId) return;

    const threadId = activeId;
    const userMsg: Msg = { id: "u-" + uid(), role: "user", content, createdAt: new Date().toISOString() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));

    commit((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              title: t.messages.length ? t.title : content.slice(0, 48),
              messages: [...t.messages, userMsg],
              updatedAt: Date.now(),
            }
          : t
      )
    );
    setSending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Assistant failed.");
      const reply: Msg = { id: "a-" + uid(), role: "assistant", content: json.reply, createdAt: new Date().toISOString() };
      commit((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, messages: [...t.messages, reply], updatedAt: Date.now() } : t
        )
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        toast((e as Error).message, "error");
        commit((prev) =>
          prev.map((t) =>
            t.id === threadId ? { ...t, messages: t.messages.filter((m) => m.id !== userMsg.id) } : t
          )
        );
      }
    } finally {
      setSending(false);
      abortRef.current = null;
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setSending(false);
    setHistoryOpen(false);
    const fresh = newThread();
    commit((prev) => [fresh, ...prev.filter((t) => t.messages.length > 0)].slice(0, MAX_THREADS));
    setActiveId(fresh.id);
  }

  function openThread(id: string) {
    abortRef.current?.abort();
    setSending(false);
    setHistoryOpen(false);
    setActiveId(id);
  }

  function deleteThread(id: string) {
    commit((prev) => prev.filter((t) => t.id !== id));
    if (id === activeId) newChat();
  }

  function dictate(): Promise<string> {
    return new Promise((resolve) => {
      const SR =
        (typeof window !== "undefined" &&
          ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) ||
        null;
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

  return (
    <>
      <div className="mx-auto flex h-[calc(100dvh-11rem)] max-w-2xl flex-col lg:h-[calc(100dvh-9rem)]">
        {/* Header */}
        <header className="flex items-center justify-between pb-xs">
          <div className="flex items-center gap-xs text-body-sm text-muted">
            <Sparkles size={13} />
            <span>Assistant</span>
          </div>
          <div className="relative flex items-center gap-xs">
            <button
              onClick={newChat}
              className="flex items-center gap-xxs rounded-full px-sm py-xs text-caption text-muted transition-colors hover:bg-field hover:text-ink"
            >
              <Plus size={13} /> New chat
            </button>
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="rounded-full p-xs text-muted transition-colors hover:bg-field hover:text-ink"
              aria-label="Previous chats"
              aria-expanded={historyOpen}
            >
              <History size={15} />
            </button>
            {historyOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setHistoryOpen(false)} aria-hidden />
                <div className="pop-in absolute right-0 top-[calc(100%+6px)] z-40 w-72 overflow-hidden rounded-md border border-hairline-soft bg-canvas shadow-overlay">
                  <p className="px-sm py-xs text-caption uppercase tracking-wide text-faint">Previous chats</p>
                  {pastChats.length === 0 ? (
                    <p className="px-sm py-md text-body-sm text-muted">No previous chats yet.</p>
                  ) : (
                    <ul className="no-scrollbar max-h-72 overflow-y-auto py-xs">
                      {pastChats.map((t) => (
                        <li key={t.id} className="group flex items-center">
                          <button
                            onClick={() => openThread(t.id)}
                            className="flex min-w-0 flex-1 items-center gap-xs px-sm py-xs text-left hover:bg-canvas-soft"
                          >
                            <MessageSquare size={13} className="shrink-0 text-faint" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-body-sm text-ink">{t.title}</span>
                              <span className="block text-caption text-faint">
                                {new Date(t.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                            </span>
                          </button>
                          <button
                            onClick={() => deleteThread(t.id)}
                            className="mr-xs rounded-full p-xs text-faint opacity-100 transition-opacity hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
                            aria-label={`Delete ${t.title}`}
                          >
                            <Trash2 size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </div>
        </header>

        {/* Stream / minimal empty state */}
        <div ref={scrollRef} className="no-scrollbar flex-1 overflow-y-auto pb-36">
          {empty ? (
            <div className="flex h-full flex-col items-center justify-center px-md text-center">
              <p className="text-h3 text-ink">
                {greeting}, {firstName}.
              </p>
              <p className="mt-xxs text-body-sm text-muted">Ask anything about your studies.</p>
              <div className="mt-md flex flex-wrap justify-center gap-xs">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-hairline px-sm py-xxs text-caption text-muted transition-colors hover:border-ink hover:text-ink"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-md py-md">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-canvas-soft px-sm py-xs text-body text-ink">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="whitespace-pre-wrap text-body leading-relaxed text-ink">
                    {m.content}
                  </div>
                )
              )}
              {sending && (
                <LatticeLoader
                  label="Thinking"
                  status="working"
                  grid={3}
                  pattern="orbit"
                  cellSize={5}
                  fontSize={11}
                  color="var(--chart-ink)"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky floating composer — rides above the mobile bottom nav */}
      <div className="pointer-events-none fixed inset-x-0 bottom-16 z-30 lg:bottom-0 lg:left-[17rem]">
        <div className="mx-auto w-full max-w-2xl px-md pb-sm lg:px-xl">
          <div className="pointer-events-auto rounded-[18px] shadow-overlay">
            <PromptBar
              placeholder="Ask anything…"
              busy={sending}
              width={768}
              radius={18}
              maxRows={4}
              background="var(--chart-soft)"
              menuBackground="var(--chart-tip-bg)"
              color="var(--chart-ink)"
              sparkColor="var(--chart-ink)"
              sources={[
                { key: "tasks", name: "Tasks", description: "Your open tasks and to-dos" },
                { key: "mistakes", name: "Mistakes", description: "Your mistake notebook" },
                { key: "revisions", name: "Revisions", description: "Chapters due for revision" },
              ]}
              commands={[
                { key: "plan", name: "plan", description: "Build a study plan" },
                { key: "review", name: "review", description: "Review weak chapters" },
              ]}
              models={[]}
              efforts={[]}
              onSend={(text) => send(text)}
              onStop={() => abortRef.current?.abort()}
              onAttach={attach}
              onDictate={dictate}
            />
          </div>
        </div>
      </div>
    </>
  );
}
