"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Field, Input, Modal, useToast, EmptyState, Segmented, Select } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/utils";
import { Plus, Trash2, CheckCircle2, RefreshCw } from "lucide-react";

interface Mistake {
  id: string;
  question: string;
  myAnswer: string;
  correctAnswer: string;
  reasoning: string;
  category: string;
  nextReviewAt: string;
  reviewCount: number;
  mastered: boolean;
  chapter?: { name: string } | null;
}

const CATEGORIES = ["CONCEPT_GAP", "SILLY_MISTAKE", "TIME_PRESSURE", "NOT_STUDIED", "FORGOTTEN", "CALCULATION"];
const CAT_LABEL: Record<string, string> = {
  CONCEPT_GAP: "Concept gap",
  SILLY_MISTAKE: "Silly mistake",
  TIME_PRESSURE: "Time pressure",
  NOT_STUDIED: "Not studied",
  FORGOTTEN: "Forgotten",
  CALCULATION: "Calculation",
};

export default function MistakesPage() {
  const toast = useToast();
  const [filter, setFilter] = useState<"all" | "due" | "mastered">("due");
  const { data, loading, error, reload } = useApi<Mistake[]>(`/api/mistakes${filter === "due" ? "?due=1" : filter === "mastered" ? "?mastered=true" : ""}`);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ question: "", myAnswer: "", correctAnswer: "", reasoning: "", category: "CONCEPT_GAP" });

  async function addMistake() {
    if (form.question.trim().length < 3) return;
    await fetch("/api/mistakes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    toast("Mistake logged.", "success");
    setShowAdd(false);
    setForm({ question: "", myAnswer: "", correctAnswer: "", reasoning: "", category: "CONCEPT_GAP" });
    reload();
  }

  async function review(id: string) {
    await fetch("/api/mistakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, review: true }),
    }).catch(() => null);
    toast("Reviewed — next review scheduled later.", "success");
    reload();
  }

  async function markMastered(id: string) {
    await fetch("/api/mistakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, mastered: true }),
    }).catch(() => null);
    reload();
  }

  async function remove(id: string) {
    await fetch("/api/mistakes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delete: true }),
    }).catch(() => null);
    reload();
  }

  if (loading) return <Spinner label="Loading notebook…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const today = todayISO();
  const byCategory = CATEGORIES.map((c) => ({ c, n: (data ?? []).filter((m) => m.category === c).length })).filter((x) => x.n);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Error analysis</p>
          <h1 className="mt-xs text-h2 text-ink">Mistake notebook.</h1>
          <p className="mt-sm text-body text-muted">Every wrong answer you log, with the correct reasoning and a spaced revision date.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> Add mistake
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-sm">
        <Segmented options={[{ value: "due", label: "Due" }, { value: "all", label: "All" }, { value: "mastered", label: "Mastered" }]} value={filter} onChange={setFilter} />
        {byCategory.length > 0 && (
          <div className="flex flex-wrap gap-xs">
            {byCategory.map((x) => (
              <Badge key={x.c} tone="neutral">
                {CAT_LABEL[x.c]} {x.n}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {!data?.length && (
        <EmptyState
          title={filter === "due" ? "Nothing due for review" : "No mistakes logged"}
          description="Log a mistake whenever you get something wrong — it gets scheduled for spaced review automatically."
          action={<Button onClick={() => setShowAdd(true)}>Add a mistake</Button>}
        />
      )}

      <div className="mt-xl flex flex-col gap-md">
        {data?.map((m) => (
          <Card key={m.id}>
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="flex flex-wrap items-center gap-xs">
                <Badge tone="outline">{CAT_LABEL[m.category] ?? m.category}</Badge>
                {m.chapter && <Badge tone="neutral">{m.chapter.name}</Badge>}
                <span className="text-caption text-muted">
                  {m.mastered ? "Mastered" : `Review ${formatDate(m.nextReviewAt)}`} · {m.reviewCount} review(s)
                </span>
              </div>
              <div className="flex gap-xs">
                {!m.mastered && (
                  <>
                    <Button variant="soft" className="!min-h-8 !text-caption" onClick={() => review(m.id)}>
                      <RefreshCw size={12} /> Reviewed
                    </Button>
                    <Button variant="outline" className="!min-h-8 !text-caption" onClick={() => markMastered(m.id)}>
                      <CheckCircle2 size={12} /> Mastered
                    </Button>
                  </>
                )}
                <button onClick={() => remove(m.id)} aria-label="Delete" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
            <p className="mt-sm whitespace-pre-wrap text-body-sm text-ink">{m.question}</p>
            {m.myAnswer && (
              <p className="mt-sm text-body-sm text-muted">
                <span className="text-ink">Your answer:</span> {m.myAnswer}
              </p>
            )}
            {m.correctAnswer && (
              <div className="mt-sm rounded-sm bg-canvas-soft p-sm">
                <p className="label-cap">Correct answer / reasoning</p>
                <p className="mt-xs whitespace-pre-wrap text-body-sm text-ink">{m.correctAnswer}</p>
                {m.reasoning && <p className="mt-xs whitespace-pre-wrap text-body-sm text-muted">{m.reasoning}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Log a mistake">
        <div className="flex flex-col gap-md">
          <Field label="Question">
            <textarea className="input min-h-20 resize-y" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
          </Field>
          <Field label="What I answered">
            <textarea className="input min-h-16 resize-y" value={form.myAnswer} onChange={(e) => setForm({ ...form, myAnswer: e.target.value })} />
          </Field>
          <Field label="Correct answer / reasoning">
            <textarea className="input min-h-20 resize-y" value={form.correctAnswer} onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })} />
          </Field>
          <Field label="Mistake category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CAT_LABEL[c]}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addMistake}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
