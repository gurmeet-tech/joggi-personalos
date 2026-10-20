"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi, Card, Button, Field, Input, Select, Badge, Spinner, ErrorState, Segmented, useToast, Checkbox } from "@/components/ui";
import { QUESTION_TYPE_LABELS, type QuestionType } from "@/lib/types";
import { FlaskConical, Play, FileText, Sparkles } from "lucide-react";

type Subject = { id: string; name: string; chapters: Array<{ id: string; name: string; status: string; lastTestScore: number | null }> };
type Paper = { id: string; title: string; mode: string; totalMarks: number; durationMinutes: number; createdAt: string; isDemo: boolean; _count: { questions: number; attempts: number } };

const MODES = [
  { value: "CHAPTER", label: "Chapter test", hint: "One chapter, focused." },
  { value: "CUSTOM", label: "Custom test", hint: "Pick chapters & types." },
  { value: "HALF", label: "Half-syllabus", hint: "Selected half of the syllabus." },
  { value: "FULL", label: "Full board mock", hint: "Full syllabus, 3 hours." },
  { value: "WEAK", label: "Weak-area test", hint: "Targets your recurring mistakes." },
  { value: "REVISION", label: "Revision test", hint: "Previously studied / incorrect." },
  { value: "PREVIOUS_YEAR", label: "Board-style mock", hint: "CBSE pattern & difficulty." },
] as const;

const ALL_TYPES: QuestionType[] = ["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING", "SHORT", "LONG", "CASE", "NUMERICAL", "DERIVATION"];

export default function ExamStudioPage() {
  const router = useRouter();
  const toast = useToast();
  const { data: subjects, loading: subjectsLoading, reload: reloadSubjects } = useApi<Subject[]>("/api/subjects");
  const { data: papersData, loading: papersLoading, reload: reloadPapers } = useApi<{ papers: Paper[]; ai: { mode: string; model?: string; reason?: string } }>("/api/papers");

  const [mode, setMode] = useState<(typeof MODES)[number]["value"]>("CHAPTER");
  const [subjectId, setSubjectId] = useState("");
  const [chapterQuery, setChapterQuery] = useState("");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState(15);
  const [duration, setDuration] = useState(60);
  const [types, setTypes] = useState<QuestionType[]>(["MCQ", "SHORT", "LONG"]);
  const [negative, setNegative] = useState(false);
  const [materials, setMaterials] = useState("");
  const [generating, setGenerating] = useState(false);

  const subject = useMemo(() => subjects?.find((s) => s.id === subjectId) || null, [subjects, subjectId]);
  const chapterMatches = useMemo(() => {
    if (!subject) return [];
    const q = chapterQuery.trim().toLowerCase();
    return subject.chapters.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [subject, chapterQuery]);

  function applyMode(m: (typeof MODES)[number]["value"]) {
    setMode(m);
    if (m === "FULL" || m === "PREVIOUS_YEAR") {
      setDuration(180);
      setCount(30);
      setTypes(["MCQ", "ASSERTION_REASON", "SHORT", "LONG", "NUMERICAL", "CASE"]);
    } else if (m === "HALF") {
      setDuration(90);
      setCount(20);
    } else if (m === "CHAPTER" || m === "WEAK" || m === "REVISION") {
      setDuration(45);
      setCount(12);
    }
    if (m === "WEAK" || m === "REVISION") setSelectedChapters([]);
  }

  async function generate() {
    if (!subject) {
      toast("Select a subject first.", "error");
      return;
    }
    if ((mode === "CHAPTER" || mode === "CUSTOM") && selectedChapters.length === 0) {
      toast("Pick at least one chapter.", "error");
      return;
    }
    setGenerating(true);
    try {
      const chapterNames =
        mode === "HALF"
          ? subject.chapters.slice(0, Math.ceil(subject.chapters.length / 2)).map((c) => c.name)
          : mode === "FULL" || mode === "PREVIOUS_YEAR"
            ? subject.chapters.map((c) => c.name)
            : selectedChapters;
      const res = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subject.id,
          subject: subject.name,
          chapters: chapterNames,
          mode,
          difficulty,
          questionCount: count,
          durationMinutes: duration,
          questionTypes: types,
          language: "English",
          negativeMarking: negative,
          materials: materials || undefined,
          weakTopics: mode === "WEAK" ? subject.chapters.filter((c) => (c.lastTestScore ?? 100) < 50).map((c) => c.name) : [],
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Generation failed.");
      const paper = await res.json();
      toast("Paper generated. Review it, then start the exam.", "success");
      reloadPapers();
      router.push(`/exam/brief/${paper.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  }

  const ai = papersData?.ai;

  return (
    <div>
      <div className="mb-lg">
        <p className="label-cap">Core feature</p>
        <h1 className="mt-xs text-h2 text-ink">AI Exam Studio.</h1>
        <p className="mt-sm max-w-2xl text-body-lg text-muted">Generate real examination papers on any Class 12 chapter or syllabus range, then sit them in the board exam simulator.</p>
        {ai && (
          <div className="mt-sm inline-flex items-center gap-xs rounded-full bg-canvas-soft px-sm py-xs text-caption text-muted">
            <Sparkles size={12} />
            {ai.mode === "live" ? `AI engine: ${ai.model ?? "live model"}` : "Demo engine: offline procedural generator (no API key configured)"}
          </div>
        )}
      </div>

      <div className="grid gap-lg lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-md">
          <Card>
            <h3 className="text-title text-ink">1. Exam mode</h3>
            <div className="mt-sm grid grid-cols-1 gap-xs sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => applyMode(m.value)}
                  className={`rounded-sm px-md py-sm text-left transition-colors ${mode === m.value ? "bg-ink text-on-primary" : "bg-canvas-soft text-ink hover:opacity-80"}`}
                >
                  <span className="block text-body-sm font-semibold">{m.label}</span>
                  <span className={`block text-caption ${mode === m.value ? "text-on-primary/70" : "text-muted"}`}>{m.hint}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="text-title text-ink">2. Syllabus</h3>
            <div className="mt-sm grid gap-md sm:grid-cols-2">
              <Field label="Subject">
                <Select
                  value={subjectId}
                  onChange={(e) => {
                    setSubjectId(e.target.value);
                    setSelectedChapters([]);
                  }}
                >
                  <option value="">Choose a subject…</option>
                  {subjects?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.chapters.length} chapters)
                    </option>
                  ))}
                </Select>
              </Field>
              {mode !== "FULL" && mode !== "PREVIOUS_YEAR" && mode !== "WEAK" && mode !== "REVISION" && (
                <Field label="Find chapters" hint={subject ? `${selectedChapters.length} selected` : "Select a subject first"}>
                  <Input placeholder="Type to filter chapters…" value={chapterQuery} onChange={(e) => setChapterQuery(e.target.value)} />
                </Field>
              )}
            </div>
            {subject && mode !== "FULL" && mode !== "PREVIOUS_YEAR" && mode !== "WEAK" && mode !== "REVISION" && (
              <div className="mt-md flex max-h-48 flex-wrap gap-xs overflow-y-auto">
                {chapterMatches.map((c) => {
                  const on = selectedChapters.includes(c.name);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChapters((sel) => (on ? sel.filter((x) => x !== c.name) : [...sel, c.name]))}
                      className={`rounded-full px-sm py-xs text-caption transition-colors ${on ? "bg-ink text-on-primary" : "bg-canvas text-ink border border-hairline-soft"}`}
                    >
                      {c.name}
                      {c.lastTestScore != null && <span className={on ? " text-on-primary/70" : " text-muted"}> · {Math.round(c.lastTestScore)}%</span>}
                    </button>
                  );
                })}
                {chapterMatches.length === 0 && <p className="text-body-sm text-muted">No chapters match. Add them in Subjects & syllabus.</p>}
              </div>
            )}
            {(mode === "FULL" || mode === "PREVIOUS_YEAR") && subject && (
              <p className="mt-sm text-body-sm text-muted">All {subject.chapters.length} chapters of {subject.name} will be covered. Duration defaults to 180 minutes.</p>
            )}
            {mode === "WEAK" && (
              <p className="mt-sm text-body-sm text-muted">The engine reads your mistake notebook and recent low scores, then builds a paper around those gaps.</p>
            )}
            {mode === "REVISION" && (
              <p className="mt-sm text-body-sm text-muted">Previously studied or incorrectly answered concepts are re-tested using spaced-repetition timing.</p>
            )}
          </Card>

          <Card>
            <h3 className="text-title text-ink">3. Paper settings</h3>
            <div className="mt-sm grid gap-md sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Difficulty">
                <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {["easy", "moderate", "difficult", "mixed"].map((d) => (
                    <option key={d} value={d}>
                      {d[0].toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Questions">
                <Input type="number" min={3} max={40} value={count} onChange={(e) => setCount(Number(e.target.value))} />
              </Field>
              <Field label="Duration (minutes)">
                <Input type="number" min={5} max={360} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              </Field>
            </div>
            <div className="mt-md">
              <p className="label-cap mb-xs">Question types</p>
              <div className="flex flex-wrap gap-xs">
                {ALL_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))}
                    className={`rounded-full px-sm py-xs text-caption transition-colors ${types.includes(t) ? "bg-ink text-on-primary" : "bg-canvas-soft text-muted hover:text-ink"}`}
                  >
                    {QUESTION_TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
              {types.length === 0 && <p className="mt-xs text-caption text-muted">Pick at least one type.</p>}
            </div>
            <div className="mt-md flex flex-wrap items-center gap-md">
              <Checkbox label="Negative marking (⅓ per wrong objective answer)" checked={negative} onChange={(e) => setNegative(e.target.checked)} />
            </div>
            <div className="mt-md">
              <Field label="Study material (optional)" hint="Paste notes or textbook excerpts to ground the questions. Requires an AI key for live generation.">
                <textarea className="input min-h-20 resize-y" value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="Paste relevant text from your notes or syllabus…" />
              </Field>
            </div>
          </Card>

          <Button className="w-full" onClick={generate} disabled={generating || !subject}>
            {generating ? <Spinner label="Generating paper…" /> : <>Generate paper</>}
          </Button>
        </div>

        <div>
          <Card className="sticky top-24">
            <h3 className="text-title text-ink">Recent papers</h3>
            {papersLoading && <Spinner />}
            {!papersLoading && papersData?.papers.length === 0 && (
              <p className="mt-sm text-body-sm text-muted">No papers yet. Generate your first one — it takes seconds.</p>
            )}
            <ul className="mt-sm flex max-h-[60vh] flex-col gap-xs overflow-y-auto">
              {papersData?.papers.map((p) => (
                <li key={p.id} className="rounded-sm bg-canvas-soft px-sm py-xs">
                  <Link href={`/exam/brief/${p.id}`} className="block">
                    <p className="text-body-sm text-ink">{p.title}</p>
                    <p className="mt-xxs flex items-center gap-xs text-caption text-muted">
                      <Badge tone="outline">{p.mode}</Badge>
                      {p.totalMarks} marks · {p.durationMinutes}m · {p._count.questions}Q
                      {p.isDemo && <span className="text-faint">· demo</span>}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
