"use client";

import React from "react";
import { ArrowUp, ClipboardPaste, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui";
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
  onPaste,
  onDictate,
  sending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  onPaste: () => void;
  onDictate: () => void;
  sending: boolean;
}) {
  return (
    <PromptInput
      className="assistant-prompt rounded-3xl border border-gray-200 bg-white p-sm shadow-xl dark:border-white/10 dark:bg-[#1b1b1b]"
      value={value}
      onValueChange={onChange}
      onSubmit={onSubmit}
      maxHeight={160}
      isLoading={sending}
    >
      <PromptInputTextarea placeholder="Ask anything…" className="px-xs" />
      <PromptInputActions className="justify-between px-xs pt-xs">
        <div className="flex items-center gap-xxs">
          <PromptInputAction tooltip="Paste from clipboard">
            <Button
              type="button"
              variant="ghost"
              onClick={onPaste}
              aria-label="Paste from clipboard"
              className="h-8 w-8 min-h-0 rounded-full p-0"
            >
              <ClipboardPaste size={15} />
            </Button>
          </PromptInputAction>
          <PromptInputAction tooltip="Dictate">
            <Button
              type="button"
              variant="ghost"
              onClick={onDictate}
              aria-label="Dictate"
              className="h-8 w-8 min-h-0 rounded-full p-0"
            >
              <Mic size={15} />
            </Button>
          </PromptInputAction>
        </div>
        <PromptInputAction tooltip={sending ? "Stop" : "Send"} side="top">
          <Button
            type="button"
            onClick={sending ? onStop : onSubmit}
            disabled={!sending && !value.trim()}
            aria-label={sending ? "Stop" : "Send"}
            className="h-8 w-8 min-h-0 rounded-full p-0"
          >
            {sending ? <Square size={12} fill="currentColor" /> : <ArrowUp size={16} />}
          </Button>
        </PromptInputAction>
      </PromptInputActions>
    </PromptInput>
  );
}
