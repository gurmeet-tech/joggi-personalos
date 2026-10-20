"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Progress, useToast, Field, Input, Modal } from "@/components/ui";
import { pct, relativeDay } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle, TrendingUp, RotateCcw, FlaskConical, BookmarkPlus } from "lucide-react";

interface EvalItem {
  questionId: string;
  number: number;
  awarded: number;
  maxMarks: number;
  correct: boolean | null;
  comment: string;
  modelAnswer?: string;
  scheme?: string[];
  kind: "objective" | "subjective";
}
interface Results {
  id: string;
  status: string;
  submittedAt: string | null;
  autoSubmitted: boolean;
  score: number | null;
  maxScore: number;
  objectiveScore: number | null;
  subjectiveScore: number | null;
  evaluation: {
    items: EvalItem[];
    objectiveScore: number;
    objectiveMax: number;
    subjectiveScore: number;
    subjectiveMax: number;
    totalScore: number;
    maxScore: number;
    strongest: string[];
    weakest: string[];
    summary: string;
    isDemo: boolean;
  } | null;
  paper: {
    id: string;
    title: string;
    subjectName: string;
    isDemo: boolean;
    questions: Array<{ id: string; number: number; type: string; text: string; marks: number; answer?: string; solution?: string; topics: string[] }>;
  };
}

export default function ExamResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Results>(`/api/attempts/${params.id}`);
  const [challenge, setChallenge] = useState<EvalItem | null>(null);
  const [challengeMarks, setChallengeMarks] = useState(0);
  const [challengeNote, setChallengeNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedMistakes, setSavedMistakes] = useState<Set<string>>(new Set());

  if (loading) return <Spinner label="Evaluating your paper…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data || !data.evaluation) {
    return (
      <div className="mx-auto max-w-2xl py-xxl">
        <ErrorState message="This attempt is not yet evaluated. Finish the exam to see results." />
        <Link href={`/exam/active/${params.id}`} className="btn-primary mt-md">
          Return to exam
        </Link>
      </div>
    );
  }

  const ev = data.evaluation;
  const scorePct = ev.maxScore ? Math.round((ev.totalScore / ev.maxScore) * 100) : 0;
  const qMap = new Map(data.paper.questions.map((q) => [q.id, q]));

  async function saveMistake(item: EvalItem) {
    const q = qMap.get(item.questionId);
    if (!q) return;
    try {
      await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q.text,
          correctAnswer: item.modelAnswer || q.answer || "",
          reasoning: q.solution || "",
          category: item.kind === "objective" ? "CONCEPT_GAP" : "CONCEPT_GAP",
          nextReviewAt: undefined,
        }),
      });
      setSavedMistakes((s) => new Set(s).add(item.questionId));
      toast("Saved to your mistake notebook.", "success");
    } catch {
      toast("Could not save mistake.", "error");
    }
  }

  async function submitChallenge() {
    if (!challenge) return;
    setSaving(true);
    try {
      await fetch("/api/mistakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: qMap.get(challenge.questionId)?.text || "",
          myAnswer: `Challenged AI mark: requested ${challengeMarks}/${challenge.maxMarks}. Note: ${challengeNote}`,
          correctAnswer: challenge.modelAnswer || "",
          reasoning: challenge.comment,
          category: "SILLY_MISTAKE",
        }),
      });
      toast("Your challenge is logged in the mistake notebook for review.", "success");
      setChallenge(null);
      setChallengeNote("");
    } catch {
      toast("Could not log challenge.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl pb-xxl">
      <p className="label-cap">Examination result {data.autoSubmitted && "· auto-submitted at time-up"}</p>
      <h1 className="mt-xs text-h2 text-ink">{data.paper.title}</h1>
      <div className="mt-sm flex flex-wrap gap-xs">
        <Badge tone="outline">{data.paper.subjectName}</Badge>
        {data.submittedAt && <Badge tone="neutral">{relativeDay(data.submittedAt.slice(0, 10))}</Badge>}
        {ev.isDemo && <Badge tone="neutral">demo evaluation</Badge>}
      </div>

      <Card soft className="mt-lg">
        <div className="flex flex-wrap items-end justify-between gap-md">
          <div>
            <p className="label-cap">Score</p>
            <p className="mt-xs text-display text-ink">{scorePct}%</p>
            <p className="text-body text-muted">
              {ev.totalScore} / {ev.maxScore} marks
            </p>
          </div>
          <div className="flex-1 min-w-48">
            <Progress value={ev.totalScore} max={Math.max(1, ev.maxScore)} />
            <div className="mt-sm grid grid-cols-2 gap-sm">
              <div>
                <p className="label-cap">Objective</p>
                <p className="text-title text-ink">
                  {ev.objectiveScore}/{ev.objectiveMax}
                  {ev.objectiveMax > 0 && <span className="text-body-sm text-muted"> · {pct(ev.objectiveScore, ev.objectiveMax)}%</span>}
                </p>
              </div>
              <div>
                <p className="label-cap">Subjective (AI estimate)</p>
                <p className="text-title text-ink">
                  {ev.subjectiveScore}/{ev.subjectiveMax}
                </p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-md text-body text-ink">{ev.summary}</p>
        <p className="mt-xs text-caption text-faint">
          Objective marks are graded exactly against the answer key. Subjective marks are AI-estimated against the marking scheme — they are not official examiner certification, and you can challenge any mark.
        </p>
      </Card>

      <div className="mt-md grid gap-md md:grid-cols-2">
        <Card>
          <h3 className="flex items-center gap-xs text-title text-ink">
            <TrendingUp size={16} /> Strongest concepts
          </h3>
          {ev.strongest.length ? (
            <ul className="mt-sm flex flex-col gap-xs">
              {ev.strongest.map((s) => (
                <li key={s} className="flex items-center gap-xs text-body-sm text-ink">
                  <CheckCircle2 size={14} /> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-sm text-body-sm text-muted">No concept reached mastery threshold this attempt.</p>
          )}
        </Card>
        <Card>
          <h3 className="flex items-center gap-xs text-title text-ink">
            <XCircle size={16} /> Focus next
          </h3>
          {ev.weakest.length ? (
            <ul className="mt-sm flex flex-col gap-xs">
              {ev.weakest.map((s) => (
                <li key={s} className="flex items-center gap-xs text-body-sm text-ink">
                  <MinusCircle size={14} /> {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-sm text-body-sm text-muted">No weak concepts detected — impressive.</p>
          )}
        </Card>
      </div>

      <h2 className="mt-xl text-h4 text-ink">Question-by-question review</h2>
      <div className="mt-md flex flex-col gap-md">
        {ev.items.map((item) => {
          const q = qMap.get(item.questionId);
          if (!q) return null;
          const full = item.awarded === item.maxMarks;
          return (
            <Card key={item.questionId} className="border-hairline-soft">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="flex items-center gap-xs">
                  <Badge tone="ink">Q{item.number}</Badge>
                  <Badge tone="outline">{q.type.replace("_", " ")}</Badge>
                  {item.kind === "objective" ? (
                    item.correct ? <Badge tone="neutral">Correct</Badge> : <Badge tone="neutral">Incorrect</Badge>
                  ) : (
                    <Badge tone="neutral">AI-evaluated</Badge>
                  )}
                </div>
                <span className={full ? "text-body-sm text-ink" : "text-body-sm text-muted"}>
                  {item.awarded} / {item.maxMarks} marks
                </span>
              </div>
              <p className="mt-sm whitespace-pre-wrap text-body-sm text-ink">{q.text}</p>
              <p className="mt-sm text-body-sm text-muted">{item.comment}</p>
              {(item.modelAnswer || q.answer) && (
                <div className="mt-sm rounded-sm bg-canvas-soft p-sm">
                  <p className="label-cap">Model answer</p>
                  <p className="mt-xs whitespace-pre-wrap text-body-sm text-ink">{item.modelAnswer || q.answer}</p>
                </div>
              )}
              {q.solution && (
                <details className="mt-sm">
                  <summary className="cursor-pointer text-body-sm text-ink underline">Step-by-step solution</summary>
                  <p className="mt-xs whitespace-pre-wrap text-body-sm text-muted">{q.solution}</p>
                </details>
              )}
              {item.scheme && item.scheme.length > 0 && (
                <ul className="mt-sm flex flex-col gap-xxs">
                  {item.scheme.map((s, i) => (
                    <li key={i} className="text-caption text-muted">
                      • {s}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-sm flex flex-wrap gap-xs">
                {!item.correct && !savedMistakes.has(item.questionId) && (
                  <Button variant="soft" className="!min-h-8 !text-caption" onClick={() => saveMistake(item)}>
                    <BookmarkPlus size={12} /> Save to notebook
                  </Button>
                )}
                {!item.correct && (
                  <Button
                    variant="outline"
                    className="!min-h-8 !text-caption"
                    onClick={() => {
                      setChallenge(item);
                      setChallengeMarks(item.awarded);
                    }}
                  >
                    Challenge this mark
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card soft className="mt-xl">
        <h3 className="text-title text-ink">Your plan for the next attempt</h3>
        <ul className="mt-sm flex flex-col gap-xs text-body-sm text-ink">
          {ev.weakest.slice(0, 3).map((w) => (
            <li key={w}>• Revise {w}, then take a 10-question retrieval test on it within 48 hours.</li>
          ))}
          {ev.weakest.length === 0 && <li>• Maintain your revision cadence — nothing major is slipping.</li>}
          <li>• Generate a weak-area test from the AI Exam Studio to re-check these gaps.</li>
          <li>• Spaced revision dates have been added to your Revision Center automatically.</li>
        </ul>
        <div className="mt-md flex flex-wrap gap-xs">
          <Link href="/exam-studio" className="btn-primary">
            <FlaskConical size={16} /> New targeted test
          </Link>
          <Link href="/revision" className="btn-outline">
            <RotateCcw size={16} /> Open revision center
          </Link>
          <Link href="/dashboard" className="btn-soft">
            Dashboard
          </Link>
        </div>
      </Card>

      <Modal open={!!challenge} onClose={() => setChallenge(null)} title="Challenge AI mark">
        {challenge && (
          <>
            <p className="text-body-sm text-muted">Question {challenge.number} was awarded {challenge.awarded}/{challenge.maxMarks} by the evaluator.</p>
            <div className="mt-md flex flex-col gap-md">
              <Field label={`Your claimed marks (0–${challenge.maxMarks})`}>
                <Input type="number" min={0} max={challenge.maxMarks} value={challengeMarks} onChange={(e) => setChallengeMarks(Number(e.target.value))} />
              </Field>
              <Field label="Why do you believe the mark is wrong?">
                <textarea className="input min-h-24 resize-y" value={challengeNote} onChange={(e) => setChallengeNote(e.target.value)} placeholder="e.g. My derivation was correct up to step 4; the scheme allows full marks…" />
              </Field>
            </div>
            <p className="mt-sm text-caption text-faint">Challenges are logged in your Mistake Notebook for later review. AI marks are never treated as official examiner certification.</p>
            <div className="mt-lg flex justify-end gap-xs">
              <Button variant="outline" onClick={() => setChallenge(null)}>
                Cancel
              </Button>
              <Button onClick={submitChallenge} disabled={saving}>
                Submit challenge
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
