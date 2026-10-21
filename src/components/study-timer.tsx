"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import { useToast } from "@/components/ui";
import { cn, toHm } from "@/lib/utils";

interface Props {
  onLogged?: () => void;
}

const STORAGE_KEY = "myos-timer";
const MIN_SECONDS = 60;
const LOGGED_EVENT = "myos:study-logged";

interface StudyTimerApi {
  running: boolean;
  seconds: number;
  saving: boolean;
  start: () => void;
  pause: () => void;
  finish: () => Promise<void>;
}

const StudyTimerContext = createContext<StudyTimerApi | null>(null);

export function useStudyTimer(): StudyTimerApi {
  const ctx = useContext(StudyTimerContext);
  if (!ctx) throw new Error("useStudyTimer must be used inside StudyTimerProvider");
  return ctx;
}

/** One shared timer that keeps ticking across page navigation. */
export function StudyTimerProvider({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(0);
  const restoredRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { running: boolean; seconds: number; startedAt: number | null };
        if (saved.running && saved.startedAt) {
          const extra = Math.floor((Date.now() - saved.startedAt) / 1000);
          setSeconds(Math.max(0, saved.seconds + extra));
          baseRef.current = saved.seconds;
          startedAtRef.current = saved.startedAt;
          setRunning(true);
        } else if (saved.seconds > 0) {
          setSeconds(saved.seconds);
          baseRef.current = saved.seconds;
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const startedAt = startedAtRef.current;
      if (startedAt) setSeconds(baseRef.current + Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!restoredRef.current) {
      restoredRef.current = true;
      return;
    }
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ running, seconds, startedAt: startedAtRef.current })
      );
    } catch {
      /* ignore */
    }
  }, [running, seconds]);

  function start() {
    if (running) return;
    startedAtRef.current = Date.now();
    setRunning(true);
  }

  function pause() {
    if (startedAtRef.current) {
      baseRef.current = baseRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000);
      startedAtRef.current = null;
      setSeconds(baseRef.current);
    }
    setRunning(false);
  }

  const finish = async () => {
    const startedAt = startedAtRef.current;
    const total =
      running && startedAt
        ? baseRef.current + Math.floor((Date.now() - startedAt) / 1000)
        : seconds;

    setRunning(false);
    startedAtRef.current = null;
    baseRef.current = 0;
    setSeconds(0);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    if (total < MIN_SECONDS) {
      toast("Session under a minute — not logged.", "info");
      return;
    }
    setSaving(true);
    try {
      const minutes = Math.max(1, Math.round(total / 60));
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LEARN", plannedMinutes: minutes, actualMinutes: minutes, title: "Deep work", complete: true }),
      });
      if (!res.ok) throw new Error("Could not save session.");
      toast(`Logged ${minutes} min of deep work.`, "success");
      window.dispatchEvent(new Event(LOGGED_EVENT));
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudyTimerContext.Provider value={{ running, seconds, saving, start, pause, finish }}>
      {children}
    </StudyTimerContext.Provider>
  );
}

export default function StudyTimer({ onLogged }: Props) {
  const { running, seconds, saving, start, pause, finish } = useStudyTimer();

  useEffect(() => {
    if (!onLogged) return;
    const handler = () => onLogged();
    window.addEventListener(LOGGED_EVENT, handler);
    return () => window.removeEventListener(LOGGED_EVENT, handler);
  }, [onLogged]);

  const active = running || seconds > 0;

  return (
    <div className="flex items-center gap-sm">
      <div className="min-w-0 flex-1">
        <span className="text-caption uppercase tracking-wide text-muted">Focus timer</span>
        <p className="text-h2 tabular-nums leading-none text-ink">{toHm(seconds)}</p>
      </div>
      {!running ? (
        <button
          onClick={start}
          aria-label="Start timer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-on-primary transition-opacity hover:opacity-85"
        >
          <Play size={18} />
        </button>
      ) : (
        <button
          onClick={pause}
          aria-label="Pause timer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas-soft text-ink transition-opacity hover:opacity-80"
        >
          <Pause size={18} />
        </button>
      )}
      <button
        onClick={() => void finish()}
        disabled={!active || saving}
        aria-label="Finish and log session"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-ink transition-colors hover:bg-canvas-soft disabled:opacity-30"
      >
        <Square size={16} />
      </button>
    </div>
  );
}

/** Floating "dynamic island" timer. Hidden on home, springs in elsewhere. */
export function StudyTimerIsland({ hidden = false }: { hidden?: boolean }) {
  const { running, seconds, saving, start, pause, finish } = useStudyTimer();

  if (hidden || (!running && seconds === 0)) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-[68px] z-40 -translate-x-1/2">
      <div className="island-pop pointer-events-auto flex items-center gap-xs rounded-full bg-ink py-xxs pl-sm pr-xxs text-on-primary shadow-overlay">
        <span className="relative flex h-2 w-2 shrink-0">
          {running && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          )}
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              running ? "bg-emerald-400" : "bg-amber-400"
            )}
          />
        </span>
        <span className="hidden text-[9px] font-semibold uppercase tracking-wide opacity-60 sm:inline">
          {running ? "Focus" : "Paused"}
        </span>
        <span className="text-caption tabular-nums">{toHm(seconds)}</span>
        <button
          onClick={running ? pause : start}
          aria-label={running ? "Pause timer" : "Resume timer"}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/15"
        >
          {running ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={() => void finish()}
          disabled={saving}
          aria-label="Finish and log session"
          className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-white/15 disabled:opacity-40"
        >
          <Square size={11} />
        </button>
      </div>
    </div>
  );
}
