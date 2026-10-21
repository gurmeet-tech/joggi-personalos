"use client";

import React from "react";
import { ArrowUp, Square } from "lucide-react";
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
  sending,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  sending: boolean;
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
      <PromptInputActions className="justify-end px-xs pt-xs">
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
