import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { dateOffsetISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where = {
    ...(sp.get("mastered") === "true" ? { mastered: true } : sp.get("mastered") === "false" ? { mastered: false } : {}),
    ...(sp.get("subjectId") ? { subjectId: sp.get("subjectId")! } : {}),
    ...(sp.get("chapterId") ? { chapterId: sp.get("chapterId")! } : {}),
    ...(sp.get("due") === "1" ? { nextReviewAt: { lte: dateOffsetISO(0) } } : {}),
  };
  const mistakes = await db.mistake.findMany({
    where,
    orderBy: [{ mastered: "asc" }, { nextReviewAt: "asc" }, { createdAt: "desc" }],
    include: { chapter: { select: { name: true } } },
    take: 300,
  });
  return NextResponse.json(mistakes);
}

const createSchema = z.object({
  question: z.string().min(3).max(2000),
  myAnswer: z.string().max(2000).default(""),
  correctAnswer: z.string().max(2000).default(""),
  reasoning: z.string().max(4000).default(""),
  category: z.enum(["CONCEPT_GAP", "SILLY_MISTAKE", "TIME_PRESSURE", "NOT_STUDIED", "FORGOTTEN", "CALCULATION"]).default("CONCEPT_GAP"),
  subjectId: z.string().nullable().optional(),
  chapterId: z.string().nullable().optional(),
  nextReviewAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid mistake entry." }, { status: 400 });
  const mistake = await db.mistake.create({
    data: { ...parsed.data, nextReviewAt: parsed.data.nextReviewAt || dateOffsetISO(2) },
  });
  return NextResponse.json(mistake, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      id: z.string().min(1),
      mastered: z.boolean().optional(),
      review: z.boolean().optional(),
      nextReviewAt: z.string().optional(),
      delete: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { id, delete: del, review, ...rest } = parsed.data;
  if (del) {
    await db.mistake.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  if (review) {
    const m = await db.mistake.findUnique({ where: { id } });
    if (!m) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const next = new Date();
    next.setDate(next.getDate() + Math.min(14, 2 * (m.reviewCount + 1)));
    const updated = await db.mistake.update({
      where: { id },
      data: { reviewCount: { increment: 1 }, lastReviewedAt: new Date().toISOString().slice(0, 10), nextReviewAt: next.toISOString().slice(0, 10) },
    });
    return NextResponse.json(updated);
  }
  const updated = await db.mistake.update({ where: { id }, data: rest });
  return NextResponse.json(updated);
}
