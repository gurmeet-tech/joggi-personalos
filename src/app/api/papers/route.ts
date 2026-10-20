import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generatePaper, aiStatus } from "@/lib/ai";
import { z } from "zod";
import type { QuestionType } from "@/lib/types";

const requestSchema = z.object({
  subjectId: z.string().optional(),
  subject: z.string().min(1).max(60),
  chapters: z.array(z.string()).max(40).default([]),
  mode: z.enum(["CHAPTER", "HALF", "FULL", "CUSTOM", "WEAK", "REVISION", "PREVIOUS_YEAR"]),
  difficulty: z.enum(["easy", "moderate", "difficult", "mixed"]).default("mixed"),
  questionCount: z.number().int().min(3).max(40).default(15),
  durationMinutes: z.number().int().min(5).max(360).default(60),
  questionTypes: z.array(z.enum(["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING", "SHORT", "LONG", "CASE", "NUMERICAL", "DERIVATION"])).default([]),
  language: z.string().max(30).default("English"),
  negativeMarking: z.boolean().default(false),
  weakTopics: z.array(z.string()).default([]),
  materials: z.string().max(20000).optional(),
});

export async function GET() {
  const papers = await db.examPaper.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { questions: true, attempts: true } } },
    take: 50,
  });
  return NextResponse.json({ papers, ai: aiStatus() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam configuration.", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  let previousMistakes: Array<{ question: string; correctAnswer: string }> = [];
  if (d.mode === "WEAK" || d.mode === "REVISION") {
    const mistakes = await db.mistake.findMany({
      where: { mastered: false, ...(d.subjectId ? { subjectId: d.subjectId } : {}) },
      take: 15,
      orderBy: { createdAt: "desc" },
    });
    previousMistakes = mistakes.map((m) => ({ question: m.question, correctAnswer: m.correctAnswer }));
    if (d.mode === "WEAK" && !d.weakTopics.length) {
      d.weakTopics = Array.from(new Set(mistakes.map((m) => m.reasoning.slice(0, 60)))).slice(0, 5);
    }
    if (d.mode === "REVISION" && !d.chapters.length && mistakes.length) {
      const chapterIds = Array.from(new Set(mistakes.map((m) => m.chapterId).filter(Boolean))) as string[];
      const chs = await db.chapter.findMany({ where: { id: { in: chapterIds } } });
      d.chapters = chs.map((c) => c.name);
      if (!d.subjectId && chs[0]) d.subjectId = chs[0].subjectId;
    }
  }

  let paper;
  try {
    paper = await generatePaper({
      subject: d.subject,
      chapters: d.chapters,
      mode: d.mode,
      difficulty: d.difficulty,
      questionCount: d.questionCount,
      durationMinutes: d.durationMinutes,
      questionTypes: d.questionTypes as QuestionType[],
      language: d.language,
      negativeMarking: d.negativeMarking,
      weakTopics: d.weakTopics,
      previousMistakes,
      materials: d.materials,
    });
  } catch (e) {
    return NextResponse.json({ error: `Paper generation failed: ${(e as Error).message}` }, { status: 500 });
  }

  const created = await db.examPaper.create({
    data: {
      subjectId: d.subjectId || null,
      title: paper.title,
      mode: paper.mode,
      chapterIds: JSON.stringify(d.chapters),
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

  return NextResponse.json(created, { status: 201 });
}
