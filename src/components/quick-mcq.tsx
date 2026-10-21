"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Select, Segmented, Spinner, useApi, useToast } from "@/components/ui";
import { Timer, Play, BookOpen } from "lucide-react";

type Subject = {
  id: string;
  name: string;
  chapters: Array<{ id: string; name: string }>;
};

type Scope = "all" | "chapter";

export default function QuickMcq() {
  const router = useRouter();
  const toast = useToast();
  const { data: subjects } = useApi<Subject[]>("/api/subjects");
  const [subjectId, setSubjectId] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [chapter, setChapter] = useState("");
  const [loading, setLoading] = useState(false);

  const subject = useMemo(
    () => subjects?.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId]
  );

  useEffect(() => {
    if (!subjectId && subjects?.length) setSubjectId(subjects[0].id);
  }, [subjects, subjectId]);

  useEffect(() => {
    setChapter("");
  }, [subjectId]);

  async function start() {
    if (!subject) return;
    if (scope === "chapter" && !chapter) {
      toast("Pick a chapter first.", "error");
      return;
    }
    setLoading(true);
    try {
      const chapters = scope === "all" ? subject.chapters.map((c) => c.name) : [chapter];
      const paperRes = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          subject: subject.name,
          chapters,
          mode: "CUSTOM",
          difficulty: "mixed",
          questionCount: 5,
          durationMinutes: 5,
          questionTypes: ["MCQ"],
          language: "English",
          negativeMarking: false,
          weakTopics: [],
        }),
      });
      const paper = await paperRes.json().catch(() => ({}));
      if (!paperRes.ok) throw new Error(paper.error || "Could not build the test.");

      const attemptRes = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper.id }),
      });
      const attempt = await attemptRes.json().catch(() => ({}));
      if (!attemptRes.ok) throw new Error(attempt.error || "Could not start the test.");

      router.push(`/exam/active/${attempt.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setLoading(false);
    }
  }

  const disabled = !subject || loading || (scope === "chapter" && !chapter);

  return (
    <Card className="mb-md">
      <div className="flex items-start justify-between gap-sm">
        <div className="flex items-start gap-sm">
          <span className="mt-xxs flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-canvas-soft text-ink">
            <Timer size={16} />
          </span>
          <div>
            <h2 className="text-title text-ink">5-minute MCQ sprint</h2>
            <p className="mt-xxs text-caption text-muted">
              Five rapid questions — one chapter or the whole syllabus.
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-hairline px-sm py-xxs text-caption text-muted">5 min</span>
      </div>

      <div className="mt-sm flex flex-col gap-xs">
        <Select
          value={subjectId}
          onChange={(e) => setSubjectId(e.target.value)}
          aria-label="Subject"
        >
          {!subjects?.length && <option value="">No subjects yet</option>}
          {subjects?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>

        <Segmented<Scope>
          options={[
            { value: "all", label: "Whole syllabus" },
            { value: "chapter", label: "One chapter" },
          ]}
          value={scope}
          onChange={setScope}
          className="w-full"
        />

        {scope === "chapter" && (
          <Select
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            aria-label="Chapter"
          >
            <option value="">Choose a chapter…</option>
            {subject?.chapters.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <button className="btn-primary mt-sm w-full" onClick={() => void start()} disabled={disabled}>
        {loading ? (
          <Spinner label="Building your test…" />
        ) : (
          <>
            <Play size={14} /> Start 5-minute test
          </>
        )}
      </button>
      {scope === "all" && subject && subject.chapters.length > 0 && (
        <p className="mt-xs flex items-center justify-center gap-xxs text-caption text-faint">
          <BookOpen size={12} /> Pulls from all {subject.chapters.length} chapters of {subject.name}
        </p>
      )}
    </Card>
  );
}
