import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const attempts = await db.examAttempt.findMany({
    orderBy: { createdAt: "desc" },
    include: { paper: { select: { title: true, subject: { select: { name: true } }, totalMarks: true, mode: true, durationMinutes: true } } },
    take: 100,
  });
  return NextResponse.json(attempts);
}

export async function POST(req: NextRequest) {
  const { paperId } = await req.json().catch(() => ({}));
  if (!paperId) return NextResponse.json({ error: "paperId is required." }, { status: 400 });
  const paper = await db.examPaper.findUnique({ where: { id: paperId }, include: { questions: true } });
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });

  const existing = await db.examAttempt.findFirst({
    where: { paperId, status: { in: ["NOT_STARTED", "IN_PROGRESS"] } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return NextResponse.json({ ...existing, resuming: existing.status === "IN_PROGRESS" });
  }

  const attempt = await db.examAttempt.create({
    data: { paperId, durationMinutes: paper.durationMinutes, maxScore: paper.totalMarks, status: "NOT_STARTED" },
  });
  return NextResponse.json(attempt, { status: 201 });
}
