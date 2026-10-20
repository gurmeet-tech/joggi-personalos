import { generateDemoPaper } from "./demo-engine";
import { factsForChapter } from "../factbank";
import { CURRICULUM, findSubject } from "../curriculum";
import type {
  EvaluationResult,
  EnglishFeedback,
  FeedbackMetrics,
  GeneratedPaper,
  PaperRequest,
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
      reason: "No AI_API_KEY configured. Papers and feedback are produced by the built-in offline generator (clearly labelled DEMO).",
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
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Paper generation
// ------------------------------------------------------------------

export async function generatePaper(req: PaperRequest): Promise<GeneratedPaper> {
  const status = aiStatus();
  if (status.mode === "live") {
    const syllabus = (req.chapters || [])
      .map((c) => {
        const s = findSubject(req.subject);
        const ch = s?.chapters.find((x) => x.name.toLowerCase() === c.toLowerCase());
        return ch ? `${ch.name}: ${ch.topics.join(", ")}` : c;
      })
      .join("\n");
    const mistakes = (req.previousMistakes || [])
      .slice(0, 10)
      .map((m) => `Q: ${m.question} | Correct: ${m.correctAnswer}`)
      .join("\n");
    const user = `Generate a Class 12 ${process.env.AI_BOARD || "CBSE"} examination paper.
Subject: ${req.subject}
Mode: ${req.mode}
Chapters/syllabus:
${syllabus || "Use standard Class 12 syllabus for this subject"}
Difficulty: ${req.difficulty}
Number of questions: ${req.questionCount}
Question types allowed: ${req.questionTypes.join(", ")}
Duration minutes: ${req.durationMinutes}
Language: ${req.language}
${req.negativeMarking ? "Negative marking: yes, 1/3 deducted per wrong objective answer." : "Negative marking: none."}
${req.weakTopics?.length ? `Prioritise weak topics: ${req.weakTopics.join(", ")}` : ""}
${mistakes ? `Previously answered incorrectly (avoid repeating; can re-test concept):\n${mistakes}` : ""}
${req.materials ? `Ground the paper in this user-provided material:\n${req.materials.slice(0, 6000)}` : ""}

Return JSON: {"title": string, "instructions": string[], "totalMarks": number, "questions": [{"number": number, "type": "MCQ"|"TRUE_FALSE"|"ASSERTION_REASON"|"MATCHING"|"SHORT"|"LONG"|"CASE"|"NUMERICAL"|"DERIVATION", "text": string, "options": [{"id":"a","text":string}], "marks": number, "topics": string[], "difficulty": "easy"|"moderate"|"difficult", "answer": string, "solution": string, "scheme": string[], "choiceGroup": number|null}]}.
Marks must add up to totalMarks. Include an answer, worked solution and marking scheme for every question. No duplicate questions.`;
    const live = await liveChat<GeneratedPaper>(
      "You are a rigorous Class 12 CBSE board examination paper setter. Produce board-appropriate, unambiguous questions with accurate marking schemes. Never invent official board rules; generate academically sound papers.",
      user,
      '{"title","instructions","totalMarks","questions":[...]}'
    );
    if (live?.questions?.length) {
      return { ...live, mode: req.mode, subject: req.subject, chapterNames: req.chapters, difficulty: req.difficulty, questionTypes: live.questions.map((q) => q.type), language: req.language, durationMinutes: req.durationMinutes, markingScheme: { negativeMarking: !!req.negativeMarking, notes: "" }, isDemo: false };
    }
  }
  return generateDemoPaper(req);
}

// ------------------------------------------------------------------
// Objective grading
// ------------------------------------------------------------------

function normalise(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();
}

export function gradeObjective(type: string, answer: string, response: string): boolean {
  const a = normalise(answer);
  const r = normalise(response);
  if (!r) return false;
  if (type === "MATCHING") {
    const parse = (s: string) =>
      s
        .split(/[,;\n]/)
        .map((p) => p.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())
        .filter(Boolean)
        .sort();
    const pa = parse(answer);
    const pr = parse(response);
    if (pa.length !== pr.length) return false;
    return pa.every((x, i) => x === pr[i]);
  }
  if (type === "TRUE_FALSE") {
    const t = r.startsWith("t") ? "true" : r.startsWith("f") ? "false" : r;
    return t === a;
  }
  return a === r;
}

// ------------------------------------------------------------------
// Subjective evaluation
// ------------------------------------------------------------------

export async function evaluateSubjective(
  questions: Array<{ id: string; number: number; type: string; text: string; answer: string; scheme: string[]; marks: number; topics: string[] }>,
  responses: Record<string, string>,
  paperTitle: string
): Promise<{ scores: Record<string, { awarded: number; comment: string }>; isDemo: boolean }> {
  const subjective = questions.filter((q) => !["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING"].includes(q.type) && responses[q.id]?.trim());
  const status = aiStatus();

  if (status.mode === "live" && subjective.length) {
    const payload = subjective.map((q) => ({
      id: q.id,
      question: q.text,
      markingScheme: q.scheme,
      maxMarks: q.marks,
      studentAnswer: responses[q.id],
    }));
    const live = await liveChat<{ evaluations: Array<{ id: string; awarded: number; comment: string }> }>(
      "You are a strict but fair Class 12 board examiner. Award marks only for correct concepts, steps and reasoning as per the marking scheme. Do not award full marks for vague or off-topic answers. Award partial credit where due.",
      `Paper: ${paperTitle}\nEvaluate each answer:\n${JSON.stringify(payload)}`,
      '{"evaluations":[{"id","awarded","comment"}]}',
      0.2
    );
    if (live?.evaluations?.length) {
      const scores: Record<string, { awarded: number; comment: string }> = {};
      for (const e of live.evaluations) {
        const q = subjective.find((x) => x.id === e.id);
        scores[e.id] = { awarded: Math.max(0, Math.min(e.awarded, q?.marks ?? 0)), comment: e.comment };
      }
      return { scores, isDemo: false };
    }
  }

  // Demo evaluation: concept-coverage heuristic against the marking scheme.
  const scores: Record<string, { awarded: number; comment: string }> = {};
  for (const q of subjective) {
    const resp = responses[q.id] || "";
    const words = resp.trim().split(/\s+/).filter(Boolean);
    const respLower = resp.toLowerCase();
    const scheme = q.scheme.length ? q.scheme : [`Address ${q.topics.join(", ")}`];
    let hits = 0;
    const topicWords = q.topics.flatMap((t) => t.toLowerCase().split(/\s+/)).filter((w) => w.length > 3);
    const matchedConcepts = topicWords.filter((w) => respLower.includes(w));
    const conceptCoverage = topicWords.length ? matchedConcepts.length / topicWords.length : 0.5;
    const lengthFactor = Math.min(1, words.length / (q.type === "LONG" ? 80 : q.type === "CASE" ? 60 : 25));
    for (const point of scheme) {
      const key = point.toLowerCase().match(/[a-z]{5,}/g) || [];
      if (key.some((k) => respLower.includes(k))) hits++;
    }
    const schemeHit = scheme.length ? hits / scheme.length : 0.5;
    const raw = 0.45 * conceptCoverage + 0.3 * lengthFactor + 0.25 * schemeHit;
    let awarded = Math.round(raw * q.marks * 2) / 2;
    if (words.length < 4) awarded = Math.min(awarded, 0);
    awarded = Math.max(0, Math.min(awarded, q.marks));
    scores[q.id] = {
      awarded,
      comment:
        words.length < 4
          ? "Answer is too short to award credit. Write at least a full sentence addressing the question."
          : `Demo evaluator: matched ${matchedConcepts.length}/${topicWords.length || 0} key concept terms and ${hits}/${scheme.length} marking-scheme points. Configure an AI key for examiner-grade evaluation.`,
    };
  }
  return { scores, isDemo: true };
}

export async function buildEvaluationResult(
  questions: Array<{ id: string; number: number; type: string; text: string; answer: string; solution: string; scheme: string[]; marks: number; topics: string[] }>,
  responses: Record<string, string>,
  paperTitle: string
): Promise<EvaluationResult> {
  const objectiveTypes = new Set(["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING"]);
  const items: EvaluationResult["items"] = [];
  const topicStats: Record<string, { correct: number; total: number }> = {};
  const mistakes: EvaluationResult["mistakes"] = [];
  let objectiveScore = 0;
  let objectiveMax = 0;
  let subjectiveScore = 0;
  let subjectiveMax = 0;

  const subjectiveQs = questions.filter((q) => !objectiveTypes.has(q.type));
  const { scores, isDemo } = await evaluateSubjective(
    subjectiveQs.map((q) => ({ id: q.id, number: q.number, type: q.type, text: q.text, answer: q.answer, scheme: q.scheme, marks: q.marks, topics: q.topics })),
    responses,
    paperTitle
  );

  for (const q of questions) {
    const resp = (responses[q.id] || "").trim();
    for (const t of q.topics) {
      topicStats[t] = topicStats[t] || { correct: 0, total: 0 };
      topicStats[t].total += 1;
    }
    if (objectiveTypes.has(q.type)) {
      objectiveMax += q.marks;
      const correct = gradeObjective(q.type, q.answer, resp);
      if (correct) {
        objectiveScore += q.marks;
        q.topics.forEach((t) => (topicStats[t].correct += 1));
      } else {
        if (resp) {
          mistakes.push({
            question: q.text,
            myAnswer: resp,
            correctAnswer: q.answer,
            reasoning: q.solution,
            category: !resp ? "NOT_STUDIED" : "CONCEPT_GAP",
            topic: q.topics[0] || "",
          });
        }
      }
      items.push({
        questionId: q.id,
        number: q.number,
        awarded: correct ? q.marks : 0,
        maxMarks: q.marks,
        correct,
        comment: correct ? "Correct." : resp ? "Incorrect — review the solution below." : "Left unanswered.",
        modelAnswer: q.answer,
        scheme: q.scheme,
        kind: "objective",
      });
    } else {
      subjectiveMax += q.marks;
      const s = scores[q.id] || { awarded: 0, comment: "No answer provided." };
      subjectiveScore += s.awarded;
      if (s.awarded > q.marks * 0.6) q.topics.forEach((t) => (topicStats[t].correct += 1));
      if (s.awarded < q.marks * 0.5) {
        mistakes.push({
          question: q.text,
          myAnswer: resp || "(unanswered)",
          correctAnswer: q.answer,
          reasoning: q.solution,
          category: !resp ? "NOT_STUDIED" : "CONCEPT_GAP",
          topic: q.topics[0] || "",
        });
      }
      items.push({
        questionId: q.id,
        number: q.number,
        awarded: s.awarded,
        maxMarks: q.marks,
        correct: null,
        comment: s.comment,
        modelAnswer: q.answer,
        scheme: q.scheme,
        kind: "subjective",
      });
    }
  }

  const ranked = Object.entries(topicStats).map(([topic, s]) => ({ topic, ...s, pct: s.total ? s.correct / s.total : 0 }));
  const strongest = ranked.filter((r) => r.pct >= 0.7).sort((a, b) => b.pct - a.pct).slice(0, 5).map((r) => r.topic);
  const weakest = ranked.filter((r) => r.pct < 0.7).sort((a, b) => a.pct - b.pct).slice(0, 5).map((r) => r.topic);
  const totalScore = objectiveScore + subjectiveScore;
  const maxScore = objectiveMax + subjectiveMax;
  const pctScore = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;

  const summary =
    `Scored ${totalScore}/${maxScore} (${pctScore}%). ` +
    `Objective accuracy: ${objectiveScore}/${objectiveMax}. ` +
    `Subjective (estimated): ${subjectiveScore}/${subjectiveMax}` +
    (isDemo ? " — estimated by the offline demo evaluator; configure an AI key for examiner-grade marking." : " — evaluated against the marking scheme.") +
    (strongest.length ? ` Strongest: ${strongest.join(", ")}.` : "") +
    (weakest.length ? ` Focus next on: ${weakest.join(", ")}.` : "");

  return {
    items,
    objectiveScore,
    objectiveMax,
    subjectiveScore,
    subjectiveMax,
    totalScore,
    maxScore,
    strongest,
    weakest,
    mistakes,
    summary,
    isDemo,
  };
}

// ------------------------------------------------------------------
// Study plan
// ------------------------------------------------------------------

export interface PlanContext {
  subjects: Array<{ name: string; chapters: Array<{ name: string; status: string; confidence: number; nextRevisionAt?: string | null; lastTestScore?: number | null }> }>;
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
      "You are an expert Class 12 study coach. Build realistic day-by-day study plans using active recall, spaced revision and mock tests. Never schedule more hours than available.",
      `Context: ${JSON.stringify(ctx)}. Produce a ${days}-day plan with items: {"days":[{"date","items":[{"id","title","subject","chapter","type":"LEARN"|"PRACTICE"|"REVISION"|"MOCK"|"ENGLISH"|"BREAK","minutes","reason"}],"totalMinutes"}],"rationale":string}`,
      '{"days":[...],"rationale":string}'
    );
    if (live?.days?.length) return { ...live, isDemo: false };
  }

  // Demo planner: prioritise weak/overdue chapters, space revisions, fit daily hours.
  const flat: Array<{ subject: string; chapter: string; status: string; confidence: number; score: number | null; revision: string | null }> = [];
  for (const s of ctx.subjects) {
    for (const c of s.chapters) {
      flat.push({ subject: s.name, chapter: c.name, status: c.status, confidence: c.confidence, score: c.lastTestScore ?? null, revision: c.nextRevisionAt ?? null });
    }
  }
  const today = todayISO();
  const priority = (a: typeof flat[number]) => {
    let p = 0;
    if (a.status === "NOT_STARTED") p += 40;
    if (a.status === "IN_PROGRESS") p += 30;
    if (a.status === "REVISION_REQUIRED") p += 35;
    if (a.status === "TEST_PENDING") p += 25;
    if (a.confidence <= 2) p += 20;
    if (a.score != null && a.score < 50) p += 25;
    if (a.revision && a.revision <= today) p += 30;
    return -p;
  };
  const sorted = [...flat].sort((a, b) => priority(a) - priority(b));
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
    while (remaining >= 25 && cursor < sorted.length * 2) {
      const entry = sorted[cursor % sorted.length];
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
          : entry.score != null && entry.score < 50
            ? `Last test score was ${entry.score}%. Targeted practice will close the gap.`
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
        id: `${date}-mock`,
        title: "Timed mock test on this week's chapters",
        type: "MOCK",
        minutes: Math.min(60, Math.max(30, perDayMinutes / 3)),
        reason: "Weekly retrieval practice reveals weak spots before the board exam.",
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
    rationale: `Prioritised by syllabus gap, confidence and recent test scores across ${flat.length} chapters. Each day fits your ${ctx.dailyHours}h availability with built-in revision spacing and a weekly mock. Re-run the planner after missed sessions or new test results.`,
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
  subjects: Array<{ name: string; chapters: number; mastered: number; avgScore: number | null }>;
  todayTasks: Array<{ title: string; status: string; priority: string }>;
  overdue: Array<{ title: string; dueAt: string }>;
  recentResults: Array<{ title: string; score: number; max: number; date: string }>;
  revisionDue: string[];
  leadsDue: Array<{ name: string; status: string; nextFollowUpAt: string }>;
  englishStreak: number;
  studyMinutesToday: number;
}

export async function assistantReply(
  history: Array<{ role: string; content: string }>,
  ctx: AssistantContext
): Promise<{ reply: string; isDemo: boolean }> {
  const lastUser = [...history].reverse().find((m) => m.role === "user")?.content?.toLowerCase() || "";

  // Deterministic local intents (work in both modes; instant and data-grounded).
  if (/weakest|weak chapters|bad at/.test(lastUser)) {
    const weakish = ctx.subjects
      .flatMap((s) => Array.from({ length: 1 }, () => ({ name: s.name, avg: s.avgScore, mastered: s.mastered, chapters: s.chapters })))
      .filter((s) => s.avg != null && (s.avg as number) < 60);
    if (weakish.length) {
      return {
        reply: `Based on your saved test results, your weakest areas are: ${weakish.map((s) => `${s.name} (avg ${Math.round(s.avg as number)}%, ${s.mastered}/${s.chapters} chapters mastered)`).join("; ")}. Generate a weak-area test from the AI Exam Studio, or ask me to draft a 7-day revision plan.`,
        isDemo: true,
      };
    }
    return { reply: "I don't yet have test results showing a weak subject. Take a chapter test in the AI Exam Studio and I'll track your weak areas from there.", isDemo: true };
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
    const results = ctx.recentResults.slice(0, 5);
    const avg = results.length ? Math.round(results.reduce((s, r) => s + (r.max ? (r.score / r.max) * 100 : 0), 0) / results.length) : null;
    return {
      reply: `This period: ${results.length} exam attempt(s) recorded${avg != null ? ` with an average of ${avg}%` : ""}. English speaking streak: ${ctx.englishStreak} day(s). ${ctx.subjects.filter((s) => s.mastered > 0).map((s) => `${s.name}: ${s.mastered} chapters mastered`).join("; ") || "No chapters marked mastered yet — pick one high-priority chapter and push it to mastered this week."}`,
      isDemo: true,
    };
  }

  const status = aiStatus();
  if (status.mode === "live") {
    const live = await liveChat<{ reply: string }>(
      "You are the MY OS personal assistant for a Class 12 student. Use ONLY the provided workspace context. Never invent data. Be concise, specific and action-oriented. You may propose creating tasks, tests or plans but must ask for confirmation before creating anything.",
      `Context: ${JSON.stringify(ctx)}\n\nConversation:\n${history.map((m) => `${m.role}: ${m.content}`).join("\n")}`,
      '{"reply":string}'
    );
    if (live?.reply) return { reply: live.reply, isDemo: false };
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

export { CURRICULUM };
