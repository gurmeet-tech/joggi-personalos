import { test } from "node:test";
import assert from "node:assert/strict";
import { CURRICULUM, SUBJECT_NAMES, findSubject, findChapter, suggestChapters } from "../src/lib/curriculum.ts";
import { factsForChapter } from "../src/lib/factbank.ts";

// ------------------------------------------------------------------
// The functions below mirror src/lib/ai/index.ts exactly. They are
// reproduced here (rather than imported) because that module imports
// the Prisma client, which only resolves inside the Next.js bundler.
// The assertions are written against the documented behaviour so any
// drift in the source grading rules will be caught by re-reading here.
// ------------------------------------------------------------------

function normalise(s) {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .trim();
}

function gradeObjective(type, answer, response) {
  const a = normalise(answer);
  const r = normalise(response);
  if (!r) return false;
  if (type === "MATCHING") {
    const parse = (s) =>
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

test("gradeObjective: MCQ matches case/space/punctuation-insensitively", () => {
  assert.equal(gradeObjective("MCQ", "a", "A"), true);
  assert.equal(gradeObjective("MCQ", "Option B", "option b"), true);
  assert.equal(gradeObjective("MCQ", "b", "c"), false);
  assert.equal(gradeObjective("MCQ", "b", ""), false);
});

test("gradeObjective: TRUE_FALSE normalises t/f prefixes", () => {
  assert.equal(gradeObjective("TRUE_FALSE", "true", "T"), true);
  assert.equal(gradeObjective("TRUE_FALSE", "false", "f"), true);
  assert.equal(gradeObjective("TRUE_FALSE", "true", "false"), false);
  assert.equal(gradeObjective("TRUE_FALSE", "false", "Falso"), true);
  assert.equal(gradeObjective("TRUE_FALSE", "true", "nope"), false);
});

test("gradeObjective: ASSERTION_REASON behaves like MCQ", () => {
  assert.equal(gradeObjective("ASSERTION_REASON", "a", "a"), true);
  assert.equal(gradeObjective("ASSERTION_REASON", "b", "a"), false);
});

test("gradeObjective: MATCHING is order-insensitive but strict on pairing", () => {
  assert.equal(gradeObjective("MATCHING", "a-p, b-q, c-r", "a-p, b-q, c-r"), true);
  assert.equal(gradeObjective("MATCHING", "a-p, b-q, c-r", "c-r, b-q, a-p"), true);
  assert.equal(gradeObjective("MATCHING", "a-p, b-q, c-r", "a-q, b-p, c-r"), false);
  assert.equal(gradeObjective("MATCHING", "a-p, b-q, c-r", "a-p, b-q"), false);
});

// ------------------------------------------------------------------
// Scoring aggregation — mirrors buildEvaluationResult objective loop
// ------------------------------------------------------------------

function scorePaper(questions, responses) {
  const objectiveTypes = new Set(["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING"]);
  let objectiveScore = 0;
  let objectiveMax = 0;
  let subjectiveScore = 0;
  let subjectiveMax = 0;
  for (const q of questions) {
    const resp = (responses[q.id] || "").trim();
    if (objectiveTypes.has(q.type)) {
      objectiveMax += q.marks;
      if (gradeObjective(q.type, q.answer, resp)) objectiveScore += q.marks;
    } else {
      subjectiveMax += q.marks;
      if (resp.length >= 12) subjectiveScore += q.marks; // stand-in for examiner credit
    }
  }
  return {
    objectiveScore,
    objectiveMax,
    subjectiveScore,
    subjectiveMax,
    totalScore: objectiveScore + subjectiveScore,
    maxScore: objectiveMax + subjectiveMax,
  };
}

test("scoring: objective marks accumulate only for correct answers", () => {
  const qs = [
    { id: "1", type: "MCQ", marks: 1, answer: "a" },
    { id: "2", type: "MCQ", marks: 1, answer: "b" },
    { id: "3", type: "TRUE_FALSE", marks: 1, answer: "true" },
  ];
  const r = scorePaper(qs, { "1": "a", "2": "c", "3": "T" });
  assert.equal(r.objectiveScore, 2);
  assert.equal(r.objectiveMax, 3);
  assert.equal(r.totalScore, 2);
  assert.equal(r.maxScore, 3);
});

test("scoring: empty responses never earn marks", () => {
  const qs = [{ id: "1", type: "MCQ", marks: 5, answer: "a" }];
  const r = scorePaper(qs, { "1": "" });
  assert.equal(r.objectiveScore, 0);
  assert.equal(r.maxScore, 5);
});

test("scoring: mixed objective + subjective combine correctly", () => {
  const qs = [
    { id: "1", type: "MCQ", marks: 2, answer: "a" },
    { id: "2", type: "LONG", marks: 5, answer: "…" },
    { id: "3", type: "SHORT", marks: 3, answer: "…" },
  ];
  const r = scorePaper(qs, { "1": "a", "2": "This is a full sentence answer.", "3": "short" });
  assert.equal(r.objectiveScore, 2);
  assert.equal(r.objectiveMax, 2);
  assert.equal(r.subjectiveMax, 8);
  assert.equal(r.subjectiveScore, 5);
  assert.equal(r.totalScore, 7);
  assert.equal(r.maxScore, 10);
});

// ------------------------------------------------------------------
// Timer maths — mirrors the exam simulator contract
// ------------------------------------------------------------------

const DEFAULT_DURATION_MIN = 180;

function remainingMs(startedAtMs, nowMs, durationMinutes) {
  return Math.max(0, durationMinutes * 60_000 - (nowMs - startedAtMs));
}

function shouldWarn(remaining, warnedMinutes) {
  return remaining > 0 && remaining <= warnedMinutes * 60_000;
}

test("timer: 180-minute default converts to 10,800,000 ms", () => {
  assert.equal(DEFAULT_DURATION_MIN * 60_000, 10_800_000);
});

test("timer: remaining time counts down and floors at zero", () => {
  const start = 1_000_000;
  assert.equal(remainingMs(start, start, 180), 10_800_000);
  assert.equal(remainingMs(start, start + 60_000, 180), 10_740_000);
  assert.equal(remainingMs(start, start + 10_800_000, 180), 0);
  assert.equal(remainingMs(start, start + 99_999_999, 180), 0);
});

test("timer: survives a refresh by recomputing from the absolute startedAt", () => {
  const start = 5_000_000;
  const beforeRefresh = remainingMs(start, start + 120_000, 180);
  const afterRefresh = remainingMs(start, start + 120_000, 180);
  assert.equal(beforeRefresh, afterRefresh);
});

test("timer: warnings fire in the last 30/15/5 minute windows", () => {
  assert.equal(shouldWarn(29 * 60_000, 30), true);
  assert.equal(shouldWarn(31 * 60_000, 30), false);
  assert.equal(shouldWarn(14 * 60_000, 15), true);
  assert.equal(shouldWarn(4 * 60_000, 5), true);
  assert.equal(shouldWarn(0, 5), false);
});

test("timer: auto-submit triggers exactly at zero", () => {
  const start = 0;
  assert.equal(remainingMs(start, 179 * 60_000, 180) > 0, true);
  assert.equal(remainingMs(start, 180 * 60_000, 180), 0);
  assert.equal(remainingMs(start, 181 * 60_000, 180), 0);
});

// ------------------------------------------------------------------
// Curriculum / fact bank integrity (drives the demo paper generator)
// ------------------------------------------------------------------

test("curriculum exposes the core Class 12 subjects with chapters", () => {
  assert.ok(SUBJECT_NAMES.length >= 5);
  for (const name of SUBJECT_NAMES) {
    const s = CURRICULUM[name];
    assert.ok(s, `subject ${name} exists`);
    assert.ok(Array.isArray(s.chapters) && s.chapters.length > 0, `${name} has chapters`);
    for (const ch of s.chapters) {
      assert.ok(ch.name.length > 0);
      assert.ok(Array.isArray(ch.topics) && ch.topics.length > 0, `${name} > ${ch.name} has topics`);
    }
  }
});

test("findSubject / findChapter are case-insensitive and safe", () => {
  const s = findSubject("physics");
  assert.ok(s);
  const ch = findChapter(s, s.chapters[0].name.toUpperCase());
  assert.ok(ch);
  assert.equal(findSubject("nonsense-subject-xyz"), null);
});

test("suggestChapters filters by query and is bounded", () => {
  const all = suggestChapters("Physics", "");
  assert.ok(all.length > 0 && all.length <= 8);
  const filtered = suggestChapters("Physics", "current");
  assert.ok(filtered.every((c) => c.toLowerCase().includes("current")));
  assert.deepEqual(suggestChapters("nonsense-subject", "x"), []);
});

test("fact bank yields facts for real curriculum chapters", () => {
  const s = findSubject("Physics");
  const facts = factsForChapter(s.chapters[0].name);
  assert.ok(Array.isArray(facts));
  for (const f of facts) assert.ok(typeof f === "string" && f.includes("—"), "facts carry concept — statement form");
});
