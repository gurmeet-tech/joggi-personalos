"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useApi, useToast } from "@/components/ui";
import { greetingForHour } from "@/lib/utils";
import {
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  MoreHorizontal,
  Search,
  X,
} from "lucide-react";
import { PromptSuggestion } from "@/components/ui/prompt-suggestion";
import AssistantPromptBar from "@/components/assistant-prompt-bar";
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

const isDesktop = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

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

/** Clean up stray markdown from older saved replies. */
function plainReply(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ");
}

function updatedLabel(ts: number): string {  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface HistoryPanelProps {
  threads: Thread[];
  activeId: string;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

function HistoryPanel({
  threads,
  activeId,
  onNew,
  onOpen,
  onDelete,
  onClear,
  onClose,
}: HistoryPanelProps) {
  const [query, setQuery] = useState("");
  const previous = threads
    .filter((t) => t.messages.length > 0)
    .filter((t) => t.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-sm pt-sm">
        <div className="flex items-center gap-xs text-body-sm text-ink">
          <Sparkles size={14} />
          <span className="font-medium">Assistant</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-xs text-muted transition-colors hover:bg-field hover:text-ink"
            aria-label="Close chat history"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="px-sm pt-sm">
        <button
          onClick={onNew}
          className="flex w-full items-center justify-center gap-xxs rounded-sm bg-ink px-sm py-xs text-caption text-on-primary transition-opacity hover:opacity-90"
        >
          <Plus size={14} /> New chat
        </button>
      </div>

      <div className="px-sm pt-sm">
        <label className="flex items-center gap-xxs rounded-sm border border-hairline-soft bg-canvas px-xs py-xxs">
          <Search size={13} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-caption text-ink outline-none placeholder:text-faint"
          />
        </label>
      </div>

      <p className="px-sm pb-xxs pt-sm text-caption uppercase tracking-wide text-faint">
        Previous chats
      </p>

      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-xxs">
        {previous.length === 0 ? (
          <p className="px-sm py-sm text-caption text-muted">
            {query ? "No chats match your search." : "No previous chats yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-[2px] pb-sm">
            {previous.map((t) => {
              const activeItem = t.id === activeId;
              return (
                <li key={t.id} className="group flex items-center">
                  <button
                    onClick={() => onOpen(t.id)}
                    className={`flex min-w-0 flex-1 items-center gap-xs rounded-sm px-xs py-xs text-left transition-colors ${
                      activeItem ? "bg-field text-ink" : "text-muted hover:bg-field hover:text-ink"
                    }`}
                  >
                    <MessageSquare size={13} className="shrink-0 text-faint" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-caption text-ink">{t.title}</span>
                      <span className="block text-[10px] text-faint">{updatedLabel(t.updatedAt)}</span>
                    </span>
                  </button>
                  <button
                    onClick={() => onDelete(t.id)}
                    className="mr-xxs rounded-full p-xs text-faint opacity-100 transition-opacity hover:text-ink sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${t.title}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="border-t border-hairline-soft px-sm py-xs">
        <button
          onClick={onClear}
          className="flex w-full items-center gap-xxs rounded-sm px-xs py-xs text-caption text-faint transition-colors hover:bg-field hover:text-ink"
        >
          <Trash2 size={12} /> Clear all chats
        </button>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const toast = useToast();
  const { data: profile } = useApi<Profile>("/api/profile");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const abortRef = useRef<AbortController | null>(null);

  const active = threads.find((t) => t.id === activeId);
  const messages = active?.messages ?? [];
  const empty = messages.length === 0;

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

  const closeOnMobile = () => {
    if (!isDesktop()) setSidebarOpen(false);
  };

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
    const fresh = newThread();
    commit((prev) => [fresh, ...prev.filter((t) => t.messages.length > 0)].slice(0, MAX_THREADS));
    setActiveId(fresh.id);
    closeOnMobile();
  }

  function openThread(id: string) {
    abortRef.current?.abort();
    setSending(false);
    setActiveId(id);
    closeOnMobile();
  }

  function deleteThread(id: string) {
    commit((prev) => prev.filter((t) => t.id !== id));
    if (id === activeId) newChat();
  }

  function clearAll() {
    if (!window.confirm("Delete all previous chats? This can't be undone.")) return;
    abortRef.current?.abort();
    setSending(false);
    const fresh = newThread();
    commit(() => [fresh]);
    setActiveId(fresh.id);
    closeOnMobile();
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

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        toast("Your clipboard is empty.", "info");
        return;
      }
      setInput((v) => (v ? `${v} ${text.trim()}` : text.trim()));
    } catch {
      toast("Clipboard access was blocked. Use Ctrl/Cmd + V instead.", "error");
    }
  }

  function submit() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void send(text);
  }

  function handleDictate() {
    void dictate().then((text) => {
      if (text) setInput((v) => (v ? `${v} ${text}` : text));
    });
  }

  const panelProps = {
    threads,
    activeId,
    onNew: newChat,
    onOpen: openThread,
    onDelete: deleteThread,
    onClear: clearAll,
  };

  const composer = (
    <AssistantPromptBar
      value={input}
      onChange={setInput}
      onSubmit={submit}
      onStop={() => abortRef.current?.abort()}
      onPaste={() => void handlePaste()}
      onDictate={handleDictate}
      sending={sending}
    />
  );

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl gap-md p-md pb-0 lg:p-lg lg:pb-xs">
      {/* Desktop chat sidebar */}
      {sidebarOpen && (
        <aside className="hidden w-60 shrink-0 overflow-hidden rounded-md border border-hairline-soft bg-canvas-soft lg:block">
          <HistoryPanel {...panelProps} />
        </aside>
      )}

      {/* Mobile / tablet drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} aria-hidden />
          <div className="pop-in absolute inset-y-0 left-0 flex w-[84%] max-w-xs flex-col overflow-hidden rounded-r-md border-r border-hairline-soft bg-canvas shadow-overlay">
            <HistoryPanel {...panelProps} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Chat column */}
      <section className="relative flex min-w-0 flex-1 flex-col">
        <header className="border-b border-hairline-soft pb-sm">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-xs">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded-full p-xs text-muted transition-colors hover:bg-field hover:text-ink"
              aria-label="Chats and options"
              aria-expanded={sidebarOpen}
            >
              <MoreHorizontal size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm font-semibold text-ink">{active?.title || "New chat"}</p>
              <p className="truncate text-[10px] text-faint">MY OS study assistant</p>
            </div>
            <button
              onClick={newChat}
              className="flex items-center gap-xxs rounded-full px-sm py-xs text-caption text-muted transition-colors hover:bg-field hover:text-ink"
            >
              <Plus size={14} /> New chat
            </button>
          </div>
        </header>

        {/* Stream / minimal empty state */}
        <div ref={scrollRef} className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex h-full w-full max-w-2xl flex-col items-center justify-center px-md pb-20 text-center">
              <p className="text-h3 text-ink">
                {greeting}, {firstName}.
              </p>
              <p className="mt-xxs text-body-sm text-muted">Ask anything about your studies.</p>
              <div className="mt-md flex flex-wrap justify-center gap-xs">
                {SUGGESTIONS.map((s) => (
                  <PromptSuggestion key={s} onClick={() => setInput(s)}>
                    {s}
                  </PromptSuggestion>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-md pb-36 pt-md">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl bg-canvas-soft px-sm py-xs text-body text-ink">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="whitespace-pre-wrap text-body leading-relaxed text-ink">
                    {plainReply(m.content)}
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

        {/* Floating composer — messages scroll underneath it */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-canvas via-canvas to-transparent pt-xl">
          <div className="pointer-events-auto mx-auto w-full max-w-2xl">{composer}</div>
        </div>
      </section>
    </div>
  );
}
