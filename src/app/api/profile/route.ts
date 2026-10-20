import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  board: z.string().max(40).optional(),
  session: z.string().max(20).optional(),
  class: z.string().max(10).optional(),
  targetMarks: z.number().int().min(0).max(100).nullable().optional(),
  dailyStudyHours: z.number().min(0.5).max(18).optional(),
  englishAccent: z.string().max(30).optional(),
  ambienceVideoUrl: z.string().max(500).optional(),
  ambienceVolume: z.number().min(0).max(1).optional(),
  strictMode: z.boolean().optional(),
  defaultDurationMin: z.number().int().min(5).max(360).optional(),
  schoolSchedule: z.string().max(2000).nullable().optional(),
  examDates: z.string().max(2000).nullable().optional(),
  onboarded: z.boolean().optional(),
});

export async function GET() {
  let profile = await db.profile.findUnique({ where: { id: "default" } });
  if (!profile) {
    profile = await db.profile.create({ data: { id: "default" } });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings data.", details: parsed.error.flatten() }, { status: 400 });
  }
  await db.profile.upsert({
    where: { id: "default" },
    create: { id: "default", ...parsed.data },
    update: parsed.data,
  });
  const profile = await db.profile.findUnique({ where: { id: "default" } });
  return NextResponse.json(profile);
}
