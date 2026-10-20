import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { dateOffsetISO, todayISO } from "@/lib/utils";
import { parseJSON } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const due = sp.get("due") === "1";
  const cards = await db.revisionCard.findMany({
    where: due ? { nextReviewAt: { lte: todayISO() } } : undefined,
    orderBy: { nextReviewAt: "asc" },
    take: 200,
  });

  // Auto-due revisions: chapters flagged REVISION_REQUIRED or past nextRevisionAt
  const endOfToday = new Date(todayISO() + "T23:59:59.999Z");
  const chapters = await db.chapter.findMany({
    where: {
      OR: [{ status: "REVISION_REQUIRED" }, { nextRevisionAt: { lte: endOfToday } }],
    },
    include: { subject: { select: { name: true } } },
  });

  const mistakesDue = await db.mistake.count({ where: { mastered: false, nextReviewAt: { lte: todayISO() } } });
  return NextResponse.json({ cards, chapters, mistakesDue });
}

const createSchema = z.object({
  front: z.string().min(2).max(1000),
  back: z.string().min(2).max(4000),
  chapterId: z.string().nullable().optional(),
  subjectId: z.string().nullable().optional(),
  source: z.enum(["AUTO", "MANUAL"]).default("MANUAL"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid card." }, { status: 400 });
  const card = await db.revisionCard.create({
    data: { ...parsed.data, nextReviewAt: dateOffsetISO(1) },
  });
  return NextResponse.json(card, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      id: z.string().min(1),
      rating: z.enum(["AGAIN", "HARD", "GOOD", "EASY"]),
      delete: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { id, rating, delete: del } = parsed.data;
  if (del) {
    await db.revisionCard.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  const card = await db.revisionCard.findUnique({ where: { id } });
  if (!card) return NextResponse.json({ error: "Card not found." }, { status: 404 });
  const ease = rating === "AGAIN" ? Math.max(1.3, card.ease - 0.2) : rating === "HARD" ? Math.max(1.3, card.ease - 0.15) : rating === "GOOD" ? card.ease : Math.min(3.0, card.ease + 0.15);
  let interval: number;
  if (rating === "AGAIN") interval = 0;
  else if (card.reviews === 0) interval = 1;
  else if (card.reviews === 1) interval = 3;
  else interval = Math.round(card.interval * ease);
  const next = new Date();
  next.setDate(next.getDate() + Math.max(1, interval));
  const updated = await db.revisionCard.update({
    where: { id },
    data: { ease, interval, reviews: { increment: 1 }, nextReviewAt: next.toISOString().slice(0, 10) },
  });
  return NextResponse.json(updated);
}
