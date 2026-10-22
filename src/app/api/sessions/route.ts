import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { todayISO } from "@/lib/utils";

const createSchema = z.object({
  date: z.string().optional(),
  subjectId: z.string().nullable().optional(),
  chapterId: z.string().nullable().optional(),
  type: z.enum(["LEARN", "PRACTICE", "REVISION", "ENGLISH", "BREAK"]).default("LEARN"),
  plannedMinutes: z.number().int().min(1).max(720).default(60),
  actualMinutes: z.number().int().min(0).max(1440),
  title: z.string().max(200).default(""),
  notes: z.string().max(2000).nullable().optional(),
  complete: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || todayISO();
  const to = req.nextUrl.searchParams.get("to") || todayISO();
  const sessions = await db.studySession.findMany({
    where: { date: { gte: from, lte: to } },
    include: { chapter: { select: { name: true, subject: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session." }, { status: 400 });
  const d = parsed.data;
  const session = await db.studySession.create({
    data: {
      date: d.date || todayISO(),
      subjectId: d.subjectId ?? null,
      chapterId: d.chapterId ?? null,
      type: d.type,
      plannedMinutes: d.plannedMinutes,
      actualMinutes: d.actualMinutes,
      completed: d.complete,
      title: d.title,
      notes: d.notes ?? null,
    },
  });
  if (d.complete && d.chapterId) {
    const chapter = await db.chapter.findUnique({ where: { id: d.chapterId } }).catch(() => null);
    if (chapter) {
      await db.chapter.update({
        where: { id: d.chapterId },
        data: {
          lastStudiedAt: new Date(),
          status: chapter.status === "NOT_STARTED" ? "STUDIED" : chapter.status,
        },
      }).catch(() => null);
    }
  }
  const plan = await db.studyPlan.findFirst({ where: { date: session.date } });
  if (plan) {
    await db.studyPlan.update({ where: { id: plan.id }, data: { actualMinutes: { increment: d.actualMinutes || 0 } } });
  }
  return NextResponse.json(session, { status: 201 });
}
