"use client";

import React from "react";
import Link from "next/link";
import { useApi, Card, Progress, Badge, Spinner, ErrorState, Stat } from "@/components/ui";
import { greetingForHour, relativeDay, pct, minutesToHm, daysUntil, quoteForDay } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { ArrowRight, FlaskConical, Trophy, Target, Sparkles, TrendingUp, Hourglass, Quote } from "lucide-react";
import StudyTimer from "@/components/study-timer";

function boardExamDateISO(): string {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 1, 15);
  const year = now <= thisYear ? now.getFullYear() : now.getFullYear() + 1;
  return `${year}-02-15`;
}

interface WeeklyTarget {
  id: string | null;
  name: string | null;
  subject: string;
  status: string | null;
  confidence: number | null;
  completion: number | null;
  area: string;
}
interface Dash {
  profile: { name: string } | null;
  date: string;
  todaysObjective: string;
  recommendation: string;
  actualMinutes: number;
  plannedMinutes: number;
  overall: { chapters: number; mastered: number; completion: number };
  recentScores: Array<{ title: string; subject: string; score: number; max: number; pct: number; date: string }>;
  performance: Array<{ idx: number; pct: number; subject: string; date: string }>;
  weeklyTargets: { weekStart: string; weekEnd: string; targets: WeeklyTarget[] };
  tools: Array<{ title: string; reason: string; href: string }>;
  weakChapters: Array<{ id: string; name: string; subject: string; confidence: number; lastTestScore: number | null }>;
  revisionDue: Array<{ id: string; title: string; kind: string }>;
  englishStreak: number;
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi<Dash>("/api/dashboard");

  if (loading) return <Spinner label="Loading your command center…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const firstName = (data.profile?.name || "Gurmeet").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());
  const avgScore = data.recentScores.length ? Math.round(data.recentScores.reduce((s, r) => s + r.pct, 0) / data.recentScores.length) : 0;
  const bestScore = data.recentScores.length ? Math.max(...data.recentScores.map((r) => r.pct)) : 0;

  const daysLeft = daysUntil(boardExamDateISO());
  const quote = quoteForDay(new Date().getDate() + new Date().getMonth() * 31);

  return (
    <div className="reveal mx-auto max-w-2xl">
      {/* Greeting */}
      <header className="mb-md">
        <h1 className="text-h3 text-ink">
          {greeting}, {firstName}.
        </h1>
        <p className="mt-xs text-body text-muted">{data.todaysObjective}</p>
      </header>

      {/* Board countdown */}
      <Card className="mb-md overflow-hidden">
        <div className="flex items-center justify-between gap-md">
          <div className="min-w-0">
            <div className="flex items-center gap-xs text-muted">
              <Hourglass size={14} />
              <span className="text-caption uppercase tracking-wide">CBSE Boards · 15 Feb</span>
            </div>
            <p className="mt-xs flex items-baseline gap-xs">
              <span className="text-h1 text-ink tabular-nums">{daysLeft < 0 ? 0 : daysLeft}</span>
              <span className="text-body-sm text-muted">days left to own it</span>
            </p>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-ink text-on-primary">
            <span className="text-h3 leading-none tabular-nums">{daysLeft < 0 ? "0" : daysLeft}</span>
          </div>
        </div>
        <div className="mt-md flex items-start gap-xs rounded-sm bg-canvas-soft p-sm">
          <Quote size={13} className="mt-xxs shrink-0 text-muted" />
          <p className="text-body-sm italic text-ink">{quote}</p>
        </div>
      </Card>

      {/* Focus timer — real study hours */}
      <Card className="mb-md">
        <StudyTimer onLogged={reload} />
      </Card>

      {/* Today strip */}
      <div className="mb-md grid grid-cols-3 gap-xs">
        <Card className="p-md">
          <Stat label="Studied" value={minutesToHm(data.actualMinutes)} hint={`of ${minutesToHm(data.plannedMinutes)}`} />
        </Card>
        <Card className="p-md">
          <Stat label="Mastered" value={`${data.overall.completion}%`} hint={`${data.overall.mastered}/${data.overall.chapters}`} />
        </Card>
        <Card className="p-md">
          <Stat label="English" value={`${data.englishStreak}d`} hint="streak" />
        </Card>
      </div>

      {/* Performance graph */}
      <Card className="mb-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <TrendingUp size={16} className="text-muted" />
            <h2 className="text-title text-ink">Performance</h2>
          </div>
          <Link href="/analytics" className="text-caption text-muted underline hover:text-ink">
            Analytics
          </Link>
        </div>
        <div className="mt-xs flex items-center gap-md">
          <span className="text-h3 text-ink">{avgScore}%</span>
          <span className="text-body-sm text-muted">avg · best {bestScore}%</span>
        </div>
        <div className="mt-md h-44">
          {data.performance.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-body-sm text-muted">
              Take a test to unlock your performance graph.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.performance} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-ink)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--chart-ink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--chart-axis)" }} width={34} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 16, border: "1px solid var(--chart-tip-border)", background: "var(--chart-tip-bg)", color: "var(--chart-ink)", fontSize: 12 }}
                  labelFormatter={(l) => `Attempt ${l}`}
                  formatter={(v: number) => [`${v}%`, "Score"]}
                />
                <Area type="monotone" dataKey="pct" stroke="var(--chart-ink)" strokeWidth={2} fill="url(#perf)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* This week: master 1 chapter per subject */}
      <Card className="mb-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <Target size={16} className="text-muted" />
            <h2 className="text-title text-ink">This week&apos;s mission</h2>
          </div>
          <span className="text-caption text-muted">Master 1 / subject</span>
        </div>
        <p className="mt-xs text-body-sm text-muted">Kill one chapter in each — study, test, then mark it dead.</p>
        <ul className="mt-md flex flex-col gap-sm">
          {data.weeklyTargets.targets.map((t) => (
            <li key={t.area} className="rounded-sm bg-canvas-soft p-md">
              <div className="flex items-center justify-between">
                <span className="text-caption uppercase tracking-wide text-muted">{t.area}</span>
                {t.status && <Badge tone="outline">{t.status.replace(/_/g, " ")}</Badge>}
              </div>
              <p className="mt-xs text-title text-ink">{t.name ?? `Add a ${t.area} subject`}</p>
              {t.confidence != null && (
                <div className="mt-sm">
                  <Progress value={t.completion ?? 0} max={100} />
                  <p className="mt-xxs text-caption text-muted">
                    Confidence {t.confidence}/5 · {t.completion ?? 0}% mastered
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
        <Link href="/planner" className="btn-primary mt-md w-full">
          Plan this week <ArrowRight size={15} />
        </Link>
      </Card>

      {/* Recommended tools */}
      <Card className="mb-md">
        <div className="flex items-center gap-xs">
          <Sparkles size={16} className="text-muted" />
          <h2 className="text-title text-ink">Recommended for you</h2>
        </div>
        <ul className="mt-md flex flex-col gap-xs">
          {data.tools.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="hover-lift flex items-center justify-between gap-sm rounded-sm border border-hairline-soft p-md hover:border-ink"
              >
                <div className="min-w-0">
                  <p className="text-body-sm text-ink">{tool.title}</p>
                  <p className="mt-xxs text-caption text-muted">{tool.reason}</p>
                </div>
                <ArrowRight size={15} className="shrink-0 text-muted" />
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {/* Recent scores */}
      <Card className="mb-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <Trophy size={16} className="text-muted" />
            <h2 className="text-title text-ink">Recent tests</h2>
          </div>
          <Link href="/exam-studio" className="btn-outline !min-h-8 !px-sm">
            <FlaskConical size={14} /> New test
          </Link>
        </div>
        {data.recentScores.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No tests yet. Generate your first paper in the AI Exam Studio.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {data.recentScores.map((s, i) => (
              <li key={i} className="flex items-center justify-between gap-sm rounded-sm bg-canvas-soft px-sm py-xs">
                <span className="min-w-0 truncate text-body-sm text-ink">{s.title}</span>
                <span className="shrink-0 text-body-sm text-ink">{s.pct}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {data.recommendation && (
        <p className="px-xs text-caption text-muted">{data.recommendation}</p>
      )}
    </div>
  );
}
