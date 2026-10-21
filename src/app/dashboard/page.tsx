"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApi, Card, Spinner, ErrorState, Stat } from "@/components/ui";
import { greetingForHour, minutesToHm, daysUntil, notifyTasksChanged } from "@/lib/utils";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, ListTodo } from "lucide-react";
import StudyTimer from "@/components/study-timer";
import SpringCheck from "@/components/reactbits/SpringCheck";

function boardExamDateISO(): string {
  const now = new Date();
  const thisYear = new Date(now.getFullYear(), 1, 15);
  const year = now <= thisYear ? now.getFullYear() : now.getFullYear() + 1;
  return `${year}-02-15`;
}

interface Dash {
  profile: { name: string } | null;
  todaysObjective: string;
  actualMinutes: number;
  plannedMinutes: number;
  overall: { chapters: number; mastered: number; completion: number };
  recentScores: Array<{ title: string; subject: string; score: number; max: number; pct: number; date: string }>;
  performance: Array<{ idx: number; pct: number; subject: string; date: string }>;
  pendingTasks: Array<{ id: string; title: string; priority: string; category: string; dueAt: string | null }>;
  englishStreak: number;
}

export default function DashboardPage() {
  const { data, loading, error, reload } = useApi<Dash>("/api/dashboard");
  const [quickTasks, setQuickTasks] = useState<Dash["pendingTasks"]>([]);

  useEffect(() => {
    if (data) setQuickTasks(data.pendingTasks ?? []);
  }, [data]);

  if (loading) return <Spinner label="Loading your command center…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  async function completeQuickTask(id: string) {
    setQuickTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    }).catch(() => null);
    notifyTasksChanged();
    reload();
  }

  const firstName = (data.profile?.name || "Gurmeet").split(" ")[0];
  const greeting = greetingForHour(new Date().getHours());
  const avgScore = data.recentScores.length ? Math.round(data.recentScores.reduce((s, r) => s + r.pct, 0) / data.recentScores.length) : 0;
  const bestScore = data.recentScores.length ? Math.max(...data.recentScores.map((r) => r.pct)) : 0;
  const daysLeft = Math.max(0, daysUntil(boardExamDateISO()));

  return (
    <div className="reveal mx-auto max-w-2xl">
      {/* Greeting */}
      <header className="mb-lg flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <h1 className="text-h3 text-ink">
            {greeting}, {firstName}.
          </h1>
          <p className="mt-xxs text-body-sm text-muted">{data.todaysObjective}</p>
        </div>
        <span className="shrink-0 rounded-full border border-hairline px-sm py-xxs text-caption text-muted">
          {daysLeft}d to boards
        </span>
      </header>

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

      {/* Quick tasks — tick straight from home */}
      <Card className="mb-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <ListTodo size={16} className="text-muted" />
            <h2 className="text-title text-ink">Quick tasks</h2>
          </div>
          <Link href="/tasks" className="text-caption text-muted underline hover:text-ink">
            All tasks
          </Link>
        </div>
        {quickTasks.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">Nothing due today. Add a task from the Tasks page.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xxs">
            {quickTasks.slice(0, 6).map((t) => (
              <li key={t.id}>
                <SpringCheck
                  label={t.title}
                  checked={false}
                  onChange={(checked) => {
                    if (checked) completeQuickTask(t.id);
                  }}
                  color="var(--chart-ink)"
                  fillColor="var(--chart-ink)"
                  checkColor="var(--chart-tip-bg)"
                  boxSize={18}
                  boxRadius={6}
                  fontSize={12}
                  strike="left"
                  ariaLabel={`Mark ${t.title} done`}
                  className="w-full"
                />
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Focus timer */}
      <Card className="mb-md">
        <StudyTimer onLogged={reload} />
      </Card>

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
              <AreaChart data={data.performance} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                <defs>
                  <linearGradient id="perf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-ink)" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="var(--chart-ink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} tickMargin={4} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tick={{ fontSize: 10, fill: "var(--chart-axis)" }}
                  width={34}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={4}
                />
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
    </div>
  );
}
