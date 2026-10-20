import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { assistantReply, type AssistantContext } from "@/lib/ai";
import { parseJSON, todayISO, streakFromDates } from "@/lib/utils";

export async function GET() {
  const messages = await db.assistantMessage.findMany({ orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json(messages);
}

async function buildContext(): Promise<AssistantContext> {
  const today = todayISO();
  const [profile, subjects, tasks, attempts, chapters, leads, english] = await Promise.all([
    db.profile.findUnique({ where: { id: "default" } }),
    db.subject.findMany({ include: { chapters: true } }),
    db.task.findMany(),
    db.examAttempt.findMany({
      where: { status: { in: ["SUBMITTED", "EVALUATED"] } },
      orderBy: { submittedAt: "desc" },
      include: { paper: { select: { title: true, totalMarks: true, subject: { select: { name: true } } } } },
      take: 10,
    }),
    db.chapter.findMany({ include: { subject: { select: { name: true } } } }),
    db.freelanceLead.findMany(),
    db.englishSession.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  return {
    profile: profile ? { name: profile.name, board: profile.board } : undefined,
    subjects: subjects.map((s) => ({
      name: s.name,
      chapters: s.chapters.length,
      mastered: s.chapters.filter((c) => c.status === "MASTERED").length,
      avgScore: s.chapters.filter((c) => c.lastTestScore != null).length
        ? Math.round(s.chapters.filter((c) => c.lastTestScore != null).reduce((a, c) => a + (c.lastTestScore as number), 0) / s.chapters.filter((c) => c.lastTestScore != null).length)
        : null,
    })),
    todayTasks: tasks.filter((t) => !t.dueAt || t.dueAt.slice(0, 10) <= today).map((t) => ({ title: t.title, status: t.status, priority: t.priority })),
    overdue: tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) < today && t.status !== "DONE").map((t) => ({ title: t.title, dueAt: t.dueAt!.slice(0, 10) })),
    recentResults: attempts.map((a) => ({
      title: a.paper.title,
      score: a.score ?? 0,
      max: a.maxScore,
      date: a.submittedAt?.toISOString().slice(0, 10) ?? "",
    })),
    revisionDue: chapters.filter((c) => c.status === "REVISION_REQUIRED" || (c.nextRevisionAt && c.nextRevisionAt <= new Date())).map((c) => c.name),
    leadsDue: leads
      .filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= today && !["WON", "LOST"].includes(l.status))
      .map((l) => ({ name: l.name, status: l.status, nextFollowUpAt: l.nextFollowUpAt! })),
    englishStreak: streakFromDates(english.map((s) => s.createdAt.toISOString().slice(0, 10))),
    studyMinutesToday: 0,
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z.object({ message: z.string().min(1).max(2000) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  await db.assistantMessage.create({ data: { role: "user", content: parsed.data.message } });
  const history = await db.assistantMessage.findMany({ orderBy: { createdAt: "asc" }, take: 40 });
  const ctx = await buildContext();
  const result = await assistantReply(history.map((m) => ({ role: m.role, content: m.content })), ctx);
  await db.assistantMessage.create({ data: { role: "assistant", content: result.reply } });
  return NextResponse.json({ reply: result.reply, isDemo: result.isDemo });
}

export async function DELETE() {
  await db.assistantMessage.deleteMany();
  return NextResponse.json({ ok: true });
}
