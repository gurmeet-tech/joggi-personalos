import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePaper } from "@/lib/ai";

export const maxDuration = 60;

function monthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const label = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  return { start, end, label, lastWeek: now.getDate() >= 24 };
}

export async function GET() {
  const { start, end, label, lastWeek } = monthRange();
  const chapters = await db.chapter.findMany({
    where: { lastStudiedAt: { gte: start, lt: end } },
    include: { subject: { select: { id: true, name: true } } },
    orderBy: { lastStudiedAt: "desc" },
  });
  return NextResponse.json({
    label,
    lastWeek,
    count: chapters.length,
    chapters: chapters.map((c) => ({
      id: c.id,
      name: c.name,
      subject: c.subject.name,
      studiedAt: c.lastStudiedAt,
      status: c.status,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const requestedIds: string[] = Array.isArray(body.chapterIds)
    ? body.chapterIds.filter((id: unknown): id is string => typeof id === "string")
    : [];

  const { start, end, label } = monthRange();
  const chapters = await db.chapter.findMany({
    where: {
      lastStudiedAt: { gte: start, lt: end },
      ...(requestedIds.length ? { id: { in: requestedIds } } : {}),
    },
    include: { subject: { select: { name: true } } },
  });

  if (!chapters.length) {
    return NextResponse.json(
      { error: "Mark at least one chapter done this month before taking the recall test." },
      { status: 400 }
    );
  }

  const questionCount = Math.min(20, Math.max(8, chapters.length * 2));
  const chapterNames = Array.from(new Set(chapters.map((c) => c.name)));

  const paper = await generatePaper({
    subject: `Month-end recall · ${label}`,
    chapters: chapterNames,
    mode: "CUSTOM",
    difficulty: "mixed",
    questionCount,
    durationMinutes: Math.max(10, questionCount),
    questionTypes: ["MCQ"],
    language: "English",
    negativeMarking: false,
    weakTopics: [],
    previousMistakes: [],
  });

  const created = await db.examPaper.create({
    data: {
      title: `Month-end recall · ${label}`,
      mode: "CUSTOM",
      chapterIds: JSON.stringify(chapterNames),
      difficulty: paper.difficulty,
      questionTypes: JSON.stringify(paper.questionTypes),
      language: paper.language,
      durationMinutes: paper.durationMinutes,
      totalMarks: paper.totalMarks,
      markingScheme: JSON.stringify(paper.markingScheme),
      instructions: JSON.stringify(paper.instructions),
      isDemo: paper.isDemo,
      questions: {
        create: paper.questions.map((q) => ({
          number: q.number,
          type: q.type,
          text: q.text,
          options: JSON.stringify(q.options ?? []),
          marks: q.marks,
          topics: JSON.stringify(q.topics ?? []),
          difficulty: q.difficulty,
          answer: q.answer,
          solution: q.solution,
          scheme: JSON.stringify(q.scheme ?? []),
          choiceGroup: q.choiceGroup ?? null,
        })),
      },
    },
    include: { questions: { orderBy: { number: "asc" } } },
  });

  const attempt = await db.examAttempt.create({
    data: {
      paperId: created.id,
      durationMinutes: created.durationMinutes,
      maxScore: created.totalMarks,
      status: "NOT_STARTED",
    },
  });

  return NextResponse.json({ attemptId: attempt.id, paperId: created.id, chapters: chapterNames.length }, { status: 201 });
}
