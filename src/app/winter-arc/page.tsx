"use client";

import React, { useMemo, useState } from "react";
import {
  useApi,
  Card,
  CardTitle,
  Button,
  Badge,
  Spinner,
  ErrorState,
  Field,
  Input,
  Textarea,
  Modal,
  useToast,
  EmptyState,
  Progress,
  Stat,
  SectionHeader,
} from "@/components/ui";
import { todayISO, dateOffsetISO, cn } from "@/lib/utils";
import { Snowflake, Flame, Lock, Plus, X, Settings2, ShieldCheck, Zap } from "lucide-react";

interface ArcDay {
  id: string;
  date: string;
  lockedIn: boolean;
  focusMinutes: number;
  noPhone: boolean;
  trained: boolean;
  noJunk: boolean;
  sleptEarly: boolean;
  reflection: string;
  score: number;
}
interface Arc {
  id: string;
  active: boolean;
  title: string;
  mission: string;
  startDate: string;
  endDate: string;
  commitments: string[];
  nonNegotiables: string[];
  rules: string[];
  dailyTargetMin: number;
  days: ArcDay[];
}
interface ArcResponse {
  arc: Arc | null;
  stats: {
    totalDays: number;
    elapsed: number;
    remaining: number;
    lockedDays: number;
    avgScore: number;
    streak: number;
    logged: number;
  };
}

const FLAGS: Array<{ key: keyof Pick<ArcDay, "lockedIn" | "noPhone" | "trained" | "noJunk" | "sleptEarly">; label: string }> = [
  { key: "lockedIn", label: "Locked in" },
  { key: "noPhone", label: "No phone" },
  { key: "trained", label: "Trained" },
  { key: "noJunk", label: "No junk" },
  { key: "sleptEarly", label: "Slept early" },
];

export default function WinterArcPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<ArcResponse>("/api/winter-arc");
  const [showSetup, setShowSetup] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "Winter Arc",
    mission: "",
    startDate: todayISO(),
    endDate: dateOffsetISO(90),
    dailyTargetMin: 600,
  });
  const [commitments, setCommitments] = useState<string[]>([]);
  const [nonNegotiables, setNonNegotiables] = useState<string[]>([]);
  const [rules, setRules] = useState<string[]>([]);
  const [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false);

  const arc = data?.arc ?? null;
  const stats = data?.stats;
  const today = todayISO();
  const todayLog = useMemo(() => arc?.days.find((d) => d.date === today) ?? null, [arc, today]);

  function openSetup() {
    setForm({
      title: arc?.title ?? "Winter Arc",
      mission: arc?.mission ?? "",
      startDate: arc?.startDate ?? todayISO(),
      endDate: arc?.endDate ?? dateOffsetISO(90),
      dailyTargetMin: arc?.dailyTargetMin ?? 600,
    });
    setCommitments(arc?.commitments ?? []);
    setNonNegotiables(arc?.nonNegotiables ?? []);
    setRules(arc?.rules ?? []);
    setEditing(!!arc);
    setShowSetup(true);
  }

  async function saveArc() {
    setBusy(true);
    await fetch("/api/winter-arc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, active: true, commitments, nonNegotiables, rules }),
    }).catch(() => null);
    setBusy(false);
    setShowSetup(false);
    toast(editing ? "Winter Arc updated." : "Winter Arc started. Lock in.", "success");
    reload();
  }

  async function logDay(patch: Partial<ArcDay>) {
    setBusy(true);
    await fetch("/api/winter-arc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: today, ...patch, ...(reflection ? { reflection } : {}) }),
    }).catch(() => null);
    setBusy(false);
    reload();
  }

  async function endArc() {
    await fetch("/api/winter-arc", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delete: true }),
    }).catch(() => null);
    toast("Winter Arc closed. Start a new one when you're ready.", "success");
    reload();
  }

  if (loading) return <Spinner label="Loading Winter Arc…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  // ----- Empty state: no arc yet -----
  if (!arc?.active) {
    return (
      <div>
        <div className="mb-lg">
          <p className="label-cap">Deep work season</p>
          <h1 className="mt-xs flex items-center gap-sm text-h2 text-ink">
            <Snowflake size={26} /> Winter Arc.
          </h1>
          <p className="mt-sm max-w-prose text-body text-muted">
            A focused season where you go all-in. Pick a window, set non-negotiables, and lock in every single day.
            No excuses, no zero days — just compounding discipline.
          </p>
        </div>
        <EmptyState
          title="No Winter Arc yet"
          description="Start one now. Most people run it for 60–90 days of ruthless focus."
          action={<Button onClick={openSetup}>Start my Winter Arc</Button>}
        />
        {setupModal()}
      </div>
    );
  }

  const pct = stats ? Math.round((stats.elapsed / stats.totalDays) * 100) : 0;
  const last28 = Array.from({ length: 28 }, (_, i) => dateOffsetISO(-27 + i));

  function setupModal() {
    return (
      <Modal open={showSetup} onClose={() => setShowSetup(false)} title={editing ? "Edit Winter Arc" : "Start your Winter Arc"}>
        <div className="flex flex-col gap-md">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Winter Arc" />
          </Field>
          <Field label="Mission" hint="One line. Why are you doing this?">
            <Textarea value={form.mission} onChange={(e) => setForm({ ...form, mission: e.target.value })} placeholder="e.g. Top the boards and ship 3 paid projects." />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Start date">
              <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </Field>
            <Field label="End date">
              <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Daily focus target (minutes)">
            <Input type="number" min={30} max={1440} step={30} value={form.dailyTargetMin} onChange={(e) => setForm({ ...form, dailyTargetMin: Number(e.target.value) })} />
          </Field>
          <ListEditor label="Commitments" hint="What you're committing to this season" items={commitments} onChange={setCommitments} placeholder="e.g. 6 focused hours daily" />
          <ListEditor label="Non-negotiables" hint="Never skip these" items={nonNegotiables} onChange={setNonNegotiables} placeholder="e.g. Sleep by 11pm" />
          <ListEditor label="Rules" hint="Your own laws for the season" items={rules} onChange={setRules} placeholder="e.g. No social media before noon" />
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowSetup(false)}>
              Cancel
            </Button>
            <Button onClick={saveArc} disabled={busy || !form.title.trim()}>
              {editing ? "Save changes" : "Start Arc"}
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Deep work season</p>
          <h1 className="mt-xs flex items-center gap-sm text-h2 text-ink">
            <Snowflake size={26} /> {arc.title}.
          </h1>
          {arc.mission && <p className="mt-sm max-w-prose text-body text-muted">{arc.mission}</p>}
        </div>
        <div className="flex items-center gap-xs">
          <Badge tone={stats && stats.streak > 0 ? "accent" : "neutral"}>
            <Flame size={13} className="mr-xxs inline" /> {stats?.streak ?? 0} day streak
          </Badge>
          <Button variant="outline" onClick={openSetup}>
            <Settings2 size={15} /> Edit
          </Button>
        </div>
      </div>

      <Card className="mb-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <CardTitle>Season progress</CardTitle>
          <p className="text-caption text-muted">
            Day {stats?.elapsed} of {stats?.totalDays} · {stats?.remaining} left
          </p>
        </div>
        <Progress className="mt-sm" value={stats?.elapsed ?? 0} max={stats?.totalDays ?? 1} />
        <div className="mt-md grid grid-cols-2 gap-sm sm:grid-cols-4">
          <Stat label="Locked days" value={stats?.lockedDays ?? 0} />
          <Stat label="Avg score" value={`${stats?.avgScore ?? 0}%`} />
          <Stat label="Days logged" value={stats?.logged ?? 0} />
          <Stat label="Current streak" value={stats?.streak ?? 0} />
        </div>
      </Card>

      <div className="grid gap-md lg:grid-cols-2">
        {/* Lock in today */}
        <Card>
          <div className="flex items-center justify-between">
            <CardTitle>Lock in today</CardTitle>
            {todayLog && <Badge tone="neutral">{todayLog.score}% today</Badge>}
          </div>
          <div className="mt-sm flex flex-wrap gap-xs">
            {FLAGS.map((f) => {
              const on = todayLog ? (todayLog[f.key] as boolean) : false;
              const disabled = f.key === "lockedIn";
              return (
                <button
                  key={f.key}
                  disabled={disabled}
                  onClick={() => logDay({ [f.key]: !on } as Partial<ArcDay>)}
                  className={cn(
                    "rounded-full border px-sm py-xs text-body-sm transition-colors",
                    on ? "border-ink bg-ink text-on-primary" : "border-hairline text-ink hover:bg-field",
                    disabled && "opacity-90"
                  )}
                >
                  {f.key === "lockedIn" && <Lock size={13} className="mr-xxs inline" />}
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="mt-sm">
            <Field label="Focus minutes today">
              <Input
                type="number"
                min={0}
                max={1440}
                step={15}
                defaultValue={todayLog?.focusMinutes ?? 0}
                onBlur={(e) => logDay({ focusMinutes: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="mt-sm">
            <Field label="Reflection">
              <Textarea
                value={reflection || (todayLog?.reflection ?? "")}
                onChange={(e) => setReflection(e.target.value)}
                onBlur={() => reflection && logDay({})}
                placeholder="What did you win today? What will you fix tomorrow?"
              />
            </Field>
          </div>
        </Card>

        {/* Laws of the arc */}
        <Card>
          <CardTitle>Laws of the arc</CardTitle>
          <div className="mt-sm flex flex-col gap-md">
            <ArcList title="Commitments" items={arc.commitments} icon={<Zap size={14} />} />
            <ArcList title="Non-negotiables" items={arc.nonNegotiables} icon={<ShieldCheck size={14} />} />
            <ArcList title="Rules" items={arc.rules} icon={<Lock size={14} />} />
            {!arc.commitments.length && !arc.nonNegotiables.length && !arc.rules.length && (
              <p className="text-body-sm text-muted">No laws set yet. Tap Edit to add your commitments.</p>
            )}
          </div>
        </Card>
      </div>

      {/* 28-day grid */}
      <Card className="mt-md">
        <SectionHeader title="Last 28 days" subtitle="Each square is a day. Filled = locked in." />
        <div className="mt-sm flex flex-wrap gap-xxs">
          {last28.map((d) => {
            const log = arc.days.find((x) => x.date === d);
            const intensity = log ? Math.max(1, Math.round((log.score / 100) * 4)) : 0;
            return (
              <div
                key={d}
                title={log ? `${d} · ${log.score}%` : d}
                className={cn(
                  "h-6 w-6 rounded-xs",
                  intensity === 0 && "bg-field",
                  intensity === 1 && "bg-hairline",
                  intensity === 2 && "bg-muted",
                  intensity === 3 && "bg-ink/70",
                  intensity === 4 && "bg-ink",
                  d === today && "ring-1 ring-ink ring-offset-1"
                )}
              />
            );
          })}
        </div>
        <div className="mt-md flex justify-end">
          <Button variant="ghost" onClick={endArc}>
            End arc
          </Button>
        </div>
      </Card>

      {setupModal()}
    </div>
  );
}

function ArcList({ title, items, icon }: { title: string; items: string[]; icon: React.ReactNode }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="flex items-center gap-xs text-caption font-medium uppercase tracking-wide text-muted">
        {icon} {title}
      </p>
      <ul className="mt-xs flex flex-col gap-xxs">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-xs text-body-sm text-ink">
            <span className="mt-xs h-1 w-1 shrink-0 rounded-full bg-ink" />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ListEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...items, v]);
    setDraft("");
  }
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-xs">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus size={15} />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="mt-xs flex flex-wrap gap-xxs">
          {items.map((it, i) => (
            <span key={i} className="inline-flex items-center gap-xxs rounded-full bg-field px-sm py-xxs text-body-sm text-ink">
              {it}
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remove">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </Field>
  );
}
