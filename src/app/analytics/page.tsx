"use client";

import React, { useState } from "react";
import { useApi, Card, Spinner, ErrorState, Stat, Segmented, Progress, EmptyState, Badge } from "@/components/ui";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  range: { from: string; to: string };
  studyByDay: Array<{ date: string; actual: number; planned: number }>;
  studyBySubject: Array<{ subject: string; minutes: number }>;
  scoreBySubject: Array<{ subject: string; avgScore: number | null; attempts: number }>;
  chapterMastery: Array<{ subject: string; notStarted: number; inProgress: number; revision: number; mastered: number }>;
  mockHistory: Array<{ title: string; subject: string; pct: number; score: number; max: number; date: string; mode: string }>;
  objectiveAccuracy: number | null;
  revisionDueNow: number;
  englishTrend: Array<{ date: string; wpm: number; fillers: number; words: number; type: string }>;
  englishMinutes: number;
  taskStats: { total: number; done: number; byCategory: Array<{ category: string; total: number; done: number }> };
  habitConsistency: Array<{ habit: string; consistency: number; done: number; total: number }>;
  freelance: { funnel: Array<{ stage: string; count: number }>; revenue: number; won: number; total: number };
  mistakeCategories: Array<{ category: string; count: number }>;
}

const MONO = ["#141414", "#3d3d3d", "#707070", "#adadad", "#0066ff", "#d0d0d0"];

export default function AnalyticsPage() {
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const from = new Date(Date.now() - (Number(range) - 1) * 86400000).toISOString().slice(0, 10);
  const { data, loading, error, reload } = useApi<AnalyticsData>(`/api/analytics?from=${from}`);

  if (loading) return <Spinner label="Crunching your data…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!data) return null;

  const totalStudy = data.studyByDay.reduce((a, d) => a + d.actual, 0);
  const avgMock = data.mockHistory.length ? Math.round(data.mockHistory.reduce((a, m) => a + m.pct, 0) / data.mockHistory.length) : null;
  const latestMock = data.mockHistory[data.mockHistory.length - 1];
  const firstMock = data.mockHistory[0];
  const mockDelta = latestMock && firstMock && data.mockHistory.length > 1 ? latestMock.pct - firstMock.pct : null;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Insight</p>
          <h1 className="mt-xs text-h2 text-ink">Analytics.</h1>
          <p className="mt-sm text-body text-muted">
            From {data.range.from} to {data.range.to}. Every number is derived from your own activity.
          </p>
        </div>
        <Segmented options={[{ value: "7", label: "7 days" }, { value: "30", label: "30 days" }, { value: "90", label: "90 days" }]} value={range} onChange={setRange} />
      </div>

      <div className="grid gap-md md:grid-cols-4">
        <Stat label="Total study time" value={`${Math.round(totalStudy / 60)}h`} hint={`${totalStudy} minutes logged`} />
        <Stat label="Avg mock score" value={avgMock != null ? `${avgMock}%` : "—"} hint={mockDelta != null ? `${mockDelta >= 0 ? "+" : ""}${mockDelta}% across window` : "Not enough mocks"} />
        <Stat label="Objective accuracy" value={data.objectiveAccuracy != null ? `${data.objectiveAccuracy}%` : "—"} hint="MCQ + true/false + assertion + matching" />
        <Stat label="English practice" value={`${data.englishMinutes}m`} hint={`${data.englishTrend.length} sessions`} />
      </div>

      <div className="mt-lg grid gap-md lg:grid-cols-2">
        <Card>
          <h3 className="text-title text-ink">Study time — planned vs actual</h3>
          <p className="text-caption text-muted">Minutes per day</p>
          <div className="mt-md h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.studyByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#707070" }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: "#707070" }} width={32} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
                <Area type="monotone" dataKey="planned" stroke="#adadad" fill="#f3f3f3" name="Planned" />
                <Area type="monotone" dataKey="actual" stroke="#141414" fill="#14141422" name="Actual" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Mock score trend</h3>
          <p className="text-caption text-muted">Percentage per submitted paper</p>
          <div className="mt-md h-64">
            {data.mockHistory.length === 0 ? (
              <EmptyState title="No exams yet" description="Generate and submit a paper to see your trend." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.mockHistory.map((m, i) => ({ ...m, idx: i + 1 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#707070" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#707070" }} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} labelFormatter={(l) => `Attempt ${l}`} />
                  <Line type="monotone" dataKey="pct" stroke="#141414" strokeWidth={2} dot={{ r: 3, fill: "#141414" }} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Study time by subject</h3>
          <div className="mt-md h-64">
            {data.studyBySubject.length === 0 ? (
              <EmptyState title="No sessions logged" description="Log study sessions to attribute time to subjects." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.studyBySubject} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#707070" }} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 10, fill: "#707070" }} width={90} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
                  <Bar dataKey="minutes" fill="#141414" radius={[0, 8, 8, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Average score by subject</h3>
          <div className="mt-md h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scoreBySubject.map((s) => ({ ...s, avgScore: s.avgScore ?? 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                <XAxis dataKey="subject" tick={{ fontSize: 10, fill: "#707070" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#707070" }} width={32} />
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
                <Bar dataKey="avgScore" fill="#0066ff" radius={[8, 8, 0, 0]} name="Avg %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-lg grid gap-md lg:grid-cols-3">
        <Card>
          <h3 className="text-title text-ink">Chapter mastery</h3>
          <div className="mt-sm flex flex-col gap-sm">
            {data.chapterMastery.map((c) => {
              const total = c.notStarted + c.inProgress + c.revision + c.mastered;
              return (
                <div key={c.subject}>
                  <div className="flex justify-between text-caption">
                    <span className="text-ink">{c.subject}</span>
                    <span className="text-muted">
                      {c.mastered}/{total}
                    </span>
                  </div>
                  <Progress className="mt-xs" value={c.mastered} max={Math.max(1, total)} />
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Mistake categories</h3>
          <div className="mt-md h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.mistakeCategories.filter((m) => m.count > 0)} dataKey="count" nameKey="category" cx="50%" cy="50%" innerRadius={40} outerRadius={80}>
                  {data.mistakeCategories.map((_, i) => (
                    <Cell key={i} fill={MONO[i % MONO.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Consistency</h3>
          <div className="mt-sm flex flex-col gap-sm">
            {data.habitConsistency.length === 0 && <p className="text-body-sm text-muted">No habits tracked in this window.</p>}
            {data.habitConsistency.map((h) => (
              <div key={h.habit}>
                <div className="flex justify-between text-caption">
                  <span className="text-ink">{h.habit}</span>
                  <span className="text-muted">{h.consistency}%</span>
                </div>
                <Progress className="mt-xs" value={h.consistency} max={100} />
              </div>
            ))}
            <div className="mt-sm border-t border-hairline-soft pt-sm text-caption text-muted">
              Tasks: {data.taskStats.done}/{data.taskStats.total} done
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-lg grid gap-md lg:grid-cols-2">
        <Card>
          <h3 className="text-title text-ink">English speaking trend</h3>
          <p className="text-caption text-muted">Words per minute over recent sessions</p>
          <div className="mt-md h-56">
            {data.englishTrend.length === 0 ? (
              <EmptyState title="No English sessions" description="Record a speaking practice to build this chart." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.englishTrend.map((e, i) => ({ ...e, idx: i + 1 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
                  <XAxis dataKey="idx" tick={{ fontSize: 10, fill: "#707070" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#707070" }} width={32} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
                  <Line type="monotone" dataKey="wpm" stroke="#141414" strokeWidth={2} name="WPM" />
                  <Line type="monotone" dataKey="fillers" stroke="#0066ff" strokeWidth={2} name="Fillers" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Freelance funnel</h3>
          <p className="text-caption text-muted">
            ₹{data.freelance.revenue.toLocaleString("en-IN")} won · {data.freelance.won}/{data.freelance.total} leads
          </p>
          <div className="mt-md h-56">
            {data.freelance.total === 0 ? (
              <EmptyState title="No leads yet" description="Add lead pipeline data in the Freelance CRM." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.freelance.funnel} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: "#707070" }} />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 9, fill: "#707070" }} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 16, border: "1px solid #e0e0e0", fontSize: 12 }} />
                  <Bar dataKey="count" fill="#141414" radius={[0, 8, 8, 0]} name="Leads" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {data.revisionDueNow > 0 && (
        <Card soft className="mt-lg">
          <p className="text-body text-ink">
            <Badge tone="ink">{data.revisionDueNow}</Badge> chapters are due for revision right now.
          </p>
        </Card>
      )}
    </div>
  );
}
