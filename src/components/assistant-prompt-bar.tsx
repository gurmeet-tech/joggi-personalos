"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUp, Brain, Check, ClipboardPaste, Mic, Plus, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PromptInput, PromptInputTextarea } from "@/components/ui/prompt-input";

const activeTone =
  "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/40";

export default function AssistantPromptBar({
  value,
  onChange,
  onSubmit,
  onStop,
  sending,
  deep,
  onToggleDeep,
  pasteMode,
  onTogglePaste,
  listening,
  onToggleMic,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  sending: boolean;
  deep: boolean;
  onToggleDeep: () => void;
  pasteMode: boolean;
  onTogglePaste: () => void;
  listening: boolean;
  onToggleMic: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the utilities menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const menuItem =
    "flex w-full items-center gap-sm rounded-sm px-sm py-xs text-body-sm text-ink transition-colors hover:bg-canvas-soft";

  return (
    <div className="relative" ref={wrapRef}>
      <PromptInput
        className="assistant-prompt w-full rounded-2xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#1b1b1b]"
        value={value}
        onValueChange={onChange}
        onSubmit={onSubmit}
        maxHeight={160}
        isLoading={sending}
      >
        <div className="flex items-center gap-1">
          {/* Utilities live behind a single plus, like a compact chat composer. */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label="Prompt tools"
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                menuOpen || deep || listening ? activeTone : "text-muted hover:bg-field hover:text-ink"
              )}
            >
              <Plus size={16} />
            </button>

            {menuOpen && (
              <div className="absolute bottom-full left-0 z-50 mb-2 w-56 overflow-hidden rounded-md border border-hairline-soft bg-canvas p-1 shadow-overlay">
                <button
                  type="button"
                  onClick={onToggleDeep}
                  aria-pressed={deep}
                  className={cn(menuItem, deep && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300")}
                >
                  <Brain size={14} />
                  <span className="flex-1 text-left">Deep thinking</span>
                  {deep && <Check size={13} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTogglePaste();
                    setMenuOpen(false);
                  }}
                  className={menuItem}
                >
                  <ClipboardPaste size={14} />
                  <span className="flex-1 text-left">Paste text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMic();
                    setMenuOpen(false);
                  }}
                  className={cn(menuItem, listening && "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300")}
                >
                  <Mic size={14} />
                  <span className="flex-1 text-left">{listening ? "Stop dictation" : "Dictate"}</span>
                </button>
              </div>
            )}
          </div>

          <PromptInputTextarea
            placeholder={listening ? "Listening…" : "Ask anything…"}
            className="flex-1 px-2 py-1.5"
          />

          <Button
            type="button"
            onClick={sending ? onStop : onSubmit}
            disabled={!sending && !value.trim()}
            aria-label={sending ? "Stop" : "Send"}
            className="h-8 w-8 min-h-0 shrink-0 rounded-full p-0"
          >
            {sending ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} />}
          </Button>
        </div>
      </PromptInput>
    </div>
  );
}
