import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseJSON } from "@/lib/utils";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const paper = await db.examPaper.findUnique({
    where: { id: params.id },
    include: { questions: { orderBy: { number: "asc" } }, subject: true },
  });
  if (!paper) return NextResponse.json({ error: "Paper not found." }, { status: 404 });
  return NextResponse.json({
    ...paper,
    instructions: parseJSON<string[]>(paper.instructions, []),
    markingScheme: parseJSON(paper.markingScheme, {}),
    questions: paper.questions.map((q) => ({
      id: q.id,
      number: q.number,
      type: q.type,
      text: q.text,
      options: parseJSON(q.options, []),
      marks: q.marks,
      topics: parseJSON<string[]>(q.topics, []),
      difficulty: q.difficulty,
      choiceGroup: q.choiceGroup,
    })),
  });
}
