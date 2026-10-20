"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Field, Input, Modal, useToast, EmptyState, Stat } from "@/components/ui";
import { RotateCcw, Plus, NotebookPen } from "lucide-react";

interface Card_ {
  id: string;
  front: string;
  back: string;
  source: string;
  nextReviewAt: string;
  reviews: number;
  ease: number;
}
interface RevisionData {
  cards: Card_[];
  chapters: Array<{ id: string; name: string; status: string; subject: { name: string } }>;
  mistakesDue: number;
}

export default function RevisionPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<RevisionData>("/api/revisions");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ front: "", back: "" });

  async function rate(rating: "AGAIN" | "HARD" | "GOOD" | "EASY") {
    const card = data?.cards[index];
    if (!card) return;
    await fetch("/api/revisions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: card.id, rating }),
    }).catch(() => null);
    setFlipped(false);
    setIndex((i) => i + 1);
    if (index + 1 >= (data?.cards.length ?? 0)) reload();
  }

  async function addCard() {
    if (!form.front.trim() || !form.back.trim()) return;
    await fetch("/api/revisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front: form.front, back: form.back, source: "MANUAL" }),
    }).catch(() => null);
    toast("Revision card added.", "success");
    setShowAdd(false);
    setForm({ front: "", back: "" });
    reload();
  }

  if (loading) return <Spinner label="Loading revision center…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const cards = data?.cards ?? [];
  const active = cards[index];

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Spaced repetition</p>
          <h1 className="mt-xs text-h2 text-ink">Revision center.</h1>
          <p className="mt-sm text-body text-muted">Automatically surfaces what you are about to forget — flagged chapters, past mistakes, and cards you have created.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> New card
        </Button>
      </div>

      <div className="grid gap-md md:grid-cols-4">
        <Stat label="Cards due" value={cards.length} />
        <Stat label="Chapters flagged" value={data?.chapters.length ?? 0} />
        <Stat label="Mistakes due" value={data?.mistakesDue ?? 0} />
        <Stat label="Active card" value={cards.length ? `${Math.min(index + 1, cards.length)}/${cards.length}` : "—"} />
      </div>

      {active ? (
        <Card className="mt-lg">
          <div className="flex items-center justify-between">
            <Badge tone="outline">{active.source === "AUTO" ? "Auto-generated" : "Manual"}</Badge>
            <span className="text-caption text-muted">{active.reviews} reviews · ease {active.ease.toFixed(2)}</span>
          </div>
          <button className="mt-lg block w-full text-left" onClick={() => setFlipped((f) => !f)} aria-label="Reveal answer">
            <p className="text-h4 text-ink">{active.front}</p>
            {flipped ? (
              <p className="mt-lg whitespace-pre-wrap rounded-sm bg-canvas-soft p-md text-body text-ink">{active.back}</p>
            ) : (
              <p className="mt-lg text-body-sm text-muted">Tap to reveal the answer</p>
            )}
          </button>
          {flipped && (
            <div className="mt-lg grid grid-cols-4 gap-xs">
              {(["AGAIN", "HARD", "GOOD", "EASY"] as const).map((r) => (
                <Button key={r} variant={r === "GOOD" ? "primary" : "outline"} onClick={() => rate(r)}>
                  {r}
                </Button>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <EmptyState
          title="No cards due right now"
          description="Cards appear here on their scheduled review day. Flagged chapters and due mistakes are listed below."
          action={<Button onClick={() => setShowAdd(true)}>Create a card</Button>}
        />
      )}

      <div className="mt-lg grid gap-md md:grid-cols-2">
        <Card>
          <h3 className="flex items-center gap-xs text-title text-ink">
            <RotateCcw size={16} /> Chapters needing revision
          </h3>
          {!data?.chapters.length ? (
            <p className="mt-sm text-body-sm text-muted">No chapters flagged. Take tests to let the engine set revision dates automatically.</p>
          ) : (
            <ul className="mt-sm flex flex-col gap-xs">
              {data.chapters.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-body-sm">
                  <span className="text-ink">{c.name}</span>
                  <Badge tone="neutral">{c.subject.name}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h3 className="flex items-center gap-xs text-title text-ink">
            <NotebookPen size={16} /> Mistakes due
          </h3>
          <p className="mt-sm text-body-sm text-muted">
            {data?.mistakesDue ? `${data.mistakesDue} mistake(s) are due for review.` : "No mistakes are due."}
          </p>
          <Link href="/mistakes?due=1" className="btn-soft mt-sm w-full">
            Review mistakes
          </Link>
        </Card>
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New revision card">
        <div className="flex flex-col gap-md">
          <Field label="Front (prompt)">
            <Input value={form.front} onChange={(e) => setForm({ ...form, front: e.target.value })} placeholder="e.g. State Raoult's law" />
          </Field>
          <Field label="Back (answer)">
            <textarea className="input min-h-32 resize-y" value={form.back} onChange={(e) => setForm({ ...form, back: e.target.value })} placeholder="Your answer / mnemonic" />
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addCard}>Add card</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
