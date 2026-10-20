import { CURRICULUM, findSubject, findChapter } from "../curriculum";
import { factsForChapter } from "../factbank";
import type { GeneratedPaper, GeneratedQuestion, PaperRequest, PaperOption, QuestionType } from "../types";

function shuffle<T>(arr: T[], seed = Math.random()): T[] {
  const a = [...arr];
  let s = Math.floor(seed * 1e9) || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let rngState = Date.now() % 2147483647;
function rnd(): number {
  rngState = (rngState * 16807) % 2147483647;
  return (rngState - 1) / 2147483646;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)];
}

function ri(min: number, max: number): number {
  return Math.floor(rnd() * (max - min + 1)) + min;
}

function gid(): string {
  return Math.random().toString(36).slice(2, 10);
}

// ---------- Numerical templates (parametric, answer computed) ----------

interface NumTemplate {
  subject: string;
  topics: string[];
  build: () => { text: string; answer: string; solution: string; marks: number };
}

const NUM_TEMPLATES: NumTemplate[] = [
  {
    subject: "Physics",
    topics: ["Current Electricity", "Ohm's law"],
    build: () => {
      const v = ri(6, 24) * 2;
      const r = ri(3, 12) * 2;
      const i = v / r;
      return {
        text: `A resistor of ${r} Ω is connected across a ${v} V battery. Calculate the current flowing through the resistor using Ohm's law.`,
        answer: `${i.toFixed(2)} A`,
        solution: `Using Ohm's law: I = V/R = ${v}/${r} = ${i.toFixed(2)} A.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Physics",
    topics: ["Current Electricity"],
    build: () => {
      const r1 = ri(4, 10) * 2;
      const r2 = ri(6, 16) * 2;
      const rp = (r1 * r2) / (r1 + r2);
      return {
        text: `Two resistors of ${r1} Ω and ${r2} Ω are connected in parallel. Find the equivalent resistance of the combination.`,
        answer: `${rp.toFixed(2)} Ω`,
        solution: `For parallel combination: 1/R = 1/${r1} + 1/${r2}, so R = (${r1}×${r2})/(${r1}+${r2}) = ${rp.toFixed(2)} Ω.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Physics",
    topics: ["Electrostatic Potential and Capacitance"],
    build: () => {
      const c = ri(2, 9) * 10;
      const v = ri(5, 20) * 2;
      const u = 0.5 * (c / 1e6) * v * v;
      return {
        text: `A capacitor of capacitance ${c} μF is charged to a potential difference of ${v} V. Calculate the energy stored in the capacitor.`,
        answer: `${(u * 1000).toFixed(2)} mJ`,
        solution: `Energy U = ½CV² = ½ × ${c}×10⁻⁶ × ${v}² = ${(u).toFixed(5)} J = ${(u * 1000).toFixed(2)} mJ.`,
        marks: 3,
      };
    },
  },
  {
    subject: "Physics",
    topics: ["Electric Charges and Fields"],
    build: () => {
      const q1 = ri(1, 5);
      const q2 = ri(1, 5);
      const d = ri(2, 8) / 10;
      const f = (9e9 * q1 * 1e-6 * q2 * 1e-6) / (d * d);
      return {
        text: `Two point charges of ${q1} μC and ${q2} μC are placed ${d.toFixed(1)} m apart in vacuum. Calculate the electrostatic force between them. (k = 9 × 10⁹ N m²/C²)`,
        answer: `${f.toFixed(2)} N`,
        solution: `Using Coulomb's law: F = k q₁q₂/r² = 9×10⁹ × ${q1}×10⁻⁶ × ${q2}×10⁻⁶ / (${d.toFixed(1)})² = ${f.toFixed(2)} N.`,
        marks: 3,
      };
    },
  },
  {
    subject: "Physics",
    topics: ["Nuclei"],
    build: () => {
      const half = pick([5, 10, 20, 30]);
      const periods = ri(2, 4);
      const initial = ri(4, 16) * 10;
      const left = initial / Math.pow(2, periods);
      return {
        text: `A radioactive sample has an initial activity of ${initial} nuclei and a half-life of ${half} days. How many nuclei remain undecayed after ${periods} half-lives?`,
        answer: `${left} nuclei`,
        solution: `N = N₀/(2ⁿ) = ${initial}/2^${periods} = ${left} nuclei.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Chemistry",
    topics: ["Solutions"],
    build: () => {
      const mass = ri(5, 20);
      const molar = pick([58.5, 40, 36.5, 180]);
      const volL = ri(25, 100) / 1000;
      const mol = mass / molar;
      const m = mol / volL;
      const name = molar === 58.5 ? "NaCl" : molar === 40 ? "NaOH" : molar === 36.5 ? "HCl" : "glucose";
      return {
        text: `Calculate the molarity of a solution prepared by dissolving ${mass} g of ${name} (molar mass ${molar} g/mol) in enough water to make ${Math.round(volL * 1000)} mL of solution.`,
        answer: `${m.toFixed(3)} M`,
        solution: `Moles = ${mass}/${molar} = ${mol.toFixed(4)} mol. Molarity = moles/volume(L) = ${mol.toFixed(4)}/${volL} = ${m.toFixed(3)} M.`,
        marks: 3,
      };
    },
  },
  {
    subject: "Chemistry",
    topics: ["Chemical Kinetics"],
    build: () => {
      const k = pick([0.05, 0.1, 0.2, 0.0693]);
      const t12 = (0.693 / k).toFixed(1);
      return {
        text: `A first-order reaction has a rate constant k = ${k} s⁻¹. Calculate its half-life.`,
        answer: `${t12} s`,
        solution: `For a first-order reaction: t₁/₂ = 0.693/k = 0.693/${k} = ${t12} s.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Chemistry",
    topics: ["Electrochemistry"],
    build: () => {
      const q = ri(2, 9) * 965;
      const n = ri(1, 4);
      const z = pick([0.329, 0.106, 0.207, 0.658]);
      const m = (z * q) / 96500;
      return {
        text: `During the electrolysis of a copper sulphate solution, a charge of ${q} C is passed. Calculate the mass of copper deposited. (Equivalent mass of Cu = 0.329 g; use Faraday's laws)`,
        answer: `${m.toFixed(3)} g`,
        solution: `Using Faraday's law: m = Z × Q = ${(z).toFixed(3)} × ${q}/96500... m = (eq. mass × Q)/F = 0.329 × ${q}/96500 = ${(0.329 * q / 96500).toFixed(4)} kg-scale? → m = ${(0.329 * q / 96500 * 1000).toFixed(3)} g.`,
        marks: 3,
      };
    },
  },
  {
    subject: "Mathematics",
    topics: ["Determinants"],
    build: () => {
      const a = ri(1, 5), b = ri(1, 5), c = ri(1, 5), d = ri(1, 5);
      const det = a * d - b * c;
      return {
        text: `Find the value of the determinant | ${a}  ${b} ; ${c}  ${d} | (rows: [${a}, ${b}] and [${c}, ${d}]).`,
        answer: `${det}`,
        solution: `Determinant = (${a})(${d}) − (${b})(${c}) = ${a * d} − ${b * c} = ${det}.`,
        marks: 1,
      };
    },
  },
  {
    subject: "Mathematics",
    topics: ["Integrals"],
    build: () => {
      const n = ri(2, 5);
      const a = ri(1, 3);
      const val = (a * Math.pow(3, n + 1)) / (n + 1) - (a * Math.pow(1, n + 1)) / (n + 1);
      return {
        text: `Evaluate the definite integral of ${a}x^${n} dx from x = 1 to x = 3.`,
        answer: `${val}`,
        solution: `∫ ${a}x^${n} dx = ${a}x^${n + 1}/(${n + 1}). At 3: ${a}×3^${n + 1}/(${n + 1}); at 1: ${a}/${n + 1}. Difference = ${val}.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Mathematics",
    topics: ["Probability"],
    build: () => {
      const total = ri(5, 2) + 5;
      const favorable = ri(1, total - 2);
      return {
        text: `A bag contains ${total} cards numbered 1 to ${total}. One card is drawn at random. Find the probability that the card bears a prime number, given that ${favorable} of the ${total} numbers are prime.`,
        answer: `${favorable}/${total}`,
        solution: `P(prime) = favourable outcomes/total outcomes = ${favorable}/${total}.`,
        marks: 1,
      };
    },
  },
  {
    subject: "Mathematics",
    topics: ["Matrices"],
    build: () => {
      const a = ri(2, 9), b = ri(2, 9);
      return {
        text: `If A is a 2×2 matrix with all elements equal to ${a} and B has all elements equal to ${b}, find each element of A + B.`,
        answer: `${a + b}`,
        solution: `Matrix addition is element-wise: every element of A + B equals ${a} + ${b} = ${a + b}.`,
        marks: 1,
      };
    },
  },
  {
    subject: "Economics",
    topics: ["National Income and Related Aggregates"],
    build: () => {
      const output = ri(50, 200) * 10;
      const intermediate = ri(10, 40) * 10;
      const va = output - intermediate;
      return {
        text: `A firm produced goods worth ₹${output} lakh during the year and used intermediate materials worth ₹${intermediate} lakh. Compute the value added by the firm.`,
        answer: `₹${va} lakh`,
        solution: `Value added = Value of output − Intermediate consumption = ${output} − ${intermediate} = ₹${va} lakh.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Economics",
    topics: ["Determination of Income and Employment"],
    build: () => {
      const mpc = pick([0.6, 0.75, 0.8, 0.5]);
      const mult = (1 / (1 - mpc)).toFixed(2);
      return {
        text: `If the marginal propensity to consume is ${mpc}, calculate the value of the investment multiplier.`,
        answer: mult,
        solution: `k = 1/(1 − MPC) = 1/(1 − ${mpc}) = 1/${(1 - mpc).toFixed(2)} = ${mult}.`,
        marks: 1,
      };
    },
  },
  {
    subject: "Accountancy",
    topics: ["Ratio Analysis"],
    build: () => {
      const ca = ri(40, 120) * 1000;
      const cl = ri(20, 60) * 1000;
      const ratio = (ca / cl).toFixed(2);
      return {
        text: `From the following data, compute the current ratio: Current assets = ₹${ca.toLocaleString("en-IN")}, Current liabilities = ₹${cl.toLocaleString("en-IN")}.`,
        answer: `${ratio} : 1`,
        solution: `Current ratio = Current assets / Current liabilities = ${ca}/${cl} = ${ratio} : 1.`,
        marks: 2,
      };
    },
  },
  {
    subject: "Computer Science",
    topics: ["Data Structures"],
    build: () => {
      const n = ri(5, 12);
      return {
        text: `A stack initially empty receives ${n} push operations and then 2 pop operations. How many elements remain in the stack?`,
        answer: `${n - 2}`,
        solution: `Stack is LIFO: after ${n} pushes there are ${n} elements; 2 pops leave ${n - 2} elements.`,
        marks: 1,
      };
    },
  },
];

// ---------- Question builders per type ----------

function buildMCQ(topic: string, allFacts: string[], chapter: string): GeneratedQuestion | null {
  const mine = allFacts.filter((f) => f.startsWith(topic));
  const others = allFacts.filter((f) => !f.startsWith(topic));
  if (!mine.length) return null;
  const fact = pick(mine);
  const [, statement] = fact.split(" — ");
  const distractorFacts = shuffle(others).slice(0, 3).map((f) => String(f.split(" — ")[1] ?? "")).filter((x) => x.length > 0);
  while (distractorFacts.length < 3) {
    distractorFacts.push(pick(CURRICULUM.Physics.chapters).name + " is a Class 12 chapter.");
  }
  const options: PaperOption[] = shuffle([
    { id: "a", text: String(statement ?? ""), correct: true },
    ...distractorFacts.map((d, i) => ({ id: `x${i}`, text: d, correct: false })),
  ]).map((o, i) => ({ id: ["a", "b", "c", "d"][i], text: o.text }));
  const correctIdx = options.findIndex((o) => o.text === String(statement ?? ""));
  return {
    number: 0,
    type: "MCQ",
    text: `Which of the following statements about "${topic}" (${chapter}) is correct?`,
    options: options.map((o, i) => ({ id: ["a", "b", "c", "d"][i], text: o.text })),
    marks: 1,
    topics: [topic],
    difficulty: "moderate",
    answer: ["a", "b", "c", "d"][correctIdx],
    solution: `Correct statement: "${statement}" This follows from the standard treatment of ${topic} in ${chapter}.`,
    scheme: ["Award 1 mark for the correct option; no negative marking unless configured."],
  };
}

function buildTrueFalse(topic: string, allFacts: string[]): GeneratedQuestion | null {
  const mine = allFacts.filter((f) => f.startsWith(topic));
  if (!mine.length) return null;
  const fact = pick(mine);
  const [, statement] = fact.split(" — ");
  const negate = rnd() > 0.5;
  const text = negate
    ? `State True or False: The statement "${statement}" is incorrect.`
    : `State True or False: ${statement}`;
  return {
    number: 0,
    type: "TRUE_FALSE",
    text,
    options: [
      { id: "true", text: "True" },
      { id: "false", text: "False" },
    ],
    marks: 1,
    topics: [topic],
    difficulty: "easy",
    answer: negate ? "false" : "true",
    solution: `The statement "${statement}" is factually correct, so the answer is ${negate ? "False (the claim that it is incorrect is wrong)" : "True"}.`,
    scheme: ["1 mark for the correct response."],
  };
}

function buildAssertionReason(topic: string, allFacts: string[], chapter: string): GeneratedQuestion | null {
  const mine = allFacts.filter((f) => f.startsWith(topic));
  if (!mine.length) return null;
  const [concept, statement] = pick(mine).split(" — ");
  const mode = ri(0, 2);
  const other = pick(allFacts).split(" — ");
  let reason: string;
  let answer: string;
  let note: string;
  if (mode === 0) {
    reason = statement;
    answer = "A";
    note = "Both assertion and reason are true, and the reason correctly explains the assertion.";
  } else if (mode === 1) {
    reason = `In ${chapter}, the syllabus covers ${topic} as a distinct unit.`;
    answer = "C";
    note = "Both statements may be true, but the reason does not explain the assertion.";
  } else {
    reason = statement.replace(/\b(is|are|equals|occurs)\b/, "does not $1").replace(/not not /g, "");
    answer = "B";
    note = "The assertion is true but the reason as stated is not a correct explanation (reason is inaccurate).";
  }
  return {
    number: 0,
    type: "ASSERTION_REASON",
    text: `Directions: In the following question, a statement of Assertion (A) is followed by a statement of Reason (R). Choose the correct option.\n\nAssertion (A): ${concept} — ${statement}\nReason (R): ${reason}\n\nOptions: (A) Both A and R are true and R is the correct explanation of A. (B) Both A and R are true but R is not the correct explanation of A. (C) A is true but R is false. (D) A is false but R is true.`,
    options: [
      { id: "A", text: "Both A and R are true and R is the correct explanation of A" },
      { id: "B", text: "Both A and R are true but R is not the correct explanation of A" },
      { id: "C", text: "A is true but R is false" },
      { id: "D", text: "A is false but R is true" },
    ],
    marks: 1,
    topics: [topic],
    difficulty: "moderate",
    answer,
    solution: note,
    scheme: ["1 mark for the correct choice."],
  };
}

function buildMatching(topic: string, allFacts: string[], chapter: string): GeneratedQuestion | null {
  const pool = allFacts.filter((f) => f.startsWith(topic) || f.includes(chapter.split(" ")[0]));
  const use = shuffle(allFacts).slice(0, 4);
  if (use.length < 3) return null;
  const left = use.map((f, i) => `${["a", "b", "c", "d"][i]}. ${f.split(" — ")[0]}`);
  const right: string[] = shuffle(use.map((f) => String(f.split(" — ")[1] ?? "")));
  const answer = use
    .map((f, i) => {
      const st = String(f.split(" — ")[1] ?? "");
      const ri2 = right.indexOf(st);
      return `${["a", "b", "c", "d"][i]}-${["p", "q", "r", "s"][Math.max(0, ri2)]}`;
    })
    .join(", ");
  return {
    number: 0,
    type: "MATCHING",
    text: `Match the concepts in Column-I with the correct descriptions in Column-II.\n\nColumn-I:\n${left.join("\n")}\n\nColumn-II:\n${right.map((r, i) => `${["p", "q", "r", "s"][i]}. ${r}`).join("\n")}\n\nWrite your answer as pairs, e.g. a-p, b-q.`,
    options: [],
    marks: 4,
    topics: [topic],
    difficulty: "moderate",
    answer,
    solution: `Correct matching: ${answer}.\n${use.map((f) => `${f.split(" — ")[0]} — ${f.split(" — ")[1]}`).join("\n")}`,
    scheme: ["1 mark for each correct pair (4 marks total)."],
  };
}

function buildShort(topic: string, chapter: string, subject: string): GeneratedQuestion {
  const stems = [
    `Define "${topic}" and state its key characteristics in the context of ${chapter}.`,
    `State and briefly explain "${topic}" as studied in ${chapter}.`,
    `Write a short note (80–100 words) on "${topic}".`,
    `Explain the significance of "${topic}" in ${subject}, with one suitable example.`,
  ];
  return {
    number: 0,
    type: "SHORT",
    text: pick(stems),
    options: [],
    marks: 2,
    topics: [topic],
    difficulty: "moderate",
    answer: `Key points expected: (i) accurate definition/statement of ${topic}; (ii) relevant properties or conditions; (iii) one correct example or application from ${chapter}.`,
    solution: `A strong answer defines ${topic} precisely, lists its essential features as covered in ${chapter}, and illustrates with a standard ${subject} example. Answers that only name the term without explanation should not receive full marks.`,
    scheme: ["1 mark for correct definition/statement.", "1 mark for explanation with example."],
  };
}

function buildLong(topic: string, chapter: string, subject: string): GeneratedQuestion {
  const stems = [
    `Describe "${topic}" in detail. Explain its principles, working/derivation as applicable, and give suitable examples from ${chapter}.`,
    `Discuss "${topic}" comprehensively. Include its significance, limitations if any, and a relevant application.`,
    `Explain "${topic}" with the help of a well-labelled diagram (where applicable) and discuss its importance in ${chapter}.`,
  ];
  return {
    number: 0,
    type: "LONG",
    text: pick(stems),
    options: [],
    marks: 5,
    topics: [topic],
    difficulty: "difficult",
    answer: `Model answer outline: (1) Introduction/definition of ${topic}; (2) Core principles or steps as covered in ${chapter}; (3) Diagram/derivation/example where applicable; (4) Significance or application in ${subject}; (5) Conclusion. Answers should be organised and use correct subject terminology.`,
    solution: `Full-credit responses walk through all stages of ${topic} as taught in ${chapter}, use correct notation/terminology, and connect the concept to its application. Deduct marks for missing steps or factual errors.`,
    scheme: [
      "1 mark — correct introduction/definition.",
      "2 marks — accurate explanation of principles/steps.",
      "1 mark — diagram, derivation or example.",
      "1 mark — significance and concluding statement.",
    ],
  };
}

function buildDerivation(topic: string, chapter: string): GeneratedQuestion {
  return {
    number: 0,
    type: "DERIVATION",
    text: `Derive an important result related to "${topic}" from ${chapter}. State all assumptions, write each step clearly, and box the final expression.`,
    options: [],
    marks: 4,
    topics: [topic],
    difficulty: "difficult",
    answer: `Expected: a step-by-step derivation concerning ${topic}, beginning from the governing law/equation of ${chapter}, with every substitution shown, arriving at the standard final result. Assume full credit requires logical continuity between steps.`,
    solution: `Marking should follow the standard derivation flow for ${topic}: setup and assumptions (1), correct application of the governing relation (2), and arrived final expression with units/direction (1).`,
    scheme: [
      "1 mark — correct starting relation and assumptions.",
      "2 marks — correct sequence of mathematical/logical steps.",
      "1 mark — final result stated clearly with units/conditions.",
    ],
  };
}

function buildCaseBased(topic: string, chapter: string, subject: string): GeneratedQuestion {
  const passage = `Read the passage and answer the questions that follow.\n\nPassage: The chapter "${chapter}" of ${subject} focuses centrally on ${topic}. This concept is a recurring theme in board examinations and connects to several other topics in the syllabus. Mastery of ${topic} requires understanding its definition, the conditions under which it applies, its mathematical formulation where relevant, and its practical significance. Examiners typically award marks for precise terminology, correct application, and well-structured reasoning.\n\nBased on the passage and your study of ${chapter}, answer the following:`;
  return {
    number: 0,
    type: "CASE",
    text: `${passage}\n\n(i) Define ${topic} in your own words. (1 mark)\n(ii) State two conditions/principles associated with ${topic}. (2 marks)\n(iii) Explain one real-world or syllabus-based application of ${topic}. (2 marks)`,
    options: [],
    marks: 5,
    topics: [topic],
    difficulty: "moderate",
    answer: `(i) Accurate working definition of ${topic}. (ii) Any two correct conditions/principles from ${chapter}. (iii) One valid application with brief explanation.`,
    solution: `Case-based questions test comprehension and application. Credit partial understanding; do not require exact textbook phrasing, only correctness of concepts related to ${topic}.`,
    scheme: ["1 mark — definition.", "2 marks — two correct conditions (1 each).", "2 marks — application with explanation."],
  };
}

function buildNumerical(topic: string, subject: string, chapter: string): GeneratedQuestion | null {
  const templates = NUM_TEMPLATES.filter(
    (t) => t.subject === subject && (t.topics.some((x) => chapter.includes(x) || x.includes(chapter)) || t.topics.some((x) => topic.includes(x) || x.includes(topic)) || t.topics[0] === chapter || chapter.startsWith(t.topics[0].split(" ")[0]))
  );
  const pool = templates.length ? templates : NUM_TEMPLATES.filter((t) => t.subject === subject);
  if (!pool.length) return null;
  const t = pick(pool);
  const built = t.build();
  return {
    number: 0,
    type: "NUMERICAL",
    text: built.text,
    options: [],
    marks: built.marks,
    topics: [topic],
    difficulty: "moderate",
    answer: built.answer,
    solution: built.solution,
    scheme: [
      "1 mark — correct formula/setup.",
      `${Math.max(1, built.marks - 1)} mark(s) — correct substitution and final answer.`,
    ],
  };
}

// ---------- Paper assembly ----------

const TYPE_WEIGHTS: Record<QuestionType, number> = {
  MCQ: 3,
  TRUE_FALSE: 1,
  ASSERTION_REASON: 2,
  MATCHING: 1,
  SHORT: 3,
  LONG: 2,
  CASE: 1,
  NUMERICAL: 3,
  DERIVATION: 1,
};

export function generateDemoPaper(req: PaperRequest): GeneratedPaper {
  const subject = findSubject(req.subject);
  const subjectName = subject?.name ?? req.subject ?? "General";
  const chosenChapters = (req.chapters || [])
    .map((c) => (subject ? findChapter(subject, c) : null))
    .filter(Boolean) as NonNullable<ReturnType<typeof findChapter>>[];

  const chapters = chosenChapters.length
    ? chosenChapters
    : subject
      ? subject.chapters.slice(0, Math.min(3, subject.chapters.length))
      : [];

  const chapterNames = chapters.map((c) => c.name);
  const allTopics: Array<{ topic: string; chapter: string }> = [];
  const allFacts: string[] = [];
  for (const ch of chapters) {
    for (const t of ch.topics) allTopics.push({ topic: t, chapter: ch.name });
    allFacts.push(...factsForChapter(ch.name));
  }
  if (!allTopics.length) {
    allTopics.push({ topic: subjectName + " fundamentals", chapter: subjectName + " (general)" });
    allFacts.push(`${subjectName} fundamentals — ${subjectName} is a Class 12 subject in the configured syllabus.`);
  }

  const weak = req.weakTopics || [];
  const orderedTopics = weak.length
    ? [...allTopics].sort((a, b) => (weak.includes(a.topic) ? -1 : 0) - (weak.includes(b.topic) ? -1 : 0))
    : shuffle(allTopics);

  const requestedTypes = (req.questionTypes?.length ? req.questionTypes : (subject?.defaultTypes as QuestionType[]) || ["MCQ", "SHORT", "LONG"]) as QuestionType[];
  const allowedTypes = requestedTypes.filter((t) => {
    if (t === "NUMERICAL" && subject && !subject.hasNumericals) return false;
    return true;
  });
  const types: QuestionType[] = allowedTypes.length ? allowedTypes : ["SHORT", "LONG"];

  const targetCount = Math.max(1, Math.min(req.questionCount || 15, 40));
  const questions: GeneratedQuestion[] = [];
  const usedTexts = new Set<string>();
  let topicCursor = 0;

  const typeBag: QuestionType[] = [];
  for (const t of types) {
    const n = TYPE_WEIGHTS[t] ?? 2;
    for (let i = 0; i < n; i++) typeBag.push(t);
  }
  const bag = shuffle(typeBag);

  let guard = 0;
  while (questions.length < targetCount && guard < targetCount * 8) {
    guard++;
    const type = bag[questions.length % bag.length];
    const { topic, chapter } = orderedTopics[topicCursor % orderedTopics.length];
    topicCursor++;
    let q: GeneratedQuestion | null = null;
    switch (type) {
      case "MCQ": q = buildMCQ(topic, allFacts, chapter); break;
      case "TRUE_FALSE": q = buildTrueFalse(topic, allFacts); break;
      case "ASSERTION_REASON": q = buildAssertionReason(topic, allFacts, chapter); break;
      case "MATCHING": q = buildMatching(topic, allFacts, chapter); break;
      case "SHORT": q = buildShort(topic, chapter, subjectName); break;
      case "LONG": q = buildLong(topic, chapter, subjectName); break;
      case "CASE": q = buildCaseBased(topic, chapter, subjectName); break;
      case "NUMERICAL": q = buildNumerical(topic, subjectName, chapter); break;
      case "DERIVATION": q = buildDerivation(topic, chapter); break;
    }
    if (q && !usedTexts.has(q.text)) {
      usedTexts.add(q.text);
      questions.push(q);
    }
  }

  // Internal choice pairs for board-style papers (every 4th long/short pair)
  if (req.mode === "FULL" || req.mode === "PREVIOUS_YEAR" || req.mode === "HALF") {
    let group = 1;
    for (let i = 0; i < questions.length - 1; i++) {
      const q = questions[i];
      const next = questions[i + 1];
      if ((q.type === "LONG" || q.type === "SHORT") && next.type === q.type && next.marks === q.marks && rnd() > 0.55) {
        q.choiceGroup = group;
        next.choiceGroup = group;
        group++;
      }
    }
  }

  questions.forEach((q, i) => (q.number = i + 1));
  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);
  const duration = req.durationMinutes || (req.mode === "FULL" || req.mode === "PREVIOUS_YEAR" ? 180 : 60);

  const modeLabel: Record<string, string> = {
    CHAPTER: "Chapter test",
    HALF: "Half-syllabus test",
    FULL: "Full-syllabus board-style examination",
    CUSTOM: "Custom test",
    WEAK: "Weak-area test",
    REVISION: "Revision test",
    PREVIOUS_YEAR: "Previous-year-style mock",
  };

  const instructions = [
    "All questions are compulsory unless an internal choice is indicated.",
    req.negativeMarking ? "Negative marking applies as stated in the marking scheme." : "There is no negative marking unless your settings state otherwise.",
    "Write your answers clearly. For numerical questions, show all working.",
    "For MCQ and objective questions, select the most appropriate option.",
    duration >= 120
      ? "You have the full allotted duration. The timer cannot be paused in strict mode."
      : `You have ${duration} minutes for this paper.`,
    "The answer key and solutions are revealed only after submission.",
  ];

  return {
    title: `${subjectName} — ${modeLabel[req.mode] ?? "Test"}: ${chapterNames.slice(0, 3).join(", ") || subjectName}`,
    mode: req.mode,
    subject: subjectName,
    chapterNames,
    difficulty: req.difficulty || "mixed",
    questionTypes: Array.from(new Set(questions.map((q) => q.type))),
    language: req.language || "English",
    durationMinutes: duration,
    totalMarks,
    instructions,
    markingScheme: {
      negativeMarking: !!req.negativeMarking,
      notes: req.negativeMarking
        ? "1/3 mark deducted for each incorrect objective answer."
        : "No negative marking. Marks awarded per the scheme attached to each question.",
    },
    questions,
    isDemo: true,
  };
}
