import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  subjectId: z.string().min(1),
  name: z.string().min(1).max(120),
  topics: z.array(z.string().min(1).max(120)).max(40).optional(),
});

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId") || undefined;
  const chapters = await db.chapter.findMany({
    where: subjectId ? { subjectId } : undefined,
    orderBy: [{ subjectId: "asc" }, { order: "asc" }],
    include: { topics: true },
  });
  return NextResponse.json(chapters);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid chapter data." }, { status: 400 });
  const subject = await db.subject.findUnique({ where: { id: parsed.data.subjectId } });
  if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  const count = await db.chapter.count({ where: { subjectId: parsed.data.subjectId } });
  const chapter = await db.chapter.create({
    data: {
      subjectId: parsed.data.subjectId,
      name: parsed.data.name.trim(),
      order: count,
      topics: parsed.data.topics?.length ? { create: parsed.data.topics.map((name) => ({ name })) } : undefined,
    },
    include: { topics: true },
  });
  return NextResponse.json(chapter, { status: 201 });
}
