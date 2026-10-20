"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select, Checkbox, useToast, Spinner } from "@/components/ui";
import { SUBJECT_NAMES } from "@/lib/curriculum";

const COMMON_HABITS = ["Wake up early", "Drink 3L water", "Read 20 minutes", "English speaking practice", "Exercise 30 minutes", "Plan tomorrow before bed"];

export default function OnboardingPage() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    board: "CBSE",
    session: "2025-26",
    dailyStudyHours: 4,
    targetMarks: 75,
    englishAccent: "Indian",
    subjects: ["Physics", "Chemistry", "Mathematics"] as string[],
    usePresetChapters: true,
    examDates: "",
    schoolSchedule: "",
    habits: [] as string[],
  });

  const toggleSubject = (s: string) =>
    setForm((f) => ({ ...f, subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s] }));
  const toggleHabit = (h: string) =>
    setForm((f) => ({ ...f, habits: f.habits.includes(h) ? f.habits.filter((x) => x !== h) : [...f.habits, h] }));

  async function finish() {
    if (!form.name.trim() || !form.subjects.length) {
      toast("Enter your name and pick at least one subject.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, examDates: form.examDates || null, schoolSchedule: form.schoolSchedule || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Setup failed.");
      toast("Workspace created. Welcome to MY OS.", "success");
      router.push("/dashboard");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }

  const steps = ["Your profile", "Board & targets", "Subjects", "Habits"];

  return (
    <div className="mx-auto max-w-2xl py-xl">
      <p className="label-cap">Setup</p>
      <h1 className="mt-xs text-h2 text-ink">Build your personal OS.</h1>
      <p className="mt-sm text-body-lg text-muted">A few details let the exam engine, planner and assistant work with your real syllabus instead of guesses.</p>

      <div className="mt-lg flex gap-xs">
        {steps.map((s, i) => (
          <div key={s} className="flex-1">
            <div className={`h-1 rounded-full ${i <= step ? "bg-ink" : "bg-field"}`} />
            <p className={`mt-xs text-caption ${i === step ? "text-ink" : "text-faint"}`}>{s}</p>
          </div>
        ))}
      </div>

      <Card className="mt-lg">
        {step === 0 && (
          <div className="flex flex-col gap-md">
            <Field label="What should we call you?">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" autoFocus />
            </Field>
            <Field label="Daily study hours you can realistically give" hint="The planner will never schedule more than this.">
              <Input type="number" min={0.5} max={18} step={0.5} value={form.dailyStudyHours} onChange={(e) => setForm({ ...form, dailyStudyHours: Number(e.target.value) })} />
            </Field>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-md">
            <Field label="Education board">
              <Select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}>
                {["CBSE", "ISC", "State Board", "IB", "Other"].map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Academic session">
              <Input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} />
            </Field>
            <Field label="Target percentage" hint="Used to prioritise high-impact chapters.">
              <Input type="number" min={0} max={100} value={form.targetMarks} onChange={(e) => setForm({ ...form, targetMarks: Number(e.target.value) })} />
            </Field>
            <Field label="Board exam dates (optional)" hint="Paste any dates you know — the planner will countdown to them.">
              <Input value={form.examDates} onChange={(e) => setForm({ ...form, examDates: e.target.value })} placeholder="e.g. Physics 15 Feb, Maths 8 Mar…" />
            </Field>
            <Field label="School / coaching schedule (optional)">
              <Input value={form.schoolSchedule} onChange={(e) => setForm({ ...form, schoolSchedule: e.target.value })} placeholder="e.g. School 8am–2pm, coaching Mon/Wed/Fri 4–6pm" />
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col gap-md">
            <p className="text-body text-ink">Pick your Class 12 subjects. Standard CBSE chapters load automatically where we have them; you can edit everything later.</p>
            <div className="grid grid-cols-2 gap-xs sm:grid-cols-3">
              {SUBJECT_NAMES.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSubject(s)}
                  className={`rounded-full px-sm py-xs text-body-sm transition-colors ${form.subjects.includes(s) ? "bg-ink text-on-primary" : "bg-canvas-soft text-ink hover:opacity-80"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Checkbox label="Load standard CBSE chapter lists for these subjects" checked={form.usePresetChapters} onChange={(e) => setForm({ ...form, usePresetChapters: e.target.checked })} />
            <Field label="Preferred English accent (learning target only)">
              <Select value={form.englishAccent} onChange={(e) => setForm({ ...form, englishAccent: e.target.value })}>
                {["Indian", "British", "American"].map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-col gap-md">
            <p className="text-body text-ink">Choose daily habits to track. Streaks build automatically.</p>
            <div className="flex flex-wrap gap-xs">
              {COMMON_HABITS.map((h) => (
                <button
                  key={h}
                  onClick={() => toggleHabit(h)}
                  className={`rounded-full px-sm py-xs text-body-sm transition-colors ${form.habits.includes(h) ? "bg-ink text-on-primary" : "bg-canvas-soft text-ink hover:opacity-80"}`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-xl flex items-center justify-between gap-sm">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || loading}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={(step === 0 && !form.name.trim()) || (step === 2 && !form.subjects.length)}>
              Continue
            </Button>
          ) : (
            <Button onClick={finish} disabled={loading}>
              {loading ? <Spinner label="Creating…" /> : "Enter my OS"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
