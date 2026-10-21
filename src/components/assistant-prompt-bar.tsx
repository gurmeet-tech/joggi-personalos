"use client";

import React from "react";
import { ArrowUp, Brain, ClipboardPaste, Square } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputActions,
  PromptInputAction,
} from "@/components/ui/prompt-input";

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
}) {
  return (
    <PromptInput
      className="assistant-prompt w-full rounded-3xl border border-gray-200 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#1b1b1b]"
      value={value}
      onValueChange={onChange}
      onSubmit={onSubmit}
      maxHeight={160}
      isLoading={sending}
    >
      <PromptInputTextarea placeholder="Ask anything…" className="min-h-[34px] px-sm" />
      <PromptInputActions className="justify-between gap-xs px-xs pt-xs">
        <div className="flex items-center gap-xxs">
          <PromptInputAction tooltip="Deep thinking">
            <button
              type="button"
              onClick={onToggleDeep}
              aria-pressed={deep}
              aria-label="Deep thinking"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                deep
                  ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/40"
                  : "border-transparent text-muted hover:bg-field hover:text-ink"
              )}
            >
              <Brain size={14} />
            </button>
          </PromptInputAction>
          <PromptInputAction tooltip="Paste text">
            <button
              type="button"
              onClick={onTogglePaste}
              aria-pressed={pasteMode}
              aria-label="Paste text"
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border transition-colors",
                pasteMode
                  ? "border-sky-300 bg-sky-50 text-sky-700 ring-2 ring-sky-200 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/40"
                  : "border-transparent text-muted hover:bg-field hover:text-ink"
              )}
            >
              <ClipboardPaste size={14} />
            </button>
          </PromptInputAction>
        </div>
        <PromptInputAction tooltip={sending ? "Stop" : "Send"}>
          <Button
            type="button"
            onClick={sending ? onStop : onSubmit}
            disabled={!sending && !value.trim()}
            aria-label={sending ? "Stop" : "Send"}
            className="h-8 w-8 min-h-0 shrink-0 rounded-full p-0"
          >
            {sending ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} />}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
