import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const subjects = await db.subject.findMany({
    orderBy: { order: "asc" },
    include: { chapters: { orderBy: { order: "asc" }, include: { topics: true } } },
  });
  return NextResponse.json(subjects);
}

const createSchema = z.object({
  name: z.string().min(1).max(60),
  target: z.number().int().min(0).max(100).nullable().optional(),
  chapters: z.array(z.string().min(1).max(120)).max(60).optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid subject data." }, { status: 400 });
  const count = await db.subject.count();
  const subject = await db.subject.create({
    data: {
      name: parsed.data.name.trim(),
      target: parsed.data.target ?? null,
      order: count,
      chapters: parsed.data.chapters?.length
        ? { create: parsed.data.chapters.map((name, i) => ({ name: name.trim(), order: i })) }
        : undefined,
    },
    include: { chapters: { include: { topics: true } } },
  });
  return NextResponse.json(subject, { status: 201 });
}
