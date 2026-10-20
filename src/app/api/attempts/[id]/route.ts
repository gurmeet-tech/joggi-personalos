import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJSON } from "@/lib/utils";
import { buildEvaluationResult } from "@/lib/ai";

export const maxDuration = 60;

function serializeAttempt(attempt: NonNullable<Awaited<ReturnType<typeof loadAttempt>>>, revealAnswers: boolean) {
  const questions = attempt.paper.questions.map((q) => ({
    id: q.id,
    number: q.number,
    type: q.type,
    text: q.text,
    options: parseJSON(q.options, []),
    marks: q.marks,
    topics: parseJSON<string[]>(q.topics, []),
    difficulty: q.difficulty,
    choiceGroup: q.choiceGroup,
    ...(revealAnswers ? { answer: q.answer, solution: q.solution, scheme: parseJSON<string[]>(q.scheme, []) } : {}),
  }));
  return {
    id: attempt.id,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    durationMinutes: attempt.durationMinutes,
    strictMode: attempt.strictMode,
    autoSubmitted: attempt.autoSubmitted,
    markedForReview: parseJSON<string[]>(attempt.markedForReview, []),
    visited: parseJSON<string[]>(attempt.visited, []),
    timePerQuestion: parseJSON<Record<string, number>>(attempt.timePerQuestion, {}),
    answers: attempt.answers.map((a) => ({ questionId: a.questionId, response: a.response, savedAt: a.savedAt })),
    score: attempt.score,
    maxScore: attempt.maxScore,
    objectiveScore: attempt.objectiveScore,
    subjectiveScore: attempt.subjectiveScore,
    evaluation: parseJSON(attempt.evaluation, null),
    paper: {
      id: attempt.paper.id,
      title: attempt.paper.title,
      mode: attempt.paper.mode,
      totalMarks: attempt.paper.totalMarks,
      durationMinutes: attempt.paper.durationMinutes,
      instructions: parseJSON<string[]>(attempt.paper.instructions, []),
      markingScheme: parseJSON(attempt.paper.markingScheme, {}),
      subjectName: attempt.paper.subject?.name ?? "General",
      isDemo: attempt.paper.isDemo,
      questions,
    },
  };
}

async function loadAttempt(id: string) {
  return db.examAttempt.findUnique({
    where: { id },
    include: {
      answers: true,
      paper: { include: { questions: { orderBy: { number: "asc" } }, subject: true } },
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const attempt = await loadAttempt(params.id);
  if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  const done = attempt.status === "SUBMITTED" || attempt.status === "EVALUATED";
  return NextResponse.json(serializeAttempt(attempt, done));
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as string;
  const attempt = await loadAttempt(params.id);
  if (!attempt) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

  if (action === "start") {
    if (attempt.status === "SUBMITTED" || attempt.status === "EVALUATED") {
      return NextResponse.json({ error: "This attempt is already submitted." }, { status: 409 });
    }
    const updated = await db.examAttempt.update({
      where: { id: params.id },
      data: { status: "IN_PROGRESS", startedAt: attempt.startedAt ?? new Date(), strictMode: body.strictMode ?? attempt.strictMode },
    });
    return NextResponse.json({ id: updated.id, startedAt: updated.startedAt, status: updated.status });
  }

  if (action === "save") {
    if (attempt.status !== "IN_PROGRESS") {
      return NextResponse.json({ error: "Attempt is not in progress." }, { status: 409 });
    }
    const { questionId, response } = body as { questionId?: string; response?: string };
    if (!questionId) return NextResponse.json({ error: "questionId is required." }, { status: 400 });
    await db.examAttemptAnswer.upsert({
      where: { attemptId_questionId: { attemptId: params.id, questionId } },
      create: { attemptId: params.id, questionId, response: String(response ?? "") },
      update: { response: String(response ?? ""), savedAt: new Date() },
    });
    return NextResponse.json({ ok: true, savedAt: new Date() });
  }

  if (action === "progress") {
    if (attempt.status !== "IN_PROGRESS") return NextResponse.json({ ok: true });
    const patch: Record<string, unknown> = {};
    if (Array.isArray(body.markedForReview)) patch.markedForReview = JSON.stringify(body.markedForReview);
    if (Array.isArray(body.visited)) patch.visited = JSON.stringify(body.visited);
    if (body.timePerQuestion && typeof body.timePerQuestion === "object") patch.timePerQuestion = JSON.stringify(body.timePerQuestion);
    if (Object.keys(patch).length) await db.examAttempt.update({ where: { id: params.id }, data: patch });
    return NextResponse.json({ ok: true });
  }

  if (action === "submit") {
    if (attempt.status === "SUBMITTED" || attempt.status === "EVALUATED") {
      return NextResponse.json({ error: "Already submitted." }, { status: 409 });
    }
    // Persist any batched answers first
    if (Array.isArray(body.answers)) {
      for (const a of body.answers as Array<{ questionId: string; response: string }>) {
        if (!a?.questionId) continue;
        await db.examAttemptAnswer.upsert({
          where: { attemptId_questionId: { attemptId: params.id, questionId: a.questionId } },
          create: { attemptId: params.id, questionId: a.questionId, response: String(a.response ?? "") },
          update: { response: String(a.response ?? ""), savedAt: new Date() },
        });
      }
    }
    const fresh = await loadAttempt(params.id);
    if (!fresh) return NextResponse.json({ error: "Attempt not found." }, { status: 404 });

    const responses: Record<string, string> = {};
    for (const a of fresh.answers) responses[a.questionId] = a.response;

    const evaluation = await buildEvaluationResult(
      fresh.paper.questions.map((q) => ({
        id: q.id,
        number: q.number,
        type: q.type,
        text: q.text,
        answer: q.answer,
        solution: q.solution,
        scheme: parseJSON<string[]>(q.scheme, []),
        marks: q.marks,
        topics: parseJSON<string[]>(q.topics, []),
      })),
      responses,
      fresh.paper.title
    );

    const updated = await db.examAttempt.update({
      where: { id: params.id },
      data: {
        status: "EVALUATED",
        submittedAt: new Date(),
        autoSubmitted: !!body.autoSubmitted,
        score: evaluation.totalScore,
        objectiveScore: evaluation.objectiveScore,
        subjectiveScore: evaluation.subjectiveScore,
        evaluation: JSON.stringify(evaluation),
      },
    });

    // Persist mistakes + update chapter stats
    const profile = await db.profile.findUnique({ where: { id: "default" } });
    const revisionDays = profile?.strictMode === false ? 1 : 2;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + revisionDays);

    for (const m of evaluation.mistakes.slice(0, 20)) {
      const q = fresh.paper.questions.find((x) => x.text === m.question);
      const topics = q ? parseJSON<string[]>(q.topics, []) : [];
      const chapter = await db.chapter.findFirst({
        where: {
          subjectId: fresh.paper.subjectId ?? undefined,
          OR: topics.map((t) => ({ name: { contains: t.slice(0, 12) } })),
        },
      });
      await db.mistake.create({
        data: {
          attemptId: fresh.id,
          questionId: q?.id,
          subjectId: fresh.paper.subjectId,
          chapterId: chapter?.id,
          question: m.question.slice(0, 2000),
          myAnswer: m.myAnswer.slice(0, 2000),
          correctAnswer: String(m.correctAnswer).slice(0, 2000),
          reasoning: m.reasoning.slice(0, 4000),
          category: m.category,
          nextReviewAt: nextReview.toISOString().slice(0, 10),
        },
      });
    }

    if (fresh.paper.subjectId) {
      for (const chId of parseJSON<string[]>(fresh.paper.chapterIds, [])) {
        const chapter = await db.chapter.findFirst({ where: { subjectId: fresh.paper.subjectId, name: chId } });
        if (!chapter) continue;
        const chapMistakes = evaluation.mistakes.filter((m) => parseJSON<string[]>(fresh.paper.questions.find((q) => q.text === m.question)?.topics ?? "[]", []).length);
        const pctScore = evaluation.maxScore ? (evaluation.totalScore / evaluation.maxScore) * 100 : 0;
        await db.chapter.update({
          where: { id: chapter.id },
          data: {
            attempts: { increment: 1 },
            lastTestScore: pctScore,
            status: pctScore >= 75 ? "MASTERED" : pctScore >= 50 ? "REVISION_REQUIRED" : "REVISION_REQUIRED",
            confidence: pctScore >= 80 ? 5 : pctScore >= 65 ? 4 : pctScore >= 50 ? 3 : pctScore >= 35 ? 2 : 1,
            nextRevisionAt: nextReview,
            ...(chapMistakes.length ? { weakConcepts: JSON.stringify(Array.from(new Set(evaluation.mistakes.map((m) => m.topic).filter(Boolean))).slice(0, 8)) } : {}),
          },
        });
      }
    }

    const done = await loadAttempt(params.id);
    return NextResponse.json(serializeAttempt(done!, true));
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.examAttempt.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Attempt not found." }, { status: 404 });
  }
}
