import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJSON, todayISO, dateOffsetISO, pct } from "@/lib/utils";
import { generateStudyPlan } from "@/lib/ai";

export const dynamic = "force-dynamic";

export async function GET() {
  const today = todayISO();
  const [profile, subjects, tasks, habits, habitLogs, plans, sessions, revisionCards, chapters, leads, englishSessions, mistakes] =
    await Promise.all([
      db.profile.findUnique({ where: { id: "default" } }),
      db.subject.findMany({ include: { chapters: true }, orderBy: { order: "asc" } }),
      db.task.findMany({ orderBy: [{ status: "asc" }, { dueAt: "asc" }] }),
      db.habit.findMany({ include: { logs: true } }),
      db.habitLog.findMany({ where: { date: today } }),
      db.studyPlan.findFirst({ where: { date: today } }),
      db.studySession.findMany({ where: { date: today } }),
      db.revisionCard.findMany({ where: { nextReviewAt: { lte: today } } }),
      db.chapter.findMany({ include: { subject: { select: { name: true } } } }),
      db.freelanceLead.findMany(),
      db.englishSession.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      db.mistake.findMany({ where: { mastered: false } }),
    ]);

  const todaysTasks = tasks.filter((t) => !t.dueAt || t.dueAt.slice(0, 10) <= today);
  const overdueTasks = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) < today && t.status !== "DONE" && t.status !== "SKIPPED");
  const pendingToday = todaysTasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS");
  const doneToday = todaysTasks.filter((t) => t.status === "DONE");

  const planItems = parseJSON<Array<{ id: string; title: string; type: string; minutes: number; completed?: boolean; chapter?: string; subject?: string }>>(plans?.items ?? "[]", []);
  const plannedMinutes = plans?.plannedMinutes || planItems.reduce((s, i) => s + (i.minutes || 0), 0);
  const actualMinutes = sessions.reduce((s, x) => s + (x.actualMinutes ?? 0), 0);

  const revisionDueChapters = chapters.filter((c) => c.status === "REVISION_REQUIRED" || (c.nextRevisionAt && c.nextRevisionAt <= new Date()));
  const mistakesDue = mistakes.filter((m) => m.nextReviewAt <= today);

  const englishDates = englishSessions.map((s) => s.createdAt.toISOString().slice(0, 10));
  const englishStreak = (() => {
    const set = new Set(englishDates);
    let streak = 0;
    const cursor = new Date();
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (set.has(key)) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (streak === 0) {
        if (key === today) {
          cursor.setDate(cursor.getDate() - 1);
          continue;
        }
        break;
      } else break;
      if (streak > 1000) break;
    }
    return streak;
  })();

  const leadsDue = leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= today && !["WON", "LOST"].includes(l.status));

  // Subject progress
  const subjectProgress = subjects.map((s) => {
    const total = s.chapters.length;
    const mastered = s.chapters.filter((c) => c.status === "MASTERED").length;
    const studied = s.chapters.filter((c) => ["STUDIED", "REVISION_REQUIRED", "TEST_PENDING", "MASTERED"].includes(c.status)).length;
    const avgCompletion = total ? Math.round(s.chapters.reduce((a, c) => a + c.completion, 0) / total) : 0;
    return {
      id: s.id,
      name: s.name,
      total,
      mastered,
      studied,
      avgCompletion,
    };
  });

  const overallChapters = chapters.length;
  const overallMastered = chapters.filter((c) => c.status === "MASTERED").length;

  // AI recommendation grounded in real data
  let recommendation: string;
  const topWeak = [...chapters]
    .filter((c) => c.status !== "MASTERED")
    .sort((a, b) => a.confidence - b.confidence || a.completion - b.completion)
    .slice(0, 3);

  const parts: string[] = [];
  if (mistakesDue.length) parts.push(`Review ${mistakesDue.length} mistake(s) due in your notebook — retention decays fast without spaced review.`);
  if (topWeak.length) parts.push(`Your highest-impact study block today is "${topWeak[0].name}" (${topWeak[0].subject.name}) — confidence ${topWeak[0].confidence}/5, ${topWeak[0].completion}% covered.`);
  if (leadsDue.length) parts.push(`${leadsDue.length} freelance follow-up(s) are due — deals die quietly when follow-up slips.`);
  if (!parts.length && pendingToday.length) parts.push(`Clear "${pendingToday[0].title}" first — it is the top open task on your list.`);
  if (!parts.length) recommendation = "Nothing is overdue and your revision queue is clear. Use this margin to go deeper on a chapter you already marked as studied.";
  else recommendation = parts.join(" ");

  const todaysObjective = topWeak[0]
    ? `Push "${topWeak[0].name}" toward mastered`
    : pendingToday[0]
      ? `Complete "${pendingToday[0].title}"`
      : "Maintain streaks and deepen what you have studied";

  const upcoming = [
    ...tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) > today && t.status !== "DONE").map((t) => ({ kind: "Task", title: t.title, date: t.dueAt!.slice(0, 10) })),
    ...chapters.filter((c) => c.nextRevisionAt && c.nextRevisionAt > new Date()).map((c) => ({ kind: "Revision", title: c.name, date: c.nextRevisionAt!.toISOString().slice(0, 10) })),
    ...leads.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt > today).map((l) => ({ kind: "Follow-up", title: l.name, date: l.nextFollowUpAt! })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);

  // Weekly chapter targets: master one Physics + one Chemistry chapter per week.
  const weekStart = dateOffsetISO(-new Date(`${today}T00:00:00`).getDay());
  const weekEnd = dateOffsetISO(6 - new Date(`${today}T00:00:00`).getDay());
  const pickNextChapter = (subjectName: string) => {
    const subj = subjects.find((s) => s.name.toLowerCase().includes(subjectName.toLowerCase()));
    if (!subj) return null;
    const target =
      subj.chapters.find((c) => c.status === "REVISION_REQUIRED") ??
      subj.chapters.find((c) => c.status === "IN_PROGRESS") ??
      subj.chapters.find((c) => c.status === "STUDIED" || c.status === "TEST_PENDING") ??
      subj.chapters.find((c) => c.status === "NOT_STARTED") ??
      subj.chapters[0] ??
      null;
    if (!target) return null;
    return { id: target.id, name: target.name, subject: subj.name, status: target.status, confidence: target.confidence, completion: target.completion };
  };

  const weeklyTargets = [
    { area: "Physics", ...(pickNextChapter("Physics") ?? { id: null, name: null, subject: "Physics", status: null, confidence: null, completion: null }) },
    { area: "Chemistry", ...(pickNextChapter("Chemistry") ?? { id: null, name: null, subject: "Chemistry", status: null, confidence: null, completion: null }) },
  ];

  // Tool recommendations — point at real apps/features based on state.
  const tools: Array<{ title: string; reason: string; href: string }> = [];
  if (mistakesDue.length) tools.push({ title: "Mistake Notebook", reason: `${mistakesDue.length} mistake(s) due for spaced review.`, href: "/mistakes" });
  if (revisionDueChapters.length) tools.push({ title: "Revision Center", reason: `${revisionDueChapters.length} chapter(s) ready to resurface.`, href: "/revision" });
  if (topWeak.length) tools.push({ title: "Study Planner", reason: `Turn "${topWeak[0].name}" into a scheduled study block.`, href: "/planner" });
  if (weeklyTargets.some((t) => t.name)) tools.push({ title: "Study Planner", reason: "Turn this week's chapter targets into daily blocks.", href: "/planner" });
  tools.push({ title: "English Lab", reason: data_englishReason(englishStreak, englishSessions), href: "/english" });
  if (leadsDue.length) tools.push({ title: "Freelance CRM", reason: `${leadsDue.length} follow-up(s) due.`, href: "/freelance" });
  tools.push({ title: "Winter Arc", reason: "Lock in your deep-work season and track the streak.", href: "/winter-arc" });

  function data_englishReason(streak: number, sessions: typeof englishSessions): string {
    if (streak === 0) return "No streak yet — a 5-minute drill starts one.";
    return `${streak}-day speaking streak. Keep it alive with a quick prompt.`;
  }

  return NextResponse.json({
    profile,
    date: today,
    todaysObjective,
    recommendation,
    planItems,
    plannedMinutes,
    actualMinutes,
    sessions,
    pendingTasks: pendingToday.slice(0, 8).map((t) => ({ id: t.id, title: t.title, priority: t.priority, category: t.category, dueAt: t.dueAt })),
    completedTasks: doneToday.slice(0, 8).map((t) => ({ id: t.id, title: t.title })),
    overdueTasks: overdueTasks.slice(0, 8).map((t) => ({ id: t.id, title: t.title, dueAt: t.dueAt?.slice(0, 10), priority: t.priority })),
    subjectProgress,
    overall: { chapters: overallChapters, mastered: overallMastered, completion: pct(overallMastered, overallChapters) },
    weakChapters: topWeak.map((c) => ({ id: c.id, name: c.name, subject: c.subject.name, confidence: c.confidence })),
    revisionDue: [
      ...revisionDueChapters.slice(0, 5).map((c) => ({ id: c.id, title: c.name, kind: "chapter" })),
      ...mistakesDue.slice(0, 5).map((m) => ({ id: m.id, title: m.question.slice(0, 80), kind: "mistake" })),
    ],
    englishStreak,
    englishMinutesToday: englishSessions.filter((s) => s.createdAt.toISOString().slice(0, 10) === today).reduce((s, x) => s + Math.round(x.durationSec / 60), 0),
    leadsDue: leadsDue.map((l) => ({ id: l.id, name: l.name, status: l.status, nextFollowUpAt: l.nextFollowUpAt })),
    habits: habits.map((h) => ({
      id: h.id,
      name: h.name,
      targetPerWeek: h.targetPerWeek,
      doneToday: habitLogs.some((l) => l.habitId === h.id && l.done),
      weekDone: h.logs.filter((l) => l.done && l.date >= dateOffsetISO(-6)).length,
    })),
    upcoming,
    weeklyTargets: { weekStart, weekEnd, targets: weeklyTargets },
    tools: tools.slice(0, 5),
  });
}
