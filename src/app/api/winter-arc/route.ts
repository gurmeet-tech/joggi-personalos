import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { parseJSON, todayISO, dateOffsetISO } from "@/lib/utils";

export const dynamic = "force-dynamic";

const DAY_FLAGS = ["lockedIn", "noPhone", "trained", "noJunk", "sleptEarly"] as const;

function scoreDay(d: {
  lockedIn: boolean;
  noPhone: boolean;
  trained: boolean;
  noJunk: boolean;
  sleptEarly: boolean;
  focusMinutes: number;
  dailyTargetMin: number;
}): number {
  const flags = [d.lockedIn, d.noPhone, d.trained, d.noJunk, d.sleptEarly].filter(Boolean).length;
  const flagScore = (flags / 5) * 70;
  const focusScore = d.dailyTargetMin > 0 ? Math.min(1, d.focusMinutes / d.dailyTargetMin) * 30 : 0;
  return Math.round(flagScore + focusScore);
}

const upsertSchema = z.object({
  title: z.string().max(80).optional(),
  mission: z.string().max(600).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  active: z.boolean().optional(),
  commitments: z.array(z.string().max(200)).max(20).optional(),
  nonNegotiables: z.array(z.string().max(200)).max(20).optional(),
  rules: z.array(z.string().max(200)).max(20).optional(),
  dailyTargetMin: z.number().int().min(30).max(1440).optional(),
});

const daySchema = z.object({
  date: z.string().optional(),
  lockedIn: z.boolean().optional(),
  noPhone: z.boolean().optional(),
  trained: z.boolean().optional(),
  noJunk: z.boolean().optional(),
  sleptEarly: z.boolean().optional(),
  focusMinutes: z.number().int().min(0).max(1440).optional(),
  reflection: z.string().max(2000).optional(),
});

export async function GET() {
  const arc = await db.winterArc.findUnique({
    where: { id: "default" },
    include: { days: { orderBy: { date: "asc" } } },
  });

  const totalDays = arc
    ? Math.max(1, Math.round((new Date(arc.endDate).getTime() - new Date(arc.startDate).getTime()) / 86400000) + 1)
    : 0;
  const today = todayISO();
  const elapsed = arc ? Math.min(totalDays, Math.max(0, Math.round((new Date(today).getTime() - new Date(arc.startDate).getTime()) / 86400000) + 1)) : 0;
  const days = arc?.days ?? [];
  const lockedDays = days.filter((d) => d.lockedIn).length;
  const avgScore = days.length ? Math.round(days.reduce((s, d) => s + d.score, 0) / days.length) : 0;
  const streak = (() => {
    const set = new Set(days.filter((d) => d.lockedIn).map((d) => d.date));
    let n = 0;
    let cursor = new Date(today + "T00:00:00");
    for (;;) {
      const key = cursor.toISOString().slice(0, 10);
      if (set.has(key)) {
        n++;
        cursor.setDate(cursor.getDate() - 1);
      } else if (n === 0 && key === today) {
        cursor.setDate(cursor.getDate() - 1);
      } else break;
      if (n > 400) break;
    }
    return n;
  })();

  return NextResponse.json({
    arc: arc
      ? {
          ...arc,
          commitments: parseJSON<string[]>(arc.commitments, []),
          nonNegotiables: parseJSON<string[]>(arc.nonNegotiables, []),
          rules: parseJSON<string[]>(arc.rules, []),
        }
      : null,
    stats: { totalDays, elapsed, remaining: Math.max(0, totalDays - elapsed), lockedDays, avgScore, streak, logged: days.length },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid Winter Arc." }, { status: 400 });
  const d = parsed.data;

  const existing = await db.winterArc.findUnique({ where: { id: "default" } });
  const data = {
    ...(d.title !== undefined ? { title: d.title } : {}),
    ...(d.mission !== undefined ? { mission: d.mission } : {}),
    ...(d.startDate !== undefined ? { startDate: d.startDate } : {}),
    ...(d.endDate !== undefined ? { endDate: d.endDate } : {}),
    ...(d.active !== undefined ? { active: d.active } : {}),
    ...(d.dailyTargetMin !== undefined ? { dailyTargetMin: d.dailyTargetMin } : {}),
    ...(d.commitments !== undefined ? { commitments: JSON.stringify(d.commitments) } : {}),
    ...(d.nonNegotiables !== undefined ? { nonNegotiables: JSON.stringify(d.nonNegotiables) } : {}),
    ...(d.rules !== undefined ? { rules: JSON.stringify(d.rules) } : {}),
  };

  const arc = existing
    ? await db.winterArc.update({ where: { id: "default" }, data })
    : await db.winterArc.create({
        data: {
          id: "default",
          startDate: d.startDate ?? todayISO(),
          endDate: d.endDate ?? dateOffsetISO(90),
          ...data,
        },
      });
  return NextResponse.json({ ok: true, arc: { ...arc, commitments: parseJSON<string[]>(arc.commitments, []), nonNegotiables: parseJSON<string[]>(arc.nonNegotiables, []), rules: parseJSON<string[]>(arc.rules, []) } });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const isDelete = body?.delete === true;
  if (isDelete) {
    await db.winterArc.update({ where: { id: "default" }, data: { active: false } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }

  const parsed = daySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid day." }, { status: 400 });

  const arc = await db.winterArc.findUnique({ where: { id: "default" } });
  if (!arc) return NextResponse.json({ error: "Start a Winter Arc first." }, { status: 400 });

  const date = parsed.data.date ?? todayISO();
  const existing = await db.winterArcDay.findUnique({ where: { arcId_date: { arcId: "default", date } } });

  const flags = {
    lockedIn: parsed.data.lockedIn ?? existing?.lockedIn ?? false,
    noPhone: parsed.data.noPhone ?? existing?.noPhone ?? false,
    trained: parsed.data.trained ?? existing?.trained ?? false,
    noJunk: parsed.data.noJunk ?? existing?.noJunk ?? false,
    sleptEarly: parsed.data.sleptEarly ?? existing?.sleptEarly ?? false,
    focusMinutes: parsed.data.focusMinutes ?? existing?.focusMinutes ?? 0,
    reflection: parsed.data.reflection ?? existing?.reflection ?? "",
  };
  const score = scoreDay({ ...flags, dailyTargetMin: arc.dailyTargetMin });

  const day = await db.winterArcDay.upsert({
    where: { arcId_date: { arcId: "default", date } },
    create: { arcId: "default", date, ...flags, score },
    update: { ...flags, score },
  });
  return NextResponse.json(day);
}
