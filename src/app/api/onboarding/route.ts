import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { CURRICULUM } from "@/lib/curriculum";

const schema = z.object({
  name: z.string().min(1).max(80),
  board: z.string().max(40).default("CBSE"),
  session: z.string().max(20).default("2025-26"),
  dailyStudyHours: z.number().min(0.5).max(18).default(4),
  targetMarks: z.number().int().min(0).max(100).nullable().optional(),
  englishAccent: z.string().max(30).default("Indian"),
  subjects: z.array(z.string().min(1).max(60)).min(1).max(10),
  usePresetChapters: z.boolean().default(true),
  examDates: z.string().max(2000).nullable().optional(),
  schoolSchedule: z.string().max(2000).nullable().optional(),
  habits: z.array(z.string().min(1).max(100)).max(8).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid onboarding data.", details: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  await db.profile.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      name: d.name,
      board: d.board,
      session: d.session,
      dailyStudyHours: d.dailyStudyHours,
      targetMarks: d.targetMarks ?? null,
      englishAccent: d.englishAccent,
      examDates: d.examDates ?? null,
      schoolSchedule: d.schoolSchedule ?? null,
      onboarded: true,
    },
    update: {
      name: d.name,
      board: d.board,
      session: d.session,
      dailyStudyHours: d.dailyStudyHours,
      targetMarks: d.targetMarks ?? null,
      englishAccent: d.englishAccent,
      examDates: d.examDates ?? null,
      schoolSchedule: d.schoolSchedule ?? null,
      onboarded: true,
    },
  });

  for (let i = 0; i < d.subjects.length; i++) {
    const name = d.subjects[i].trim();
    const existing = await db.subject.findFirst({ where: { name } });
    if (existing) continue;
    const preset = d.usePresetChapters ? CURRICULUM[name] : null;
    await db.subject.create({
      data: {
        name,
        order: i,
        chapters: preset
          ? { create: preset.chapters.map((c, ci) => ({ name: c.name, order: ci, topics: { create: c.topics.map((t) => ({ name: t })) } })) }
          : undefined,
      },
    });
  }

  for (const h of d.habits) {
    const exists = await db.habit.findFirst({ where: { name: h } });
    if (!exists) await db.habit.create({ data: { name: h } });
  }

  return NextResponse.json({ ok: true });
}
