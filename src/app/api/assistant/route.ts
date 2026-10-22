import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { assistantReply, type AssistantContext } from "@/lib/ai";
import { factsForChapter, searchFacts } from "@/lib/factbank";
import { parseJSON, todayISO, streakFromDates } from "@/lib/utils";

export const maxDuration = 60;

export async function GET() {
  const messages = await db.assistantMessage.findMany({ orderBy: { createdAt: "asc" }, take: 100 });
  return NextResponse.json(messages);
}

/**
 * Pull verified syllabus facts for whatever the user is talking about.
 * Concept search first ("explain Gauss's law"), then a chapter-name fallback.
 */
function factsForQuery(message: string, chapterNames: string[]): Array<{ chapter: string; facts: string[] }> {
  const conceptHits = searchFacts(message, 24);
  if (conceptHits.length) {
    const groups = new Map<string, string[]>();
    for (const hit of conceptHits) {
      const list = groups.get(hit.chapter) ?? [];
      list.push(`${hit.concept} — ${hit.statement}`);
      groups.set(hit.chapter, list);
    }
    return Array.from(groups.entries()).map(([chapter, facts]) => ({ chapter, facts }));
  }

  const text = message.toLowerCase();
  const out: Array<{ chapter: string; facts: string[] }> = [];
  for (const chapter of chapterNames) {
    const facts = factsForChapter(chapter);
    if (!facts.length) continue;
    const needle = chapter.toLowerCase();
    const mentioned =
      text.includes(needle) ||
      text.includes(needle.split(" and ")[0]) ||
      text.includes(needle.split(" of ")[0]);
    if (mentioned) out.push({ chapter, facts });
    if (out.length >= 3) break;
  }
  return out;
}

async function buildContext(message = ""): Promise<AssistantContext> {
  const today = todayISO();
  const [profile, subjects, tasks, chapters, leads, english] = await Promise.all([
    db.profile.findUnique({ where: { id: "default" } }),
    db.subject.findMany({ include: { chapters: true } }),
    db.task.findMany(),
    db.chapter.findMany({ include: { subject: { select: { name: true } } } }),
    db.freelanceLead.findMany(),
    db.englishSession.findMany({ orderBy: { createdAt: "desc" }, take: 40 }),
  ]);
  const weakChapters = chapters
    .filter((c) => c.status !== "MASTERED")
    .sort((a, b) => a.confidence - b.confidence || a.completion - b.completion)
    .slice(0, 6)
    .map((c) => ({ name: c.name, subject: c.subject.name, confidence: c.confidence, completion: c.completion }));
  const chapterNames = subjects.flatMap((s) => s.chapters.map((c) => c.name));
  return {
    profile: profile ? { name: profile.name, board: profile.board } : undefined,
    subjects: subjects.map((s) => ({
      name: s.name,
      chapters: s.chapters.length,
      mastered: s.chapters.filter((c) => c.status === "MASTERED").length,
      inProgress: s.chapters.filter((c) => c.status === "IN_PROGRESS" || c.status === "STUDIED").length,
    })),
    todayTasks: tasks.filter((t) => !t.dueAt || t.dueAt.slice(0, 10) <= today).map((t) => ({ title: t.title, status: t.status, priority: t.priority })),
    overdue: tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) < today && t.status !== "DONE").map((t) => ({ title: t.title, dueAt: t.dueAt!.slice(0, 10) })),
    weakChapters,
    revisionDue: chapters.filter((c) => c.status === "REVISION_REQUIRED" || (c.nextRevisionAt && c.nextRevisionAt <= new Date())).map((c) => c.name),
    leadsDue: leads
      .filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= today && !["WON", "LOST"].includes(l.status))
      .map((l) => ({ name: l.name, status: l.status, nextFollowUpAt: l.nextFollowUpAt! })),
    englishStreak: streakFromDates(english.map((s) => s.createdAt.toISOString().slice(0, 10))),
    studyMinutesToday: 0,
    facts: factsForQuery(message, chapterNames),
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      message: z.string().min(1).max(2000),
      deep: z.boolean().optional(),
      history: z
        .array(z.object({ role: z.string(), content: z.string().max(4000) }))
        .max(40)
        .optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Message is required." }, { status: 400 });

  await db.assistantMessage.create({ data: { role: "user", content: parsed.data.message } });

  // Each chat sends its own transcript so separate threads never share context.
  // An empty array is meaningful (a brand-new thread) — only fall back to the
  // stored log when the client sent no history at all.
  const history =
    parsed.data.history !== undefined
      ? [...parsed.data.history, { role: "user", content: parsed.data.message }]
      : (await db.assistantMessage.findMany({ orderBy: { createdAt: "desc" }, take: 40 }))
          .reverse()
          .map((m) => ({ role: m.role, content: m.content }));

  const ctx = await buildContext(parsed.data.message);
  const result = await assistantReply(history, ctx, { deep: parsed.data.deep });
  await db.assistantMessage.create({ data: { role: "assistant", content: result.reply } });
  return NextResponse.json({ reply: result.reply, isDemo: result.isDemo });
}

export async function DELETE() {
  await db.assistantMessage.deleteMany();
  return NextResponse.json({ ok: true });
}
