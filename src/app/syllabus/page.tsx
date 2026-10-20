"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Field, Input, Select, Badge, Spinner, ErrorState, Progress, Modal, useToast, EmptyState } from "@/components/ui";
import { CURRICULUM, SUBJECT_NAMES } from "@/lib/curriculum";
import { formatDate, parseJSON } from "@/lib/utils";
import { Plus, Trash2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";

type Topic = { id: string; name: string; mastered: boolean };
type Chapter = {
  id: string;
  name: string;
  status: string;
  confidence: number;
  completion: number;
  lastStudiedAt: string | null;
  lastTestScore: number | null;
  attempts: number;
  weakConcepts: string;
  nextRevisionAt: string | null;
  topics: Topic[];
};
type Subject = { id: string; name: string; chapters: Chapter[] };

const STATUSES = ["NOT_STARTED", "IN_PROGRESS", "STUDIED", "REVISION_REQUIRED", "TEST_PENDING", "MASTERED"] as const;
const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "Learning",
  STUDIED: "Studied once",
  REVISION_REQUIRED: "Revision required",
  TEST_PENDING: "Test pending",
  MASTERED: "Mastered",
};

export default function SyllabusPage() {
  const toast = useToast();
  const { data: subjects, loading, error, reload } = useApi<Subject[]>("/api/subjects");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newSubjectPreset, setNewSubjectPreset] = useState("");
  const [addChapterFor, setAddChapterFor] = useState<string | null>(null);
  const [newChapter, setNewChapter] = useState("");

  async function addSubject() {
    if (!newSubject.trim()) return;
    const preset = newSubjectPreset ? CURRICULUM[newSubjectPreset] : null;
    try {
      await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubject.trim(),
          chapters: preset ? preset.chapters.map((c) => c.name) : [],
        }),
      });
      toast("Subject added.", "success");
      setShowAddSubject(false);
      setNewSubject("");
      setNewSubjectPreset("");
      reload();
    } catch {
      toast("Could not add subject.", "error");
    }
  }

  async function addChapter(subjectId: string) {
    if (!newChapter.trim()) return;
    try {
      await fetch("/api/chapters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, name: newChapter.trim() }),
      });
      setNewChapter("");
      setAddChapterFor(null);
      reload();
    } catch {
      toast("Could not add chapter.", "error");
    }
  }

  async function updateChapter(id: string, patch: Record<string, unknown>) {
    await fetch(`/api/chapters/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).catch(() => null);
    reload();
  }

  async function deleteChapter(id: string) {
    await fetch(`/api/chapters/${id}`, { method: "DELETE" }).catch(() => null);
    reload();
  }

  async function deleteSubject(id: string) {
    await fetch(`/api/subjects/${id}`, { method: "DELETE" }).catch(() => null);
    toast("Subject removed.", "info");
    reload();
  }

  if (loading) return <Spinner label="Loading syllabus…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const totalChapters = subjects?.reduce((s, x) => s + x.chapters.length, 0) ?? 0;
  const mastered = subjects?.reduce((s, x) => s + x.chapters.filter((c) => c.status === "MASTERED").length, 0) ?? 0;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Class 12 syllabus</p>
          <h1 className="mt-xs text-h2 text-ink">Subjects & syllabus.</h1>
          <p className="mt-sm text-body text-muted">
            {mastered} of {totalChapters} chapters mastered across {subjects?.length ?? 0} subjects.
          </p>
        </div>
        <Button onClick={() => setShowAddSubject(true)}>
          <Plus size={16} /> Add subject
        </Button>
      </div>

      {!subjects?.length && (
        <EmptyState
          title="No subjects yet"
          description="Add your Class 12 subjects to unlock the exam generator, planner and analytics."
          action={<Button onClick={() => setShowAddSubject(true)}>Add your first subject</Button>}
        />
      )}

      <div className="flex flex-col gap-md">
        {subjects?.map((s) => {
          const masteredCount = s.chapters.filter((c) => c.status === "MASTERED").length;
          const isOpen = expanded.has(s.id);
          return (
            <Card key={s.id}>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <button className="flex flex-1 items-center gap-sm text-left" onClick={() => setExpanded((e) => (isOpen ? new Set(Array.from(e).filter((x) => x !== s.id)) : new Set([...Array.from(e), s.id])))}>
                  {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="text-h4 text-ink">{s.name}</span>
                  <Badge tone="neutral">
                    {masteredCount}/{s.chapters.length} mastered
                  </Badge>
                </button>
                <div className="flex items-center gap-xs">
                  <Button variant="soft" className="!min-h-8 !text-caption" onClick={() => setAddChapterFor(s.id)}>
                    <Plus size={12} /> Chapter
                  </Button>
                  <button onClick={() => deleteSubject(s.id)} aria-label="Delete subject" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <Progress className="mt-sm" value={masteredCount} max={Math.max(1, s.chapters.length)} />

              {addChapterFor === s.id && (
                <div className="mt-sm flex gap-xs">
                  <Input placeholder="Chapter name" value={newChapter} onChange={(e) => setNewChapter(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addChapter(s.id)} />
                  <Button onClick={() => addChapter(s.id)}>Add</Button>
                  <Button variant="outline" onClick={() => setAddChapterFor(null)}>
                    Cancel
                  </Button>
                </div>
              )}

              {isOpen && (
                <div className="mt-md flex flex-col gap-xs">
                  {s.chapters.length === 0 && <p className="text-body-sm text-muted">No chapters. Add one above or add the subject with a preset chapter list.</p>}
                  {s.chapters.map((c) => {
                    const weak = parseJSON<string[]>(c.weakConcepts, []);
                    return (
                      <div key={c.id} className="rounded-sm bg-canvas-soft p-sm">
                        <div className="flex flex-wrap items-center justify-between gap-sm">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-body-sm text-ink">{c.name}</p>
                            <p className="mt-xxs text-caption text-muted">
                              {c.attempts} attempt(s)
                              {c.lastTestScore != null && ` · last ${Math.round(c.lastTestScore)}%`}
                              {c.lastStudiedAt && ` · studied ${formatDate(c.lastStudiedAt)}`}
                              {c.nextRevisionAt && ` · revise ${formatDate(c.nextRevisionAt)}`}
                            </p>
                            {c.topics.length > 0 && (
                              <div className="mt-xs flex flex-wrap gap-xs">
                                {c.topics.map((t) => (
                                  <button
                                    key={t.id}
                                    onClick={() => updateChapter(c.id, { topics: c.topics.map((x) => ({ name: x.name, mastered: x.id === t.id ? !x.mastered : x.mastered })) })}
                                    className={`rounded-full px-xs py-xxs text-caption ${t.mastered ? "bg-ink text-on-primary" : "bg-canvas text-muted border border-hairline-soft"}`}
                                    title="Toggle topic mastery"
                                  >
                                    {t.name}
                                  </button>
                                ))}
                              </div>
                            )}
                            {weak.length > 0 && (
                              <p className="mt-xs text-caption text-ink">Weak: {weak.slice(0, 4).join(", ")}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-xs">
                            <Select
                              value={c.status}
                              onChange={(e) => updateChapter(c.id, { status: e.target.value })}
                              className="!w-auto !py-xxs !text-caption"
                            >
                              {STATUSES.map((st) => (
                                <option key={st} value={st}>
                                  {STATUS_LABEL[st]}
                                </option>
                              ))}
                            </Select>
                            <Select
                              value={c.confidence}
                              onChange={(e) => updateChapter(c.id, { confidence: Number(e.target.value) })}
                              className="!w-auto !py-xxs !text-caption"
                              title="Confidence 1–5"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>
                                  {n}/5
                                </option>
                              ))}
                            </Select>
                            <button onClick={() => deleteChapter(c.id)} aria-label="Delete chapter" className="rounded-full p-xs text-muted hover:bg-canvas hover:text-ink">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={showAddSubject} onClose={() => setShowAddSubject(false)} title="Add a subject">
        <div className="flex flex-col gap-md">
          <Field label="Subject name">
            <Input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g. Physics" autoFocus />
          </Field>
          <Field label="Load standard CBSE chapters" hint="Optional — pre-fills the chapter list for a known subject.">
            <Select value={newSubjectPreset} onChange={(e) => { setNewSubjectPreset(e.target.value); if (e.target.value) setNewSubject(e.target.value); }}>
              <option value="">None</option>
              {SUBJECT_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n} ({CURRICULUM[n].chapters.length} chapters)
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowAddSubject(false)}>
              Cancel
            </Button>
            <Button onClick={addSubject}>
              <BookOpen size={16} /> Add subject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
