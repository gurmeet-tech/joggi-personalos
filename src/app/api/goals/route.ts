import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const goals = await db.goal.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(goals);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(["SHORT_TERM", "MONTHLY", "LONG_TERM"]).default("SHORT_TERM"),
  category: z.string().max(30).default("PERSONAL"),
  targetValue: z.number().nullable().optional(),
  unit: z.string().max(20).nullable().optional(),
  deadline: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
  const goal = await db.goal.create({
    data: {
      ...parsed.data,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline).toISOString().slice(0, 10) : null,
    },
  });
  return NextResponse.json(goal, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      id: z.string().min(1),
      title: z.string().min(1).max(200).optional(),
      description: z.string().max(2000).nullable().optional(),
      status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]).optional(),
      currentValue: z.number().optional(),
      targetValue: z.number().nullable().optional(),
      deadline: z.string().nullable().optional(),
      delete: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid goal." }, { status: 400 });
  const { id, delete: del, deadline, ...rest } = parsed.data;
  if (del) {
    await db.goal.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  const goal = await db.goal.update({
    where: { id },
    data: { ...rest, ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline).toISOString().slice(0, 10) : null } : {}) },
  });
  return NextResponse.json(goal);
}
