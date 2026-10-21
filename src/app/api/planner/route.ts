import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateStudyPlan } from "@/lib/ai";
import { parseJSON, todayISO, dateOffsetISO } from "@/lib/utils";

export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const from = req.nextUrl.searchParams.get("from") || todayISO();
  const to = req.nextUrl.searchParams.get("to") || dateOffsetISO(13);
  const plans = await db.studyPlan.findMany({
    where: { date: { gte: from, lte: to } },
    orderBy: { date: "asc" },
    include: { sessions: true },
  });
  const sessions = await db.studySession.findMany({
    where: { date: { gte: from, lte: to } },
    include: { chapter: { select: { name: true, subject: { select: { name: true } } } } },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({
    plans: plans.map((p) => ({ ...p, items: parseJSON(p.items, []) })),
    sessions,
  });
}

const generateSchema = z.object({
  dailyHours: z.number().min(0.5).max(18).optional(),
  days: z.number().int().min(1).max(30).default(7),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid planner request." }, { status: 400 });

  const profile = await db.profile.findUnique({ where: { id: "default" } });
  const subjects = await db.subject.findMany({ include: { chapters: true } });

  const result = await generateStudyPlan({
    subjects: subjects.map((s) => ({
      name: s.name,
      chapters: s.chapters.map((c) => ({
        name: c.name,
        status: c.status,
        confidence: c.confidence,
        nextRevisionAt: c.nextRevisionAt?.toISOString().slice(0, 10) ?? null,
        lastTestScore: c.lastTestScore,
      })),
    })),
    dailyHours: parsed.data.dailyHours ?? profile?.dailyStudyHours ?? 4,
    examDates: profile?.examDates,
    target: profile?.targetMarks,
  });

  // Upsert plan days and create planned sessions
  for (const day of result.days.slice(0, parsed.data.days)) {
    const plannedMinutes = day.totalMinutes;
    const existing = await db.studyPlan.findFirst({ where: { date: day.date } });
    const itemsJson = JSON.stringify(day.items);
    if (existing) {
      await db.studyPlan.update({ where: { id: existing.id }, data: { items: itemsJson, plannedMinutes } });
    } else {
      await db.studyPlan.create({ data: { date: day.date, items: itemsJson, plannedMinutes } });
    }
    for (const item of day.items.filter((i) => i.type !== "BREAK")) {
      const subject = subjects.find((s) => s.name === item.subject);
      const chapter = subject?.chapters.find((c) => c.name === item.chapter);
      await db.studySession.create({
        data: {
          date: day.date,
          subjectId: subject?.id,
          chapterId: chapter?.id,
          type: item.type,
          plannedMinutes: item.minutes,
          title: item.title,
        },
      });
    }
  }
  return NextResponse.json(result, { status: 201 });
}

const patchSchema = z.object({
  date: z.string().min(8),
  itemId: z.string().min(1),
  action: z.enum(["complete", "skip", "remove", "reschedule"]),
  newDate: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { date, itemId, action, newDate } = parsed.data;
  const plan = await db.studyPlan.findFirst({ where: { date } });
  if (!plan) return NextResponse.json({ error: "No plan for that date." }, { status: 404 });
  const items = parseJSON<Array<Record<string, unknown>>>(plan.items, []);
  const idx = items.findIndex((i) => i.id === itemId);
  if (idx === -1) return NextResponse.json({ error: "Plan item not found." }, { status: 404 });

  if (action === "remove") items.splice(idx, 1);
  else if (action === "complete") {
    items[idx] = { ...items[idx], completed: true };
    const item = items[idx] as { subject?: string; chapter?: string; minutes?: number };
    if (item.chapter && item.subject) {
      const chapter = await db.chapter.findFirst({
        where: { name: item.chapter, subject: { is: { name: item.subject } } },
      });
      if (chapter) {
        await db.chapter.update({
          where: { id: chapter.id },
          data: {
            lastStudiedAt: new Date(),
            status: chapter.status === "MASTERED" ? "MASTERED" : "STUDIED",
            completion: Math.max(chapter.completion, 70),
            nextRevisionAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          },
        });
        await db.studySession.updateMany({
          where: { date, chapterId: chapter.id, completed: false },
          data: { completed: true, actualMinutes: Number(item.minutes) || 60 },
        });
      }
    }
  } else if (action === "skip") items[idx] = { ...items[idx], skipped: true };
  else if (action === "reschedule" && newDate) {
    const [item] = items.splice(idx, 1);
    const target = await db.studyPlan.findFirst({ where: { date: newDate } });
    const targetItems = target ? parseJSON<Array<Record<string, unknown>>>(target.items, []) : [];
    targetItems.push({ ...item, id: `${newDate}-${Date.now()}` });
    if (target) await db.studyPlan.update({ where: { id: target.id }, data: { items: JSON.stringify(targetItems) } });
    else await db.studyPlan.create({ data: { date: newDate, items: JSON.stringify(targetItems), plannedMinutes: 0 } });
    await db.studyPlan.update({ where: { id: plan.id }, data: { items: JSON.stringify(items) } });
    return NextResponse.json({ ok: true, moved: true });
  }
  await db.studyPlan.update({ where: { id: plan.id }, data: { items: JSON.stringify(items) } });
  return NextResponse.json({ ok: true });
}
