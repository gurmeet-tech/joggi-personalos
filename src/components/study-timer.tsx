"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, Pause, Square } from "lucide-react";
import { useToast } from "@/components/ui";
import { toHm } from "@/lib/utils";

interface Props {
  onLogged?: () => void;
}

const STORAGE_KEY = "myos-timer";
const MIN_SECONDS = 60;

export default function StudyTimer({ onLogged }: Props) {
  const toast = useToast();
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const baseRef = useRef(0);

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

  async function finish() {
    setRunning(false);
    const total = seconds;
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
      onLogged?.();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

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
        onClick={finish}
        disabled={!active || saving}
        aria-label="Finish and log session"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-300 text-ink transition-colors hover:bg-canvas-soft disabled:opacity-30"
      >
        <Square size={16} />
      </button>
    </div>
  );
}
