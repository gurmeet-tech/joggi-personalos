import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const [profile, subjects, chapters, papers, attempts, tasks, habits, goals, mistakes, cards, english, leads, journal, plans, sessions] =
    await Promise.all([
      db.profile.findUnique({ where: { id: "default" } }),
      db.subject.findMany({ include: { chapters: { include: { topics: true } } } }),
      db.chapter.count(),
      db.examPaper.count(),
      db.examAttempt.findMany({ include: { paper: { select: { title: true } } } }),
      db.task.findMany(),
      db.habit.findMany({ include: { logs: true } }),
      db.goal.findMany(),
      db.mistake.findMany(),
      db.revisionCard.findMany(),
      db.englishSession.findMany(),
      db.freelanceLead.findMany(),
      db.journalEntry.findMany(),
      db.studyPlan.findMany(),
      db.studySession.findMany(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    app: "MY OS",
    profile,
    subjects,
    counts: { chapters, papers, attempts: attempts.length, tasks: tasks.length, habits: habits.length, goals: goals.length, mistakes: mistakes.length, englishSessions: english.length, leads: leads.length, journalEntries: journal.length },
    attempts,
    tasks,
    habits,
    goals,
    mistakes,
    revisionCards: cards,
    englishSessions: english,
    leads,
    journal,
    studyPlans: plans,
    studySessions: sessions,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="my-os-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
