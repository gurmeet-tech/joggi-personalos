"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Field, Input, Select, Badge, Spinner, ErrorState, Progress, useToast, Segmented, Modal } from "@/components/ui";
import { minutesToHm, relativeDay, todayISO } from "@/lib/utils";
import { Sparkles, Check, X, Clock, CalendarDays, Plus } from "lucide-react";

interface PlanItem {
  id: string;
  title: string;
  subject?: string;
  chapter?: string;
  type: string;
  minutes: number;
  reason: string;
  completed?: boolean;
  skipped?: boolean;
}
interface Plan {
  id: string;
  date: string;
  items: PlanItem[];
  plannedMinutes: number;
  actualMinutes: number;
}
interface Session {
  id: string;
  date: string;
  type: string;
  plannedMinutes: number;
  actualMinutes: number | null;
  completed: boolean;
  title: string;
  chapter?: { name: string; subject: { name: string } } | null;
}
interface Subject {
  id: string;
  name: string;
  chapters: Array<{ id: string; name: string }>;
}

export default function PlannerPage() {
  const toast = useToast();
  const [view, setView] = useState<"week" | "today">("week");
  const { data, loading, error, reload } = useApi<{ plans: Plan[]; sessions: Session[] }>("/api/planner");
  const { data: subjects } = useApi<Subject[]>("/api/subjects");
  const [generating, setGenerating] = useState(false);
  const [hours, setHours] = useState(4);
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ subjectId: "", chapterId: "", minutes: 60, notes: "" });

  const today = todayISO();
  const planFor = (date: string) => data?.plans.find((p) => p.date === date);

  async function generate() {
    setGenerating(true);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dailyHours: hours, days: 7 }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Planner failed.");
      toast("7-day plan generated and saved.", "success");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setGenerating(false);
    }
  }

  async function itemAction(date: string, itemId: string, action: string, newDate?: string) {
    await fetch("/api/planner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, itemId, action, newDate }),
    }).catch(() => null);
    reload();
  }

  async function logSession() {
    const chapter = subjects?.find((s) => s.id === logForm.subjectId)?.chapters.find((c) => c.id === logForm.chapterId);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: logForm.subjectId || null,
          chapterId: logForm.chapterId || null,
          type: "LEARN",
          plannedMinutes: logForm.minutes,
          actualMinutes: logForm.minutes,
          title: chapter ? chapter.name : "Study session",
          notes: logForm.notes || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not log session.");
      toast("Study session recorded.", "success");
      setShowLog(false);
      setLogForm({ subjectId: "", chapterId: "", minutes: 60, notes: "" });
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  }

  if (loading) return <Spinner label="Loading planner…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const todaySessions = data?.sessions.filter((s) => s.date === today) ?? [];
  const todayActual = todaySessions.reduce((a, s) => a + (s.actualMinutes ?? 0), 0);
  const todayPlanned = planFor(today)?.plannedMinutes ?? 0;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Study planning</p>
          <h1 className="mt-xs text-h2 text-ink">Study planner.</h1>
          <p className="mt-sm text-body text-muted">Plans are built from your syllabus gaps, confidence ratings and recent test scores — not generic advice.</p>
        </div>
        <div className="flex gap-xs">
          <Button variant="outline" onClick={() => setShowLog(true)}>
            <Plus size={16} /> Log session
          </Button>
          <Button onClick={generate} disabled={generating}>
            {generating ? "Generating…" : <><Sparkles size={16} /> Generate plan</>}
          </Button>
        </div>
      </div>

      <div className="grid gap-md md:grid-cols-3">
        <Card soft>
          <p className="label-cap">Today planned</p>
          <p className="mt-xxs text-h3 text-ink">{minutesToHm(todayPlanned)}</p>
        </Card>
        <Card soft>
          <p className="label-cap">Today actual</p>
          <p className="mt-xxs text-h3 text-ink">{minutesToHm(todayActual)}</p>
          <Progress className="mt-xs" value={todayActual} max={Math.max(1, todayPlanned)} />
        </Card>
        <Card soft className="flex flex-col justify-center gap-xs">
          <Field label="Daily hours available">
            <Input type="number" min={0.5} max={18} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
          </Field>
        </Card>
      </div>

      <div className="mt-lg flex items-center justify-between">
        <Segmented options={[{ value: "week", label: "7-day view" }, { value: "today", label: "Today" }]} value={view} onChange={setView} />
      </div>

      {!data?.plans.length && (
        <Card soft className="mt-md">
          <p className="text-body text-ink">No plan yet. Click “Generate plan” — the engine will schedule learning, practice, spaced revision and a weekly mock, then adjust as you complete or miss sessions.</p>
        </Card>
      )}

      <div className="mt-md flex flex-col gap-md">
        {(view === "today" ? (data?.plans ?? []).filter((p) => p.date === today) : data?.plans ?? []).map((plan) => {
          const done = plan.items.filter((i) => i.completed).length;
          return (
            <Card key={plan.id}>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="flex items-center gap-xs">
                  <CalendarDays size={16} className="text-muted" />
                  <span className="text-title text-ink">{relativeDay(plan.date)}</span>
                  <Badge tone="outline">{plan.date}</Badge>
                </div>
                <span className="text-caption text-muted">
                  {done}/{plan.items.length} done · {minutesToHm(plan.plannedMinutes)}
                </span>
              </div>
              <div className="mt-sm flex flex-col gap-xs">
                {plan.items.map((item) => (
                  <div key={item.id} className={`flex flex-wrap items-center gap-sm rounded-sm px-sm py-xs ${item.completed ? "bg-canvas-soft opacity-60" : item.skipped ? "bg-canvas-soft opacity-50" : "bg-canvas-soft"}`}>
                    <Badge tone={item.type === "MOCK" ? "ink" : "neutral"}>{item.type}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className={`text-body-sm ${item.completed ? "line-through" : ""} text-ink`}>{item.title}</p>
                      <p className="text-caption text-muted">{item.reason}</p>
                    </div>
                    <span className="flex items-center gap-xs text-caption text-muted">
                      <Clock size={12} /> {item.minutes}m
                    </span>
                    {!item.completed && !item.skipped && (
                      <div className="flex gap-xs">
                        <button onClick={() => itemAction(plan.date, item.id, "complete")} className="rounded-full bg-ink p-xs text-on-primary" aria-label="Complete">
                          <Check size={12} />
                        </button>
                        <button onClick={() => itemAction(plan.date, item.id, "skip")} className="rounded-full bg-canvas p-xs text-muted border border-hairline-soft" aria-label="Skip">
                          <X size={12} />
                        </button>
                        <button onClick={() => itemAction(plan.date, item.id, "reschedule", relativeNext(plan.date))} className="rounded-full bg-canvas p-xs text-muted border border-hairline-soft text-caption" aria-label="Reschedule to tomorrow">
                          →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {todaySessions.length > 0 && (
        <Card className="mt-lg">
          <h3 className="text-title text-ink">Logged sessions today</h3>
          <ul className="mt-sm flex flex-col gap-xs">
            {todaySessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between text-body-sm">
                <span className="text-ink">{s.title}{s.chapter ? ` · ${s.chapter.subject.name}` : ""}</span>
                <span className="text-muted">{s.actualMinutes ?? 0}m</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={showLog} onClose={() => setShowLog(false)} title="Log a study session">
        <div className="flex flex-col gap-md">
          <Field label="Subject">
            <Select value={logForm.subjectId} onChange={(e) => setLogForm({ ...logForm, subjectId: e.target.value, chapterId: "" })}>
              <option value="">None</option>
              {subjects?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Chapter">
            <Select value={logForm.chapterId} onChange={(e) => setLogForm({ ...logForm, chapterId: e.target.value })} disabled={!logForm.subjectId}>
              <option value="">None</option>
              {subjects?.find((s) => s.id === logForm.subjectId)?.chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Minutes studied">
            <Input type="number" min={1} max={600} value={logForm.minutes} onChange={(e) => setLogForm({ ...logForm, minutes: Number(e.target.value) })} />
          </Field>
          <Field label="Notes (optional)">
            <textarea className="input min-h-20 resize-y" value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowLog(false)}>
              Cancel
            </Button>
            <Button onClick={logSession}>Save session</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function relativeNext(date: string): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}
