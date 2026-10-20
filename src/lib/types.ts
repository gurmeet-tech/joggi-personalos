export type QuestionType =
  | "MCQ"
  | "TRUE_FALSE"
  | "ASSERTION_REASON"
  | "MATCHING"
  | "SHORT"
  | "LONG"
  | "CASE"
  | "NUMERICAL"
  | "DERIVATION";

export interface PaperOption {
  id: string;
  text: string;
}

export interface GeneratedQuestion {
  number: number;
  type: QuestionType;
  text: string;
  options: PaperOption[];
  marks: number;
  topics: string[];
  difficulty: string;
  answer: string;
  solution: string;
  scheme: string[];
  choiceGroup?: number | null;
}

export interface GeneratedPaper {
  title: string;
  mode: string;
  subject: string;
  chapterNames: string[];
  difficulty: string;
  questionTypes: QuestionType[];
  language: string;
  durationMinutes: number;
  totalMarks: number;
  instructions: string[];
  markingScheme: { negativeMarking: boolean; notes: string };
  questions: GeneratedQuestion[];
  isDemo: boolean;
}

export interface PaperRequest {
  subject: string;
  chapters: string[];
  mode: string;
  difficulty: string;
  questionCount: number;
  durationMinutes: number;
  questionTypes: QuestionType[];
  language: string;
  totalMarks?: number;
  negativeMarking?: boolean;
  weakTopics?: string[];
  previousMistakes?: Array<{ question: string; correctAnswer: string }>;
  materials?: string;
}

export interface EvaluationItem {
  questionId: string;
  number: number;
  awarded: number;
  maxMarks: number;
  correct: boolean | null;
  comment: string;
  modelAnswer?: string;
  scheme?: string[];
  kind: "objective" | "subjective";
}

export interface EvaluationResult {
  items: EvaluationItem[];
  objectiveScore: number;
  objectiveMax: number;
  subjectiveScore: number;
  subjectiveMax: number;
  totalScore: number;
  maxScore: number;
  strongest: string[];
  weakest: string[];
  mistakes: Array<{
    question: string;
    myAnswer: string;
    correctAnswer: string;
    reasoning: string;
    category: string;
    topic: string;
  }>;
  summary: string;
  isDemo: boolean;
}

export interface FeedbackMetrics {
  durationSec: number;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  pauseCount: number;
  grammarIssues: number;
  uniqueWordRatio: number;
  sentences: number;
}

export interface EnglishFeedback {
  metrics: FeedbackMetrics;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  clarityScore: number;
  confidenceScore: number;
  correctedSentences: Array<{ original: string; corrected: string; note: string }>;
  strengths: string[];
  improvements: string[];
  exercises: Array<{ title: string; instruction: string }>;
  summary: string;
  isDemo: boolean;
}

export interface PlanItem {
  id: string;
  title: string;
  subject?: string;
  chapter?: string;
  type: "LEARN" | "PRACTICE" | "REVISION" | "MOCK" | "ENGLISH" | "BREAK";
  minutes: number;
  reason: string;
}

export interface StudyPlanResult {
  days: Array<{ date: string; items: PlanItem[]; totalMinutes: number }>;
  rationale: string;
  isDemo: boolean;
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: "Multiple choice",
  TRUE_FALSE: "True / False",
  ASSERTION_REASON: "Assertion–Reason",
  MATCHING: "Matching",
  SHORT: "Short answer",
  LONG: "Long answer",
  CASE: "Case-based",
  NUMERICAL: "Numerical",
  DERIVATION: "Derivation",
};

export const OBJECTIVE_TYPES: QuestionType[] = ["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING"];
