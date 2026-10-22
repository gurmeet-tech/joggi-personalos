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
  type: "LEARN" | "PRACTICE" | "REVISION" | "ENGLISH" | "BREAK";
  minutes: number;
  reason: string;
}

export interface StudyPlanResult {
  days: Array<{ date: string; items: PlanItem[]; totalMinutes: number }>;
  rationale: string;
  isDemo: boolean;
}
