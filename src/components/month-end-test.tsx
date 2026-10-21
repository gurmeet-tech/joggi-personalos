"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge, Spinner, useApi, useToast } from "@/components/ui";
import { CalendarCheck2, Sparkles } from "lucide-react";
import { CHAPTERS_CHANGED_EVENT } from "@/lib/utils";

type MonthEnd = {
  label: string;
  lastWeek: boolean;
  count: number;
  chapters: Array<{ id: string; name: string; subject: string }>;
};

export default function MonthEndTest() {
  const router = useRouter();
  const toast = useToast();
  const { data, reload } = useApi<MonthEnd>("/api/month-end-test");
  const [building, setBuilding] = useState(false);

  useEffect(() => {
    const refresh = () => reload();
    window.addEventListener(CHAPTERS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(CHAPTERS_CHANGED_EVENT, refresh);
  }, [reload]);

  async function start() {
    setBuilding(true);
    try {
      const res = await fetch("/api/month-end-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || "Could not build the recall test.");
      router.push(`/exam/active/${result.attemptId}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setBuilding(false);
    }
  }

  if (!data) return null;

  const questions = Math.min(20, Math.max(8, data.count * 2));

  return (
    <Card className="mb-md">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex items-start gap-sm">
          <span className="mt-xxs flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-canvas-soft text-ink">
            <CalendarCheck2 size={16} />
          </span>
          <div>
            <h2 className="text-title text-ink">Month-end recall</h2>
            <p className="mt-xxs text-caption text-muted">
              {data.count === 0
                ? "Finish chapters in your week plan — they'll be tested together here."
                : `${data.count} chapter${data.count === 1 ? "" : "s"} studied in ${data.label}, tested together.`}
            </p>
          </div>
        </div>
        <Badge tone={data.lastWeek ? "ink" : "neutral"}>{data.lastWeek ? "This week" : "End of month"}</Badge>
      </div>

      {data.count > 0 && (
        <div className="mt-sm flex flex-wrap gap-xxs">
          {data.chapters.slice(0, 8).map((c) => (
            <span key={c.id} className="rounded-full bg-canvas-soft px-sm py-xxs text-caption text-muted">
              {c.name}
            </span>
          ))}
          {data.count > 8 && (
            <span className="rounded-full bg-canvas-soft px-sm py-xxs text-caption text-muted">+{data.count - 8} more</span>
          )}
        </div>
      )}

      <button className="btn-primary mt-sm w-full" onClick={() => void start()} disabled={data.count === 0 || building}>
        {building ? (
          <Spinner label="Building recall test…" />
        ) : (
          <>
            <Sparkles size={14} /> Take {questions}-question recall test
          </>
        )}
      </button>
      <p className="mt-xs text-center text-caption text-faint">
        {data.count === 0
          ? "Tick chapters in the 7-day view to unlock the test."
          : "A mixed MCQ paper from every chapter you completed this month."}
      </p>
    </Card>
  );
}
