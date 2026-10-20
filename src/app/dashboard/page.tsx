"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApi, Card, Progress, Badge, Button, Spinner, ErrorState, Checkbox, Segmented, useToast } from "@/components/ui";
import { minutesToHm, relativeDay, pct } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Mic, RotateCcw, Briefcase, Target, FlaskConical, ArrowRight } from "lucide-react";

interface Dash {
  profile: { name: string } | null;
  date: string;
  todaysObjective: string;
  recommendation: string;
  planItems: Array<{ id: string; title: string; type: string; minutes: number; completed?: boolean; skipped?: boolean; subject?: string }>;
  plannedMinutes: number;
  actualMinutes: number;
  pendingTasks: Array<{ id: string; title: string; priority: string; category: string }>;
  completedTasks: Array<{ id: string; title: string }>;
  overdueTasks: Array<{ id: string; title: string; dueAt: string; priority: string }>;
  subjectProgress: Array<{ id: string; name: string; total: number; mastered: number; avgScore: number | null }>;
  overall: { chapters: number; mastered: number; completion: number };
  recentScores: Array<{ title: string; subject: string; score: number; max: number; pct: number; date: string }>;
  weakChapters: Array<{ id: string; name: string; subject: string; confidence: number; lastTestScore: number | null }>;
  revisionDue: Array<{ id: string; title: string; kind: string }>;
  englishStreak: number;
  englishMinutesToday: number;
  leadsDue: Array<{ id: string; name: string; status: string }>;
  habits: Array<{ id: string; name: string; doneToday: boolean; weekDone: number; targetPerWeek: number }>;
  upcoming: Array<{ kind: string; title: string; date: string }>;
}

const WIDGET_ORDER = ["objective", "plan", "tasks", "study", "subjects", "scores", "revision", "english", "freelance", "habits", "upcoming"] as const;
type WidgetId = (typeof WIDGET_ORDER)[number];
const WIDGET_LABELS: Record<WidgetId, string> = {
  objective: "Today's objective",
  plan: "Study schedule",
  tasks: "Tasks",
  study: "Study hours",
  subjects: "Subject progress",
  scores: "Recent scores",
  revision: "Revision due",
  english: "English streak",
  freelance: "Freelance follow-ups",
  habits: "Habits",
  upcoming: "Upcoming",
};

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi<Dash>("/api/dashboard");
  const [order, setOrder] = useState<WidgetId[]>([...WIDGET_ORDER]);
  const [customize, setCustomize] = useState(false);
  const [hidden, setHidden] = useState<WidgetId[]>([]);
  const toast = useToast();

  async function toggleTask(id: string, done: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: done ? "DONE" : "TODO" }),
    }).catch(() => null);
    reload();
  }

  async function toggleHabit(id: string, done: boolean) {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId: id, date: data?.date, done }),
    }).catch(() => null);
    reload();
  }

  async function planItemDone(id: string) {
    await fetch("/api/planner", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: data?.date, itemId: id, action: "complete" }),
    }).catch(() => null);
    toast("Session marked complete.", "success");
    reload();
  }

  if (loading) return <Spinner label="Loading your command center…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const widgets: Record<WidgetId, React.ReactNode> = {
    objective: (
      <Card soft className="lg:col-span-2">
        <p className="label-cap">What matters most today</p>
        <h2 className="mt-xs text-h3 text-ink">{data.todaysObjective}</h2>
        <div className="mt-md rounded-sm bg-canvas p-md">
          <p className="label-cap">AI recommendation · grounded in your data</p>
          <p className="mt-xs text-body text-ink">{data.recommendation}</p>
        </div>
      </Card>
    ),
    plan: (
      <Card className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Today&apos;s schedule</h3>
          <Link href="/planner" className="text-body-sm text-muted underline hover:text-ink">
            Planner
          </Link>
        </div>
        {data.planItems.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No plan for today. Generate one in the study planner — it prioritises your weakest chapters.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.planItems.map((item) => (
              <li key={item.id} className={`flex items-center gap-sm rounded-sm px-sm py-xs ${item.completed ? "bg-canvas-soft opacity-60" : ""}`}>
                <button onClick={() => !item.completed && planItemDone(item.id)} aria-label="Mark complete" className="text-ink">
                  {item.completed ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-faint" />}
                </button>
                <span className={`flex-1 text-body-sm ${item.completed ? "line-through" : ""}`}>{item.title}</span>
                <Badge tone="outline">{item.type}</Badge>
                <span className="text-caption text-muted">{item.minutes}m</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
    tasks: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Tasks</h3>
          <Link href="/tasks" className="text-body-sm text-muted underline hover:text-ink">
            All
          </Link>
        </div>
        {data.overdueTasks.length > 0 && (
          <p className="mt-xs text-caption text-ink">{data.overdueTasks.length} overdue</p>
        )}
        <ul className="mt-sm flex flex-col gap-xs">
          {[...data.pendingTasks, ...data.completedTasks.map((t) => ({ ...t, priority: "DONE", category: "DONE", status: "DONE" }))].slice(0, 7).map((t) => (
            <li key={t.id}>
              <label className="flex cursor-pointer items-start gap-xs text-body-sm">
                <Checkbox label="" checked={t.priority === "DONE"} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                <span className={t.priority === "DONE" ? "text-muted line-through" : "text-ink"}>{t.title}</span>
              </label>
            </li>
          ))}
        </ul>
        {data.pendingTasks.length === 0 && data.completedTasks.length === 0 && <p className="mt-sm text-body-sm text-muted">Nothing here yet — capture a task with quick add.</p>}
      </Card>
    ),
    study: (
      <Card>
        <h3 className="text-title text-ink">Study hours</h3>
        <div className="mt-sm">
          <div className="flex items-end justify-between">
            <span className="text-h3 text-ink">{minutesToHm(data.actualMinutes)}</span>
            <span className="text-body-sm text-muted">planned {minutesToHm(data.plannedMinutes)}</span>
          </div>
          <Progress className="mt-sm" value={data.actualMinutes} max={Math.max(1, data.plannedMinutes)} />
          <p className="mt-xs text-caption text-muted">{pct(data.actualMinutes, Math.max(1, data.plannedMinutes))}% of today&apos;s plan completed. Log sessions in the planner to track this.</p>
        </div>
      </Card>
    ),
    subjects: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Subjects</h3>
          <span className="text-caption text-muted">{data.overall.completion}% mastered</span>
        </div>
        <ul className="mt-sm flex flex-col gap-sm">
          {data.subjectProgress.map((s) => (
            <li key={s.id}>
              <div className="flex items-center justify-between text-body-sm">
                <span className="text-ink">{s.name}</span>
                <span className="text-muted">
                  {s.mastered}/{s.total} mastered{s.avgScore != null ? ` · ${s.avgScore}%` : ""}
                </span>
              </div>
              <Progress className="mt-xxs" value={s.mastered} max={Math.max(1, s.total)} />
            </li>
          ))}
        </ul>
        {data.subjectProgress.length === 0 && <p className="mt-sm text-body-sm text-muted">Add subjects in settings or syllabus.</p>}
      </Card>
    ),
    scores: (
      <Card>
        <h3 className="text-title text-ink">Recent scores</h3>
        {data.recentScores.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No attempts yet. Generate your first paper in the AI Exam Studio.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.recentScores.map((s, i) => (
              <li key={i} className="rounded-sm bg-canvas-soft px-sm py-xs">
                <div className="flex items-center justify-between">
                  <span className="truncate text-body-sm text-ink">{s.title}</span>
                  <span className="text-body-sm text-ink">{s.pct}%</span>
                </div>
                <p className="text-caption text-muted">
                  {s.score}/{s.max} · {relativeDay(s.date.slice(0, 10))}
                </p>
              </li>
            ))}
          </ul>
        )}
        {data.weakChapters.length > 0 && (
          <>
            <p className="label-cap mt-md">Weak chapters</p>
            <ul className="mt-xs flex flex-wrap gap-xs">
              {data.weakChapters.map((c) => (
                <li key={c.id}>
                  <Badge tone="outline">
                    {c.name} · {c.confidence}/5
                  </Badge>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    ),
    revision: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Revision due</h3>
          <RotateCcw size={16} className="text-muted" />
        </div>
        {data.revisionDue.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">Nothing due. Revision items appear as chapters age or mistakes accumulate.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.revisionDue.map((r) => (
              <li key={r.id} className="flex items-center gap-xs text-body-sm text-ink">
                <span className="text-faint">•</span> {r.title}
              </li>
            ))}
          </ul>
        )}
        <Link href="/revision" className="btn-soft mt-sm w-full">
          Open revision center
        </Link>
      </Card>
    ),
    english: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">English practice</h3>
          <Mic size={16} className="text-muted" />
        </div>
        <p className="mt-sm text-h3 text-ink">{data.englishStreak} day streak</p>
        <p className="text-body-sm text-muted">{data.englishMinutesToday} minutes spoken today</p>
        <Link href="/english" className="btn-primary mt-sm w-full">
          Practice now <ArrowRight size={14} />
        </Link>
      </Card>
    ),
    freelance: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Freelance</h3>
          <Briefcase size={16} className="text-muted" />
        </div>
        {data.leadsDue.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No follow-ups due. Deals need consistent contact — log leads in the CRM.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.leadsDue.map((l) => (
              <li key={l.id} className="flex items-center justify-between text-body-sm">
                <span className="text-ink">{l.name}</span>
                <Badge tone="outline">{l.status}</Badge>
              </li>
            ))}
          </ul>
        )}
        <Link href="/freelance" className="btn-soft mt-sm w-full">
          Open CRM
        </Link>
      </Card>
    ),
    habits: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Habits</h3>
          <Target size={16} className="text-muted" />
        </div>
        {data.habits.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No habits tracked yet.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.habits.map((h) => (
              <li key={h.id} className="flex items-center gap-sm">
                <Checkbox label="" checked={h.doneToday} onChange={(e) => toggleHabit(h.id, e.target.checked)} />
                <span className="flex-1 text-body-sm text-ink">{h.name}</span>
                <span className="text-caption text-muted">
                  {h.weekDone}/{h.targetPerWeek} wk
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
    upcoming: (
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-title text-ink">Upcoming</h3>
          <Clock size={16} className="text-muted" />
        </div>
        {data.upcoming.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">Nothing scheduled ahead yet.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.upcoming.map((u, i) => (
              <li key={i} className="flex items-center justify-between text-body-sm">
                <span className="truncate text-ink">{u.title}</span>
                <span className="text-caption text-muted">
                  {u.kind} · {relativeDay(u.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    ),
  };

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">{new Date(data.date + "T12:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          <h1 className="mt-xs text-h2 text-ink">Dashboard.</h1>
        </div>
        <div className="flex gap-xs">
          <Link href="/exam-studio" className="btn-primary">
            <FlaskConical size={16} /> New test
          </Link>
          <Button variant="outline" onClick={() => setCustomize(!customize)}>
            Customize
          </Button>
        </div>
      </div>

      {customize && (
        <Card soft className="mb-lg">
          <p className="label-cap">Show / hide widgets</p>
          <div className="mt-sm flex flex-wrap gap-xs">
            {WIDGET_ORDER.map((w) => (
              <button
                key={w}
                onClick={() => setHidden((h) => (h.includes(w) ? h.filter((x) => x !== w) : [...h, w]))}
                className={`rounded-full px-sm py-xs text-body-sm transition-colors ${hidden.includes(w) ? "bg-field text-faint" : "bg-ink text-on-primary"}`}
              >
                {WIDGET_LABELS[w]}
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-3">
        {order.filter((w) => !hidden.includes(w)).map((w) => (
          <div key={w}>{widgets[w]}</div>
        ))}
      </div>
    </div>
  );
}
