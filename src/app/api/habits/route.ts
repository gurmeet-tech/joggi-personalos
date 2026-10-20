import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { todayISO } from "@/lib/utils";

export async function GET() {
  const habits = await db.habit.findMany({
    orderBy: { createdAt: "asc" },
    include: { logs: { where: { date: { gte: new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10) } } } },
  });
  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      name: z.string().min(1).max(100),
      category: z.string().max(30).default("PERSONAL"),
      targetPerWeek: z.number().int().min(1).max(7).default(7),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid habit." }, { status: 400 });
  const habit = await db.habit.create({ data: parsed.data });
  return NextResponse.json(habit, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      habitId: z.string().min(1),
      date: z.string().optional(),
      done: z.boolean().optional(),
      name: z.string().min(1).max(100).optional(),
      targetPerWeek: z.number().int().min(1).max(7).optional(),
      delete: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { habitId, date, done, name, targetPerWeek, delete: del } = parsed.data;

  if (del) {
    await db.habit.delete({ where: { id: habitId } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  if (name || targetPerWeek) {
    await db.habit.update({
      where: { id: habitId },
      data: { ...(name ? { name } : {}), ...(targetPerWeek ? { targetPerWeek } : {}) },
    });
  }
  if (date !== undefined && done !== undefined) {
    await db.habitLog.upsert({
      where: { habitId_date: { habitId, date: date || todayISO() } },
      create: { habitId, date: date || todayISO(), done },
      update: { done },
    });
  }
  return NextResponse.json({ ok: true });
}
