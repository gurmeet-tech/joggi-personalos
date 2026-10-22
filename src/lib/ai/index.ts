import { factsForChapter } from "../factbank";
import type {
  EnglishFeedback,
  FeedbackMetrics,
  StudyPlanResult,
  PlanItem,
} from "../types";
import { dateOffsetISO, todayISO } from "../utils";

// ------------------------------------------------------------------
// Provider status
// ------------------------------------------------------------------

export interface AiStatus {
  mode: "live" | "demo";
  provider?: string;
  model?: string;
  reason?: string;
}

export function aiStatus(): AiStatus {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) {
    return {
      mode: "demo",
      reason: "No AI_API_KEY configured. Replies and feedback fall back to the built-in offline engine (clearly labelled DEMO).",
    };
  }
  return {
    mode: "live",
    provider: process.env.AI_PROVIDER || "openai",
    model: process.env.AI_MODEL || "gpt-4o-mini",
  };
}

async function liveChat<T>(
  system: string,
  user: string,
  schemaHint: string,
  temperature = Number(process.env.AI_TEMPERATURE ?? 0.4)
): Promise<T | null> {
  const key = process.env.AI_API_KEY?.trim();
  if (!key) return null;
  const base = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "gpt-4o-mini",
        temperature,
        max_tokens: Number(process.env.AI_MAX_TOKENS || 4000),
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: `${system}\n\nRespond ONLY with valid JSON matching this schema hint: ${schemaHint}` },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    return parseModelJson<T>(text);
  } catch {
    return null;
  }
}

/**
 * Models occasionally wrap their JSON in prose or code fences even when asked for
 * bare JSON. Pull the first balanced JSON object out of the response.
 */
function parseModelJson<T>(text: string): T | null {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* fall through to extraction */
  }
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    /* fall through to extraction */
  }
  const start = candidate.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === '"') inString = !inString;
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(candidate.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

// ------------------------------------------------------------------
// Study plan
// ------------------------------------------------------------------

export interface PlanContext {
  subjects: Array<{ name: string; chapters: Array<{ name: string; status: string; confidence: number; nextRevisionAt?: string | null }> }>;
  dailyHours: number;
  examDates?: string | null;
  target?: number | null;
  existingTasks?: Array<{ title: string; dueAt?: string | null }>;
}

export async function generateStudyPlan(ctx: PlanContext): Promise<StudyPlanResult> {
  const status = aiStatus();
  const days = 7;
  if (status.mode === "live") {
    const live = await liveChat<StudyPlanResult>(
      "You are an expert Class 12 study coach. Build realistic day-by-day study plans using active recall and spaced revision. Never schedule more hours than available. RULE: each week must fully master exactly ONE chapter of Physics and ONE chapter of Chemistry — study it, practise it, then schedule a spaced REVISION, so the chapter is destroyed within the week before moving on. Do not scatter across many chapters.",
      `Context: ${JSON.stringify(ctx)}. Produce a ${days}-day plan with items: {"days":[{"date","items":[{"id","title","subject","chapter","type":"LEARN"|"PRACTICE"|"REVISION"|"ENGLISH"|"BREAK","minutes","reason"}],"totalMinutes"}],"rationale":string}. Focus the week on mastering one Physics and one Chemistry chapter end to end.`,
      '{"days":[...],"rationale":string}'
    );
    if (live?.days?.length) return { ...live, isDemo: false };
  }

  // Demo planner: prioritise weak/overdue chapters, space revisions, fit daily hours.
  const flat: Array<{ subject: string; chapter: string; status: string; confidence: number; revision: string | null }> = [];
  for (const s of ctx.subjects) {
    for (const c of s.chapters) {
      flat.push({ subject: s.name, chapter: c.name, status: c.status, confidence: c.confidence, revision: c.nextRevisionAt ?? null });
    }
  }
  const today = todayISO();
  const priority = (a: typeof flat[number]) => {
    let p = 0;
    if (a.status === "NOT_STARTED") p += 40;
    if (a.status === "IN_PROGRESS") p += 30;
    if (a.status === "REVISION_REQUIRED") p += 35;
    if (a.status === "STUDIED") p += 15;
    if (a.confidence <= 2) p += 20;
    if (a.revision && a.revision <= today) p += 30;
    return -p;
  };
  const sorted = [...flat].sort((a, b) => priority(a) - priority(b));
  // Weekly mastery focus: one Physics chapter + one Chemistry chapter, destroyed this week.
  const focusSubjects = ["physics", "chemistry"];
  const focus: typeof sorted = [];
  for (const name of focusSubjects) {
    const match = sorted.find((c) => c.subject.toLowerCase().includes(name) && !focus.includes(c));
    if (match) focus.push(match);
  }
  const workingSet = focus.length ? focus : sorted.slice(0, 2);
  const perDayMinutes = Math.max(60, Math.round((ctx.dailyHours || 4) * 60));
  const planDays: StudyPlanResult["days"] = [];
  let cursor = 0;
  for (let d = 0; d < days; d++) {
    const date = dateOffsetISO(d);
    const items: PlanItem[] = [];
    let remaining = perDayMinutes;
    if (items.length === 0 && remaining >= 25) {
      // warm-up recall of a previous chapter
    }
    while (remaining >= 25 && cursor < workingSet.length * 4) {
      const entry = workingSet[cursor % workingSet.length];
      cursor++;
      const isRevision = d >= 2 && cursor % 4 === 0;
      const type: PlanItem["type"] = isRevision ? "REVISION" : entry.status === "NOT_STARTED" ? "LEARN" : "PRACTICE";
      const minutes = Math.min(remaining, isRevision ? 30 : 45);
      items.push({
        id: `${date}-${cursor}`,
        title: `${isRevision ? "Revise" : type === "LEARN" ? "Learn" : "Practice"} ${entry.chapter}`,
        subject: entry.subject,
        chapter: entry.chapter,
        type,
        minutes,
        reason: isRevision
          ? "Spaced revision to move this chapter into long-term memory."
          : entry.confidence <= 2
            ? `Confidence is low (${entry.confidence}/5). Focused session will raise it.`
            : "Not yet completed — scheduled early to stay ahead of exams.",
      });
      remaining -= minutes + 5;
      if (remaining >= 25 && items.length % 3 === 2) {
        items.push({ id: `${date}-break-${items.length}`, title: "Break", type: "BREAK", minutes: Math.min(15, remaining), reason: "Short break to sustain focus." });
        remaining -= 15;
      }
    }
    if (d === 3 || d === 6) {
      items.push({
        id: `${date}-recall`,
        title: `Recall check — this week's ${workingSet.map((c) => c.chapter).join(" + ")}`,
        type: "PRACTICE",
        minutes: Math.min(60, Math.max(30, perDayMinutes / 3)),
        reason: "Close the notebook and write everything you remember about the chapter — recall is what proves mastery.",
      });
    }
    items.push({
      id: `${date}-english`,
      title: "15-minute English speaking drill",
      type: "ENGLISH",
      minutes: 15,
      reason: "Daily speaking practice compounds fluency faster than weekly massed practice.",
    });
    planDays.push({ date, items, totalMinutes: items.reduce((s, i) => s + i.minutes, 0) });
  }

  return {
    days: planDays,
    rationale: `Prioritised by syllabus gap, confidence and revision schedule across ${flat.length} chapters. Each day fits your ${ctx.dailyHours}h availability with built-in revision spacing and a weekly recall check. Re-run the planner after missed sessions or new study data.`,
    isDemo: true,
  };
}

// ------------------------------------------------------------------
// English feedback
// ------------------------------------------------------------------

const FILLERS = /\b(um|uh|erm|like|you know|i mean|basically|actually|literally|so yeah|okay so)\b/gi;

export function analyseTranscript(transcript: string, durationSec: number): FeedbackMetrics {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const fillers = transcript.match(FILLERS)?.length || 0;
  const sentences = transcript.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const unique = new Set(words.map((w) => w.toLowerCase().replace(/[^a-z']/g, "")));
  return {
    durationSec,
    wordCount,
    wpm: durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0,
    fillerCount: fillers,
    pauseCount: (transcript.match(/\.{2,}|…/g)?.length || 0),
    grammarIssues: 0,
    uniqueWordRatio: wordCount ? Math.round((unique.size / wordCount) * 100) / 100 : 0,
    sentences: sentences.length,
  };
}

const GRAMMAR_PATTERNS: Array<{ re: RegExp; fix: (m: string) => string; note: string }> = [
  { re: /\bi am agree\b/i, fix: () => "I agree", note: "'Agree' is a verb — drop 'am'." },
  { re: /\bdidn't went\b/i, fix: () => "didn't go", note: "After 'didn't', use the base form of the verb." },
  { re: /\bhe don't\b/i, fix: (m) => m.replace("don't", "doesn't"), note: "Third-person singular takes 'doesn't'." },
  { re: /\bshe don't\b/i, fix: (m) => m.replace("don't", "doesn't"), note: "Third-person singular takes 'doesn't'." },
  { re: /\bi has\b/i, fix: () => "I have", note: "'I' takes 'have'." },
  { re: /\bmore better\b/i, fix: () => "better", note: "'Better' is already comparative." },
  { re: /\bmost easiest\b/i, fix: () => "easiest", note: "Avoid double comparatives/superlatives." },
  { re: /\bdepend upon\b/i, fix: (m) => m.replace("depend", "depends"), note: "Subject-verb agreement: singular subject takes 'depends'." },
  { re: /\bthe furniture are\b/i, fix: (m) => m.replace("are", "is"), note: "'Furniture' is uncountable and takes a singular verb." },
  { re: /\bone of the (?:boy|girl|student|friend)s? (?:is|are)\b/i, fix: (m) => m.replace(/\bis are\b|\bare\b/, "is"), note: "'One of the …' always takes a singular verb." },
  { re: /\bi am knowing\b/i, fix: () => "I know", note: "'Know' is a stative verb — use simple present." },
  { re: /\bexplain me\b/i, fix: (m) => m.replace("explain me", "explain to me"), note: "'Explain' needs 'to' before the person." },
  { re: /\bdiscuss about\b/i, fix: (m) => m.replace("discuss about", "discuss"), note: "'Discuss' is transitive — no 'about' needed." },
  { re: /\bin nowadays\b/i, fix: () => "nowadays", note: "'Nowadays' does not need 'in'." },
  { re: /\bi will explain you\b/i, fix: () => "I will explain to you", note: "Use 'explain to someone'." },
  { re: /\bwhat is your (?:name|purpose|goal)\b/i, fix: (m) => m, note: "Word order is correct — keep practicing this pattern." },
  { re: /\bi am agree with you\b/i, fix: () => "I agree with you", note: "Drop 'am' before 'agree'." },
];

export async function generateEnglishFeedback(
  transcript: string,
  durationSec: number,
  topic: string,
  accent: string
): Promise<EnglishFeedback> {
  const metrics = analyseTranscript(transcript, durationSec);
  const status = aiStatus();

  if (status.mode === "live") {
    const live = await liveChat<EnglishFeedback>(
      "You are an expert English speaking coach for an Indian Class 12 student. Give honest, encouraging, specific feedback on grammar, vocabulary, fluency, clarity and pronunciation signals available from the transcript. Never invent phonetic measurements you cannot make. Target accent preference is for learning only, never a judgement of intelligence.",
      `Topic: ${topic}. Target accent (optional preference): ${accent}. Duration: ${durationSec}s. Metrics: ${JSON.stringify(metrics)}. Transcript:\n${transcript}`,
      '{"grammarScore","vocabularyScore","fluencyScore","clarityScore","confidenceScore","correctedSentences":[{"original","corrected","note"}],"strengths":[],"improvements":[],"exercises":[{"title","instruction"}],"summary"}',
      0.4
    );
    if (live?.summary) return { ...live, metrics, isDemo: false };
  }

  // Demo feedback: grammar pattern matching + metric-driven coaching.
  const corrected: EnglishFeedback["correctedSentences"] = [];
  const sentences = transcript.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 3);
  for (const s of sentences) {
    for (const p of GRAMMAR_PATTERNS) {
      const m = s.match(p.re);
      if (m) {
        corrected.push({ original: s.trim(), corrected: s.replace(p.re, p.fix(m[0])), note: p.note });
        break;
      }
    }
    if (corrected.length >= 5) break;
  }

  const wpm = metrics.wpm;
  const fluencyScore = wpm === 0 ? 0 : wpm >= 110 && wpm <= 160 ? 90 : wpm >= 80 && wpm <= 180 ? 75 : wpm >= 60 ? 60 : 45;
  const fillerPenalty = Math.min(25, metrics.fillerCount * 5);
  const clarityScore = Math.max(30, 90 - fillerPenalty);
  const vocabScore = Math.min(95, Math.round(50 + metrics.uniqueWordRatio * 60));
  const grammarScore = Math.max(40, 88 - corrected.length * 8);
  const confidenceScore = Math.min(95, Math.round((fluencyScore + clarityScore) / 2 + (metrics.wordCount > 80 ? 8 : 0)));

  const strengths: string[] = [];
  if (metrics.wordCount > 60) strengths.push(`You sustained speech for ${metrics.wordCount} words — good stamina.`);
  if (wpm >= 100 && wpm <= 160) strengths.push(`Speaking rate of ${wpm} wpm sits in the comfortable conversational band (110–160 wpm).`);
  if (metrics.fillerCount <= 2) strengths.push("Very few filler words — your delivery is clean.");
  if (metrics.uniqueWordRatio > 0.55) strengths.push("Healthy vocabulary variety in your responses.");
  if (!strengths.length) strengths.push("You completed the exercise — consistency is what builds fluency.");

  const improvements: string[] = [];
  if (wpm > 0 && wpm < 100) improvements.push(`Your rate was ${wpm} wpm. Aim for 110–160 wpm by linking short phrases without pausing between words.`);
  if (wpm > 175) improvements.push(`At ${wpm} wpm your clarity may drop. Slow down slightly and stress key content words.`);
  if (metrics.fillerCount > 3) improvements.push(`You used ${metrics.fillerCount} filler words. Replace 'um/uh/like' with a silent pause — silence sounds more confident.`);
  const correctedPatterns = Array.from(new Set(corrected.map((c) => c.note)));
  if (corrected.length) improvements.push(`Fix these recurring grammar patterns: ${correctedPatterns.slice(0, 2).join(" ")}`);
  if (!improvements.length) improvements.push("Record another attempt on a harder topic to keep stretching your range.");

  const exercises = [
    { title: "Shadow reading", instruction: `Pick a 2-minute news clip in ${accent} English. Listen to one sentence, pause, and repeat it exactly — matching rhythm and stress. Do 10 sentences.` },
    { title: "Filler detox", instruction: "Speak for 2 minutes on any topic. Every time you feel a filler coming, pause silently for 1 second instead. Repeat until silence feels natural." },
    {
      title: "Structure drill",
      instruction:
        "Answer this prompt in exactly 3 sentences: one opinion, one reason, one example. Structure forces fluency — 'I believe… because… for instance…'.",
    },
  ];

  return {
    metrics,
    grammarScore,
    vocabularyScore: vocabScore,
    fluencyScore,
    clarityScore,
    confidenceScore,
    correctedSentences: corrected,
    strengths,
    improvements,
    exercises,
    summary: `Demo analysis of ${metrics.wordCount} words at ${wpm} wpm with ${metrics.fillerCount} filler words${corrected.length ? ` and ${corrected.length} grammar correction(s)` : ""}. ${strengths[0]} ${improvements[0]} Configure an AI key for deeper examiner-style feedback.`,
    isDemo: true,
  };
}

// ------------------------------------------------------------------
// Personal assistant
// ------------------------------------------------------------------

export interface AssistantContext {
  profile?: { name: string; board: string };
  subjects: Array<{ name: string; chapters: number; mastered: number; inProgress: number }>;
  todayTasks: Array<{ title: string; status: string; priority: string }>;
  overdue: Array<{ title: string; dueAt: string }>;
  weakChapters: Array<{ name: string; subject: string; confidence: number; completion: number }>;
  revisionDue: string[];
  leadsDue: Array<{ name: string; status: string; nextFollowUpAt: string }>;
  englishStreak: number;
  studyMinutesToday: number;
  /** Verified syllabus facts for the chapters the user is asking about. */
  facts?: Array<{ chapter: string; facts: string[] }>;
}

/** The chat UI renders plain text, so strip markdown the model tends to emit. */
function plainText(reply: string): string {
  return reply
    .replace(/```[a-z]*\n?/gi, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

export async function assistantReply(
  history: Array<{ role: string; content: string }>,
  ctx: AssistantContext,
  opts: { deep?: boolean } = {}
): Promise<{ reply: string; isDemo: boolean }> {  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";

  // Deterministic local intents (work in both modes; instant and data-grounded).
  if (/weakest|weak chapters|bad at/.test(lastUser)) {
    const weak = ctx.weakChapters.slice(0, 5);
    if (weak.length) {
      return {
        reply: `Your weakest chapters right now: ${weak.map((c) => `${c.name} (${c.subject}, confidence ${c.confidence}/5, ${c.completion}% covered)`).join("; ")}. Start a focused block on the first one, then ask me to draft a 7-day revision plan.`,
        isDemo: true,
      };
    }
    const behind = ctx.subjects.filter((s) => s.mastered < s.chapters);
    if (behind.length) {
      return {
        reply: `No chapter is flagged weak yet, but these subjects still have unmastered chapters: ${behind.map((s) => `${s.name} (${s.mastered}/${s.chapters} mastered)`).join("; ")}. Ask me to build a 7-day plan around them.`,
        isDemo: true,
      };
    }
    return { reply: "Everything is marked mastered. Tell me what you want to revise deeper and I'll plan it.", isDemo: true };
  }
  if (/overdue|pending tasks|what tasks/.test(lastUser)) {
    if (!ctx.overdue.length) return { reply: "No overdue tasks. Your task list is under control — check the Tasks page to plan what's next.", isDemo: true };
    return { reply: `You have ${ctx.overdue.length} overdue task(s): ${ctx.overdue.slice(0, 5).map((t) => `${t.title} (due ${t.dueAt})`).join("; ")}. Tackle the highest-priority one in your next study block.`, isDemo: true };
  }
  if (/follow.?up|freelance|client|lead/.test(lastUser)) {
    if (!ctx.leadsDue.length) return { reply: "No freelance follow-ups are due right now. Open the Freelance CRM to add new leads or log outreach.", isDemo: true };
    return { reply: `Follow-ups due: ${ctx.leadsDue.map((l) => `${l.name} (${l.status}, due ${l.nextFollowUpAt})`).join("; ")}. I can draft a follow-up message for any of these — just say "draft a follow-up for <name>".`, isDemo: true };
  }
  if (/what should i study|study today|plan my day/.test(lastUser)) {
    const t = ctx.todayTasks.filter((x) => x.status !== "DONE").slice(0, 4);
    const rev = ctx.revisionDue.slice(0, 3);
    const parts: string[] = [];
    if (rev.length) parts.push(`Start with revision due today: ${rev.join(", ")}.`);
    if (t.length) parts.push(`Then work through: ${t.map((x) => x.title).join("; ")}.`);
    parts.push(`You've completed ${Math.round(ctx.studyMinutesToday)} minutes of study so far today.`);
    return { reply: parts.join(" "), isDemo: true };
  }
  if (/summar|week|how am i doing/.test(lastUser)) {
    const mastered = ctx.subjects.filter((s) => s.mastered > 0);
    const behind = ctx.subjects.filter((s) => s.mastered < s.chapters);
    const parts: string[] = [];
    if (mastered.length) parts.push(`Mastered so far: ${mastered.map((s) => `${s.name} ${s.mastered}/${s.chapters}`).join("; ")}.`);
    if (behind.length) parts.push(`Still open: ${behind.map((s) => `${s.name} ${s.mastered}/${s.chapters}`).join("; ")}.`);
    if (ctx.revisionDue.length) parts.push(`Revision due: ${ctx.revisionDue.slice(0, 4).join(", ")}.`);
    if (ctx.overdue.length) parts.push(`${ctx.overdue.length} task(s) overdue.`);
    parts.push(`English speaking streak: ${ctx.englishStreak} day(s).`);
    return { reply: parts.join(" "), isDemo: true };
  }

  const status = aiStatus();
  if (status.mode === "live") {
    const deepNote = opts.deep
      ? " Deep thinking is ON: work through the problem step by step, cross-check the reasoning against the workspace context, then give a short reasoning summary (2 to 4 short lines) before the final answer."
      : "";
    const factNote = ctx.facts?.length
      ? " The VERIFIED_FACTS block contains accurate syllabus facts. Ground any concept explanation in those facts. If the answer is not covered by them, say what you know but mark it as beyond the verified set — never invent a formula, value or definition."
      : "";
    const live = await liveChat<{ reply: string }>(
      "You are the MY OS personal assistant for a Class 12 student. Use ONLY the provided workspace context. Never invent data. Be concise, specific and action-oriented. You may propose creating tasks, sessions or plans but must ask for confirmation before creating anything. Reply in clean plain text only: never use markdown, asterisks, bold, headings or code fences. Keep it short — 2 to 4 sentences for simple answers, or a short numbered list for steps." + deepNote + factNote,
      `Context: ${JSON.stringify(ctx)}\n\n${ctx.facts?.length ? `VERIFIED_FACTS:\n${ctx.facts.map((f) => `${f.chapter}:\n${f.facts.map((x) => `- ${x}`).join("\n")}`).join("\n\n")}\n\n` : ""}Conversation:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
      '{"reply":string}'
    );
    if (live?.reply) return { reply: plainText(live.reply), isDemo: false };
  }

  // Demo fallback: answer straight from the verified fact bank when we have one.
  if (ctx.facts?.length) {
    const block = ctx.facts[0];
    return {
      reply: `From the verified syllabus notes for ${block.chapter}:\n${block.facts.slice(0, 8).map((f) => `- ${f}`).join("\n")}`,
      isDemo: true,
    };
  }

  return {
    reply: `I can help with your Class 12 prep using your saved data. Try asking: "What should I study today?", "Which chapters are weakest?", "Which leads need follow-up?", or "Summarise my week". ${status.mode === "demo" ? "(Running in demo mode — configure AI_API_KEY for open-ended conversations.)" : ""}`,
    isDemo: status.mode === "demo",
  };
}

// ------------------------------------------------------------------
// Freelance assistance
// ------------------------------------------------------------------

export async function freelanceAssist(
  kind: "OUTREACH" | "FOLLOWUP" | "PROPOSAL" | "OBJECTION" | "NEGOTIATION" | "ANALYSIS",
  data: Record<string, unknown>
): Promise<{ text: string; isDemo: boolean }> {
  const status = aiStatus();
  if (status.mode === "live") {
    const live = await liveChat<{ text: string }>(
      "You are a freelance business communication expert helping a Class 12 student who is starting freelancing. Write professional, warm, concise messages. Never send anything automatically; only draft text for the user to review.",
      `Task: ${kind}\nData: ${JSON.stringify(data)}\nReturn {"text": "..."}`,
      '{"text":string}'
    );
    if (live?.text) return { text: live.text, isDemo: false };
  }

  const name = String(data.name || "there");
  const service = String(data.service || "this project");
  const value = data.value ? String(data.value) : "";
  const drafts: Record<string, string> = {
    OUTREACH: `Hi ${name},\n\nI came across your work and thought I could help with ${service}. I specialise in delivering clean, reliable work on time, and I'd love to understand what you need.\n\nWould you be open to a short conversation this week? I can share relevant examples and a clear plan.\n\nBest regards`,
    FOLLOWUP: `Hi ${name},\n\nJust following up on my last message about ${service}. If the timing isn't right, that's completely fine — I'd appreciate a quick note either way so I can plan accordingly.\n\nIf you're still interested, I can send a short proposal outlining scope, timeline and cost${value ? ` (around ${value})` : ""}.\n\nBest regards`,
    PROPOSAL: `Proposal for ${name}\n\nScope: ${service}\nTimeline: to be confirmed after our discussion\nInvestment: ${value || "to be quoted after scoping"}\n\nWhat you get:\n- Clear milestones and regular updates\n- Revisions until the key requirements are met\n- Full handover of deliverables\n\nI'd like to start with a short discovery call to confirm the exact requirements before drafting the final scope.\n\nRegards`,
    OBJECTION: `When a client objects, use this structure:\n1. Acknowledge: "I understand — ${name}'s concern about ${service} is fair."\n2. Reframe: separate price from value; show the cost of NOT solving the problem.\n3. Offer options: reduce scope to fit budget, split into phases, or adjust timeline.\n4. Ask: "Which of these would work best for you?"\n\nNever argue; always give the client a choice.`,
    NEGOTIATION: `Negotiation plan for ${name}:\n- Know your walk-away number before the call.\n- Anchor with your best-case price first, justified by outcomes, not hours.\n- Trade, don't cave: if they push on price, ask for something in return (longer timeline, case-study rights, phased payment).\n- Silence is a tool — after stating your price, stop talking.\n- Close with a written summary of what was agreed.`,
    ANALYSIS: `To understand why deals are lost, log a lost reason for every closed-lost lead, then review monthly:\n- "Price too high" → reposition value or restructure scope.\n- "Went silent" → your follow-up cadence is too weak; add a 3-touch sequence.\n- "Chose competitor" → sharpen your differentiation and testimonials.\n- "No budget" → qualify budget earlier in the conversation.\nAdd a lost reason in the CRM and I'll surface patterns over time.`,
  };
  return { text: drafts[kind] || drafts.OUTREACH, isDemo: true };
}
