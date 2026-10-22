import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJSON, dateOffsetISO, todayISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || dateOffsetISO(-29);
  const to = req.nextUrl.searchParams.get("to") || todayISO();

  const [subjects, chapters, sessions, habits, habitLogs, tasks, leads, english, mistakes, plans] = await Promise.all([
    db.subject.findMany({ include: { chapters: true } }),
    db.chapter.findMany({ include: { subject: { select: { name: true } } } }),
    db.studySession.findMany({ where: { date: { gte: from, lte: to } }, include: { chapter: { include: { subject: { select: { name: true } } } } } }),
    db.habit.findMany({ include: { logs: { where: { date: { gte: from, lte: to } } } } }),
    db.habitLog.findMany({ where: { date: { gte: from, lte: to } } }),
    db.task.findMany({ where: { updatedAt: { gte: new Date(from) } } }),
    db.freelanceLead.findMany(),
    db.englishSession.findMany({ where: { createdAt: { gte: new Date(from) } }, orderBy: { createdAt: "asc" } }),
    db.mistake.findMany(),
    db.studyPlan.findMany({ where: { date: { gte: from, lte: to } } }),
  ]);

  // Study hours by day
  const days: string[] = [];
  for (let d = new Date(from); d <= new Date(to); d.setDate(d.getDate() + 1)) days.push(d.toISOString().slice(0, 10));
  const studyByDay = days.map((date) => ({
    date,
    actual: sessions.filter((s) => s.date === date).reduce((a, s) => a + (s.actualMinutes ?? 0), 0),
    planned: plans.find((p) => p.date === date)?.plannedMinutes ?? sessions.filter((s) => s.date === date).reduce((a, s) => a + s.plannedMinutes, 0),
  }));

  const studyBySubject = subjects.map((s) => ({
    subject: s.name,
    minutes: sessions.filter((x) => x.chapter?.subject?.name === s.name || x.subjectId === s.id).reduce((a, x) => a + (x.actualMinutes ?? 0), 0),
  }));

  const chapterMastery = subjects.map((s) => ({
    subject: s.name,
    notStarted: s.chapters.filter((c) => c.status === "NOT_STARTED").length,
    inProgress: s.chapters.filter((c) => c.status === "IN_PROGRESS").length,
    revision: s.chapters.filter((c) => c.status === "REVISION_REQUIRED" || c.status === "NEEDS_PRACTICE").length,
    mastered: s.chapters.filter((c) => c.status === "MASTERED").length,
  }));

  const englishTrend = english.map((s) => {
    const m = parseJSON<{ wpm?: number; fillerCount?: number; wordCount?: number }>(s.metrics, {});
    return { date: s.createdAt.toISOString().slice(0, 10), wpm: m.wpm ?? 0, fillers: m.fillerCount ?? 0, words: m.wordCount ?? 0, type: s.type };
  });

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "DONE").length,
    byCategory: ["ACADEMICS", "ENGLISH", "FREELANCE", "PERSONAL", "HEALTH", "ADMIN", "OTHER"].map((c) => ({
      category: c,
      total: tasks.filter((t) => t.category === c).length,
      done: tasks.filter((t) => t.category === c && t.status === "DONE").length,
    })),
  };

  const habitConsistency = habits.map((h) => {
    const total = days.length;
    const done = habitLogs.filter((l) => l.habitId === h.id && l.done).length;
    return { habit: h.name, consistency: total ? Math.round((done / total) * 100) : 0, done, total };
  });

  const won = leads.filter((l) => l.status === "WON");
  const revenue = won.reduce((s, l) => s + (l.estimatedValue || 0), 0);
  const funnel = ["LEAD", "CONTACTED", "REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].map((st) => {
    const order = ["LEAD", "CONTACTED", "REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
    const idx = order.indexOf(st);
    return { stage: st, count: leads.filter((l) => order.indexOf(l.status) >= idx && l.status !== "LOST").length };
  });

  return NextResponse.json({
    range: { from, to },
    studyByDay,
    studyBySubject: studyBySubject.filter((s) => s.minutes > 0),
    chapterMastery,
    revisionDueNow: chapters.filter((c) => c.status === "REVISION_REQUIRED" || (c.nextRevisionAt && c.nextRevisionAt <= new Date())).length,
    englishTrend,
    englishMinutes: english.reduce((s, x) => s + Math.round(x.durationSec / 60), 0),
    taskStats,
    habitConsistency,
    freelance: { funnel, revenue, won: won.length, total: leads.length },
    mistakeCategories: ["CONCEPT_GAP", "SILLY_MISTAKE", "TIME_PRESSURE", "NOT_STUDIED", "FORGOTTEN", "CALCULATION"].map((c) => ({
      category: c,
      count: mistakes.filter((m) => m.category === c).length,
    })),
  });
}
