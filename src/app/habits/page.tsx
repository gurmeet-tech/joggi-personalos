"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Field, Input, Select, Modal, useToast, EmptyState, Progress } from "@/components/ui";
import { dateOffsetISO, todayISO } from "@/lib/utils";
import { Plus, Trash2, Check } from "lucide-react";

interface HabitLog {
  id: string;
  date: string;
  done: boolean;
}
interface Habit {
  id: string;
  name: string;
  category: string;
  targetPerWeek: number;
  logs: HabitLog[];
}

const CATEGORIES = ["ACADEMICS", "ENGLISH", "FREELANCE", "PERSONAL", "HEALTH", "ADMIN", "OTHER"];

export default function HabitsPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Habit[]>("/api/habits");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", category: "HEALTH", targetPerWeek: 7 });

  const today = todayISO();
  const last14 = Array.from({ length: 14 }, (_, i) => dateOffsetISO(-13 + i));

  async function addHabit() {
    if (!form.name.trim()) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).catch(() => null);
    toast("Habit created.", "success");
    setShowAdd(false);
    setForm({ name: "", category: "HEALTH", targetPerWeek: 7 });
    reload();
  }

  async function toggle(habitId: string, date: string, done: boolean) {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, date, done }),
    }).catch(() => null);
    reload();
  }

  async function remove(habitId: string) {
    await fetch("/api/habits", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habitId, delete: true }),
    }).catch(() => null);
    reload();
  }

  function currentStreak(h: Habit): number {
    const set = new Set(h.logs.filter((l) => l.done).map((l) => l.date));
    let streak = 0;
    let cursor = new Date(today + "T00:00:00");
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (set.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (streak === 0 && key === today) {
        cursor.setDate(cursor.getDate() - 1);
      } else break;
      if (streak > 400) break;
    }
    return streak;
  }

  if (loading) return <Spinner label="Loading habits…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Consistency</p>
          <h1 className="mt-xs text-h2 text-ink">Habits.</h1>
          <p className="mt-sm text-body text-muted">Small daily reps compound. Tap any day to mark it done.</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={16} /> New habit
        </Button>
      </div>

      {!data?.length && (
        <EmptyState title="No habits yet" description="Start with one keystone habit — sleep, revision or a daily English drill." action={<Button onClick={() => setShowAdd(true)}>Add habit</Button>} />
      )}

      <div className="flex flex-col gap-md">
        {data?.map((h) => {
          const weekDone = h.logs.filter((l) => l.done && l.date >= dateOffsetISO(-6)).length;
          const streak = currentStreak(h);
          const doneToday = h.logs.some((l) => l.date === today && l.done);
          return (
            <Card key={h.id}>
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <div className="flex items-center gap-sm">
                  <button
                    onClick={() => toggle(h.id, today, !doneToday)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${doneToday ? "border-ink bg-ink text-on-primary" : "border-hairline text-muted"}`}
                    aria-label="Toggle today"
                  >
                    <Check size={16} />
                  </button>
                  <div>
                    <p className="text-title text-ink">{h.name}</p>
                    <p className="text-caption text-muted">
                      {CATEGORIES.includes(h.category) ? h.category : "PERSONAL"} · {streak} day streak · {weekDone}/{h.targetPerWeek} this week
                    </p>
                  </div>
                </div>
                <button onClick={() => remove(h.id)} aria-label="Delete" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                  <Trash2 size={14} />
                </button>
              </div>
              <Progress className="mt-sm" value={weekDone} max={h.targetPerWeek} />
              <div className="mt-sm flex flex-wrap gap-xxs">
                {last14.map((d) => {
                  const log = h.logs.find((l) => l.date === d);
                  return (
                    <button
                      key={d}
                      onClick={() => toggle(h.id, d, !log?.done)}
                      title={d}
                      className={`h-6 w-6 rounded-xs text-caption ${log?.done ? "bg-ink" : "bg-field"} ${d === today ? "ring-1 ring-ink" : ""}`}
                    />
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New habit">
        <div className="flex flex-col gap-md">
          <Field label="Habit">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Revise before bed" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Category">
              <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Target / week">
              <Input type="number" min={1} max={7} value={form.targetPerWeek} onChange={(e) => setForm({ ...form, targetPerWeek: Number(e.target.value) })} />
            </Field>
          </div>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addHabit}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
