import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { generateEnglishFeedback } from "@/lib/ai";
import { parseJSON, streakFromDates } from "@/lib/utils";

export const maxDuration = 60;

export async function GET() {
  const sessions = await db.englishSession.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const streak = streakFromDates(sessions.map((s) => s.createdAt.toISOString().slice(0, 10)));
  return NextResponse.json({
    sessions: sessions.map((s) => ({
      ...s,
      metrics: parseJSON(s.metrics, {}),
      feedback: parseJSON(s.feedback, {}),
      corrected: parseJSON(s.corrected, []),
      exercises: parseJSON(s.exercises, []),
    })),
    streak,
  });
}

const createSchema = z.object({
  type: z.enum(["PROMPT", "INTERVIEW", "CONVERSATION", "PRESENTATION", "PRONUNCIATION", "ROLEPLAY"]).default("PROMPT"),
  topic: z.string().min(1).max(200),
  transcript: z.string().max(20000).default(""),
  durationSec: z.number().int().min(0).max(7200).default(0),
  targetAccent: z.string().max(30).default("Indian"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid session data." }, { status: 400 });
  const d = parsed.data;
  if (!d.transcript.trim() && d.durationSec === 0) {
    return NextResponse.json({ error: "Record or type a response before submitting." }, { status: 400 });
  }
  const feedback = await generateEnglishFeedback(d.transcript, d.durationSec, d.topic, d.targetAccent);
  const session = await db.englishSession.create({
    data: {
      type: d.type,
      topic: d.topic,
      transcript: d.transcript,
      durationSec: d.durationSec,
      metrics: JSON.stringify(feedback.metrics),
      feedback: JSON.stringify(feedback),
      corrected: JSON.stringify(feedback.correctedSentences),
      exercises: JSON.stringify(feedback.exercises),
      targetAccent: d.targetAccent,
      isDemo: feedback.isDemo,
    },
  });
  return NextResponse.json({ session: { ...session, metrics: feedback.metrics, feedback, corrected: feedback.correctedSentences, exercises: feedback.exercises } }, { status: 201 });
}
