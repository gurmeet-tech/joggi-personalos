"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi, Card, Button, Field, Input, Select, Checkbox, Spinner, ErrorState, Badge, useToast } from "@/components/ui";
import { isValidVideoUrl } from "@/lib/utils";
import { Save, Download, RotateCcw, KeyRound, Volume2, ShieldCheck } from "lucide-react";

interface Profile {
  name: string;
  board: string;
  session: string;
  class: string;
  targetMarks: number | null;
  dailyStudyHours: number;
  englishAccent: string;
  ambienceVideoUrl: string;
  ambienceVolume: number;
  strictMode: boolean;
  defaultDurationMin: number;
  schoolSchedule: string | null;
  examDates: string | null;
  onboarded: boolean;
}

export default function SettingsPage() {
  const toast = useToast();
  const router = useRouter();
  const { data, loading, error, reload } = useApi<Profile>("/api/profile");
  const [form, setForm] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save.");
      toast("Settings saved.", "success");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !form) return <Spinner label="Loading settings…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const videoCheck = form.ambienceVideoUrl ? isValidVideoUrl(form.ambienceVideoUrl) : { ok: true };
  const videoOk = videoCheck.ok;

  return (
    <div className="max-w-3xl">
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">System</p>
          <h1 className="mt-xs text-h2 text-ink">Settings.</h1>
          <p className="mt-sm text-body text-muted">Profile, exam defaults, ambience and your data. Everything is stored locally on this machine.</p>
        </div>
        <Button onClick={save} disabled={saving}>
          <Save size={16} /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Card>
        <h3 className="text-title text-ink">Profile</h3>
        <div className="mt-md grid gap-md sm:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Board">
            <Select value={form.board} onChange={(e) => setForm({ ...form, board: e.target.value })}>
              {["CBSE", "ICSE", "State Board", "IB", "IGCSE"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </Select>
          </Field>
          <Field label="Session">
            <Input value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })} />
          </Field>
          <Field label="Target overall marks (%)">
            <Input type="number" min={0} max={100} value={form.targetMarks ?? ""} onChange={(e) => setForm({ ...form, targetMarks: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label="Daily study hours">
            <Input type="number" min={0.5} max={18} step={0.5} value={form.dailyStudyHours} onChange={(e) => setForm({ ...form, dailyStudyHours: Number(e.target.value) })} />
          </Field>
          <Field label="English accent target">
            <Select value={form.englishAccent} onChange={(e) => setForm({ ...form, englishAccent: e.target.value })}>
              {["Indian", "British", "American"].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Exam dates" className="mt-md" hint="One per line, e.g. Physics — 2026-03-01">
          <textarea className="input min-h-20 resize-y" value={form.examDates ?? ""} onChange={(e) => setForm({ ...form, examDates: e.target.value })} />
        </Field>
        <Field label="School / daily schedule" className="mt-md" hint="Used by the planner to find study slots.">
          <textarea className="input min-h-20 resize-y" value={form.schoolSchedule ?? ""} onChange={(e) => setForm({ ...form, schoolSchedule: e.target.value })} />
        </Field>
      </Card>

      <Card className="mt-lg">
        <h3 className="flex items-center gap-xs text-title text-ink">
          <ShieldCheck size={16} /> Exam simulator defaults
        </h3>
        <div className="mt-md grid gap-md sm:grid-cols-2">
          <Field label="Default duration (minutes)">
            <Input type="number" min={5} max={360} value={form.defaultDurationMin} onChange={(e) => setForm({ ...form, defaultDurationMin: Number(e.target.value) })} />
          </Field>
          <div className="flex items-end">
            <Checkbox label="Strict invigilator mode by default (hides answers, enforces the clock)" checked={form.strictMode} onChange={(e) => setForm({ ...form, strictMode: e.target.checked })} />
          </div>
        </div>
      </Card>

      <Card className="mt-lg">
        <h3 className="flex items-center gap-xs text-title text-ink">
          <Volume2 size={16} /> Exam ambience
        </h3>
        <p className="mt-xs text-body-sm text-muted">A YouTube ambience track plays audio-only during exams. If the browser blocks autoplay, you will get an honest “Enable exam audio” button.</p>
        <Field label="Ambience video URL" className="mt-md" hint={videoOk ? "Looks valid." : videoCheck.error}>
          <Input value={form.ambienceVideoUrl} onChange={(e) => setForm({ ...form, ambienceVideoUrl: e.target.value })} placeholder="https://youtu.be/CYcn9O8hkz8" />
        </Field>
        {!videoOk && <p className="mt-xs text-caption text-ink">{videoCheck.error}</p>}
        <Field label={`Default volume — ${Math.round(form.ambienceVolume * 100)}%`} className="mt-md">
          <input type="range" min={0} max={1} step={0.05} value={form.ambienceVolume} onChange={(e) => setForm({ ...form, ambienceVolume: Number(e.target.value) })} className="w-full accent-ink" />
        </Field>
      </Card>

      <Card className="mt-lg">
        <h3 className="text-title text-ink">AI engine</h3>
        <p className="mt-sm text-body-sm text-muted">
          The app runs fully offline in a clearly-labelled <span className="text-ink">Demo</span> mode. Add{" "}
          <code className="rounded-xs bg-canvas-soft px-xs py-xxs text-caption">AI_API_KEY</code> (and optionally{" "}
          <code className="rounded-xs bg-canvas-soft px-xs py-xxs text-caption">AI_MODEL</code>,{" "}
          <code className="rounded-xs bg-canvas-soft px-xs py-xxs text-caption">AI_BASE_URL</code>) to your <code className="rounded-xs bg-canvas-soft px-xs py-xxs text-caption">.env</code> file for live generation. Keys are read server-side only and never exposed to the browser.
        </p>
        <div className="mt-sm flex items-center gap-xs">
          <KeyRound size={14} className="text-muted" />
          <Badge tone="neutral">Server-side only</Badge>
        </div>
      </Card>

      <Card className="mt-lg">
        <h3 className="text-title text-ink">Your data</h3>
        <p className="mt-sm text-body-sm text-muted">Export everything as a JSON file, or re-run onboarding to rebuild your subjects and habits.</p>
        <div className="mt-md flex flex-wrap gap-xs">
          <a href="/api/export" download className="btn-outline">
            <Download size={16} /> Export all data
          </a>
          <Button variant="outline" onClick={() => router.push("/onboarding")}>
            <RotateCcw size={16} /> Re-run onboarding
          </Button>
        </div>
      </Card>

      <div className="mt-lg flex justify-end">
        <Button onClick={save} disabled={saving || !videoOk}>
          <Save size={16} /> {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
