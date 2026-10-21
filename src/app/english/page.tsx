"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi, Card, Button, Spinner, ErrorState, Badge, Field, Select, Stat, Progress, EmptyState, useToast } from "@/components/ui";
import { Mic, Square, Send, Volume2 } from "lucide-react";
import VoicePill from "@/components/reactbits/VoicePill";

interface Feedback {
  metrics: { wpm: number; fillerCount: number; pauseCount: number; grammarIssues: number; uniqueWordRatio: number; sentences: number; wordCount?: number };
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
interface Session {
  id: string;
  type: string;
  topic: string;
  transcript: string;
  durationSec: number;
  createdAt: string;
  metrics: Feedback["metrics"];
  feedback: Feedback;
  corrected: Feedback["correctedSentences"];
  exercises: Feedback["exercises"];
}

const TYPES = ["PROMPT", "INTERVIEW", "CONVERSATION", "PRESENTATION", "PRONUNCIATION", "ROLEPLAY"];
const TOPICS = [
  "Describe your school life in 2 minutes.",
  "Why do you want to study [subject] at university?",
  "Explain a recent news event and your view on it.",
  "Tell me about a challenge you overcame.",
  "Pitch a freelance design service to a small business.",
  "Present the causes of a scientific phenomenon you studied.",
];

export default function EnglishPage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<{ sessions: Session[]; streak: number }>("/api/english");
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("PROMPT");
  const [accent, setAccent] = useState("Indian");
  const [transcript, setTranscript] = useState("");
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState<Session | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => () => {
    clearInterval(timerRef.current);
    recognitionRef.current?.stop?.();
  }, []);

  function stopRecord() {
    recognitionRef.current?.stop?.();
    clearInterval(timerRef.current);
    setRecording(false);
  }

  function startRecord() {
    const SR = (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)) || null;
    if (!SR) {
      toast("Live transcription is not supported here — type your response instead.", "info");
      setRecording(true);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return;
    }
    const rec = new SR();
    rec.lang = accent === "British" ? "en-GB" : accent === "American" ? "en-US" : "en-IN";
    rec.interimResults = true;
    rec.continuous = true;
    let finalText = transcript ? transcript + " " : "";
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + " ";
        else interim += t;
      }
      setTranscript((finalText + interim).trim());
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => {
      setRecording(false);
      clearInterval(timerRef.current);
    };
    recognitionRef.current = rec;
    setRecording(true);
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    rec.start();
  }

  function toggleRecord() {
    if (recording) stopRecord();
    else startRecord();
  }

  async function submit() {
    if (!transcript.trim() && elapsed === 0) {
      toast("Speak or type a response first.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/english", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic: topic || TOPICS[0], transcript, durationSec: elapsed, targetAccent: accent }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not analyse.");
      setCurrent(json.session);
      setTranscript("");
      setElapsed(0);
      toast("Feedback ready.", "success");
      reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  function speak(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = accent === "British" ? "en-GB" : accent === "American" ? "en-US" : "en-IN";
    window.speechSynthesis.speak(u);
  }

  if (loading) return <Spinner label="Loading English lab…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const sessions = data?.sessions ?? [];
  const latest = current ?? sessions[0];

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Spoken English</p>
          <h1 className="mt-xs text-h2 text-ink">English lab.</h1>
          <p className="mt-sm text-body text-muted">Speak, get scored on fluency, grammar, clarity and vocabulary, then work the drills.</p>
        </div>
        <Stat label="Practice streak" value={`${data?.streak ?? 0} days`} />
      </div>

      <div className="grid gap-md lg:grid-cols-2">
        <Card>
          <h3 className="text-title text-ink">Practice</h3>
          <div className="mt-sm grid grid-cols-2 gap-sm">
            <Field label="Type">
              <Select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Accent target">
              <Select value={accent} onChange={(e) => setAccent(e.target.value)}>
                <option value="Indian">Indian</option>
                <option value="British">British</option>
                <option value="American">American</option>
              </Select>
            </Field>
          </div>
          <Field label="Topic" className="mt-sm">
            <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Choose a prompt…</option>
              {TOPICS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>

          <div className="mt-md flex flex-wrap items-center gap-sm">
            <Button onClick={toggleRecord} variant={recording ? "primary" : "outline"} className={recording ? "animate-none" : ""}>
              {recording ? <Square size={16} /> : <Mic size={16} />} {recording ? "Stop" : "Record"}
            </Button>
            <VoicePill
              mode="toggle"
              reactive="mic"
              shape="pill"
              size={44}
              accentColor="var(--chart-ink)"
              iconColor="var(--chart-tip-bg)"
              background="var(--chart-ink)"
              showTime
              onStart={() => {
                if (!recording) startRecord();
              }}
              onStop={() => {
                if (recording) stopRecord();
              }}
              ariaLabel="Voice record"
            />
            <span className="text-body-sm text-muted tabular-nums">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}</span>
            {recording && <span className="flex items-center gap-xs text-caption text-ink"><span className="h-2 w-2 animate-pulse rounded-full bg-ink" /> recording</span>}
          </div>

          <Field label="Transcript (editable — type if recording is unavailable)" className="mt-md">
            <textarea className="input min-h-32 resize-y" value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="Your spoken words appear here…" />
          </Field>

          <div className="mt-sm flex items-center justify-between">
            <button onClick={() => speak(topic || TOPICS[0])} className="text-caption text-muted hover:text-ink">
              <Volume2 size={14} className="mr-xxs inline" /> Hear the prompt
            </button>
            <Button onClick={submit} disabled={submitting}>
              {submitting ? "Analysing…" : <><Send size={16} /> Get feedback</>}
            </Button>
          </div>
        </Card>

        <Card>
          <h3 className="text-title text-ink">Latest feedback</h3>
          {!latest ? (
            <EmptyState title="No feedback yet" description="Record or type a response on the left and submit to see your scores." />
          ) : (
            <div className="mt-sm flex flex-col gap-md">
              <div className="grid grid-cols-5 gap-xs text-center">
                {[
                  ["Grammar", latest.feedback.grammarScore],
                  ["Vocabulary", latest.feedback.vocabularyScore],
                  ["Fluency", latest.feedback.fluencyScore],
                  ["Clarity", latest.feedback.clarityScore],
                  ["Confidence", latest.feedback.confidenceScore],
                ].map(([label, val]) => (
                  <div key={label as string}>
                    <p className="text-h4 text-ink">{val as number}</p>
                    <p className="text-caption text-muted">{label as string}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-xs text-caption text-muted">
                <span>🗣 {latest.metrics.wpm} wpm</span>
                <span>🔁 {latest.metrics.fillerCount} fillers</span>
                <span>✋ {latest.metrics.pauseCount} pauses</span>
                <span>📚 {Math.round(latest.metrics.uniqueWordRatio * 100)}% unique words</span>
              </div>

              <p className="rounded-sm bg-canvas-soft p-sm text-body-sm text-ink">{latest.feedback.summary}</p>

              {latest.corrected.length > 0 && (
                <div>
                  <p className="label-cap">Corrections</p>
                  <ul className="mt-xs flex flex-col gap-xs">
                    {latest.corrected.map((c, i) => (
                      <li key={i} className="text-body-sm">
                        <span className="text-muted line-through">{c.original}</span>
                        <span className="mx-xxs">→</span>
                        <span className="text-ink">{c.corrected}</span>
                        {c.note && <span className="mt-xxs block text-caption text-muted">{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.feedback.improvements.length > 0 && (
                <div>
                  <p className="label-cap">What to improve</p>
                  <ul className="mt-xs flex list-disc flex-col gap-xxs pl-md text-body-sm text-ink">
                    {latest.feedback.improvements.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.feedback.exercises.length > 0 && (
                <div>
                  <p className="label-cap">Practice drills</p>
                  <ul className="mt-xs flex flex-col gap-xs">
                    {latest.feedback.exercises.map((ex, i) => (
                      <li key={i} className="rounded-sm bg-canvas-soft p-sm">
                        <p className="text-body-sm text-ink">{ex.title}</p>
                        <p className="text-caption text-muted">{ex.instruction}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {latest.feedback.isDemo && <Badge tone="neutral">Demo analysis — add AI_API_KEY for deeper feedback</Badge>}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-lg">
        <h3 className="text-title text-ink">Past sessions</h3>
        {sessions.length === 0 ? (
          <p className="mt-sm text-body-sm text-muted">No sessions recorded yet.</p>
        ) : (
          <ul className="mt-sm flex flex-col gap-xs">
            {sessions.map((s) => (
              <li key={s.id}>
                <button onClick={() => setCurrent(s)} className="flex w-full items-center justify-between gap-sm rounded-sm bg-canvas-soft p-sm text-left hover:opacity-80">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-sm text-ink">{s.topic}</span>
                    <span className="block text-caption text-muted">{new Date(s.createdAt).toLocaleDateString("en-IN")} · {s.type}</span>
                  </span>
                  <span className="flex items-center gap-sm text-caption text-muted">
                    <span>{s.metrics.wpm} wpm</span>
                    <Progress className="!w-16" value={s.feedback.fluencyScore} max={100} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
