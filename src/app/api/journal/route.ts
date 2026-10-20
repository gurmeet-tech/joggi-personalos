import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { todayISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date") || todayISO();
  const entries = await db.journalEntry.findMany({ orderBy: { createdAt: "desc" }, take: 120 });
  return NextResponse.json(entries.filter((e) => !req.nextUrl.searchParams.get("date") || e.date === date || true));
}

const createSchema = z.object({
  content: z.string().min(1).max(8000),
  date: z.string().optional(),
  mood: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.string().max(30)).max(10).default([]),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Journal entry is required." }, { status: 400 });
  const entry = await db.journalEntry.create({
    data: {
      content: parsed.data.content,
      date: parsed.data.date || todayISO(),
      mood: parsed.data.mood ?? null,
      tags: JSON.stringify(parsed.data.tags),
    },
  });
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });
  await db.journalEntry.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
