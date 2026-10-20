"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Modal, Spinner, ErrorState, useToast, Segmented, useApi } from "@/components/ui";
import AmbiencePlayer from "@/components/exam/ambience";
import { toHm, parseJSON, cn } from "@/lib/utils";
import { Flag, ChevronLeft, ChevronRight, Send, Volume2, Bell, Eye } from "lucide-react";

interface Q {
  id: string;
  number: number;
  type: string;
  text: string;
  options: Array<{ id: string; text: string }>;
  marks: number;
  topics: string[];
  choiceGroup: number | null;
}
interface AttemptData {
  id: string;
  status: string;
  startedAt: string | null;
  durationMinutes: number;
  strictMode: boolean;
  markedForReview: string[];
  visited: string[];
  answers: Array<{ questionId: string; response: string }>;
  score: number | null;
  maxScore: number;
  paper: { id: string; title: string; mode: string; totalMarks: number; instructions: string[]; markingScheme: { negativeMarking?: boolean }; subjectName: string; isDemo: boolean; questions: Q[] };
}

const OBJECTIVE = new Set(["MCQ", "TRUE_FALSE", "ASSERTION_REASON", "MATCHING"]);

export default function ActiveExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { data: initial, loading, error, reload } = useApi<AttemptData>(`/api/attempts/${params.id}`);

  const [phase, setPhase] = useState<"loading" | "running" | "submitting" | "submitted">("loading");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [current, setCurrent] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [playSignal, setPlaySignal] = useState(0);
  const [bellRinging, setBellRinging] = useState(false);
  const [snatching, setSnatching] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [strictPaused, setStrictPaused] = useState(false);

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const submittedRef = useRef(false);
  const timeSpentRef = useRef<Record<string, number>>({});
  const lastTickRef = useRef<number>(Date.now());
  const [ambience, setAmbience] = useState<string>("");

  // ---- Boot: resume-aware ----
  useEffect(() => {
    if (!initial) return;
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setAmbience(p.ambienceVideoUrl || ""))
      .catch(() => {});
    const map: Record<string, string> = {};
    for (const a of initial.answers) map[a.questionId] = a.response;
    setAnswers(map);
    setMarked(new Set(initial.markedForReview));
    setVisited(new Set(initial.visited.length ? initial.visited : [initial.paper.questions[0]?.id].filter(Boolean)));

    if (initial.status === "SUBMITTED" || initial.status === "EVALUATED") {
      router.replace(`/exam/results/${initial.id}`);
      return;
    }

    if (initial.status === "NOT_STARTED") {
      fetch(`/api/attempts/${initial.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
        .then((r) => r.json())
        .then((d) => {
          const started = d.startedAt ? new Date(d.startedAt).getTime() : Date.now();
          setDeadline(started + initial.durationMinutes * 60000);
          setPhase("running");
          setPlaySignal(1);
        })
        .catch(() => toast("Could not sync the exam start time.", "error"));
    } else {
      // resumed IN_PROGRESS — recompute deadline from persisted timestamp
      if (initial.startedAt) {
        setDeadline(new Date(initial.startedAt).getTime() + initial.durationMinutes * 60000);
      } else {
        setDeadline(Date.now() + initial.durationMinutes * 60000);
      }
      setPhase("running");
      setPlaySignal(1);
      toast("Session restored — remaining time preserved.", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");
      setSnatching(true);
      setBellRinging(true);
      try {
        // bell via Web Audio (custom ring, no asset needed)
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          const now = ctx.currentTime;
          [880, 1318].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.0001, now + i * 0.9);
            gain.gain.exponentialRampToValueAtTime(0.35, now + i * 0.9 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.9 + 1.4);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + i * 0.9);
            osc.stop(now + i * 0.9 + 1.5);
          });
        }
      } catch {
        /* audio is optional */
      }
      try {
        const res = await fetch(`/api/attempts/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "submit", autoSubmitted: auto, answers: Object.entries(answers).map(([questionId, response]) => ({ questionId, response })) }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Submission failed.");
        setTimeout(() => router.replace(`/exam/results/${params.id}`), 2400);
      } catch (e) {
        submittedRef.current = false;
        setPhase("running");
        setSnatching(false);
        toast((e as Error).message, "error");
      }
    },
    [answers, params.id, router, toast]
  );

  // ---- Persistent countdown driven by an absolute deadline timestamp ----
  useEffect(() => {
    if (phase !== "running" || deadline === null) return;
    const tick = () => {
      const rem = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      setRemaining(rem);
      const now = Date.now();
      timeSpentRef.current[`__total`] = (timeSpentRef.current[`__total`] || 0) + (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (rem === 0 && !submittedRef.current) submit(true);
    };
    tick();
    lastTickRef.current = Date.now();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, deadline, submit]);

  // ---- Warning at 30 / 15 / 5 minutes ----
  const warnedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (phase !== "running") return;
    for (const mark of [1800, 900, 300]) {
      if (remaining === mark && !warnedRef.current.has(mark)) {
        warnedRef.current.add(mark);
        toast(`${mark / 60} minutes remaining.`, "info");
      }
    }
  }, [remaining, phase, toast]);

  // ---- Persist progress (palette state + time per question) ----
  useEffect(() => {
    if (phase !== "running") return;
    const id = setInterval(() => {
      fetch(`/api/attempts/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "progress", markedForReview: Array.from(marked), visited: Array.from(visited), timePerQuestion: timeSpentRef.current }),
      }).catch(() => null);
    }, 15000);
    return () => clearInterval(id);
  }, [phase, marked, visited, params.id]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    if (phase !== "running") return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") setCurrent((c) => Math.min((initial?.paper.questions.length ?? 1) - 1, c + 1));
      if (e.key === "ArrowLeft") setCurrent((c) => Math.max(0, c - 1));
      if (e.key.toLowerCase() === "m") markForReview();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) setShowSubmit(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, initial]);

  // ---- Autosave answers (debounced) ----
  const saveAnswer = useCallback(
    (questionId: string, response: string) => {
      if (saveTimers.current[questionId]) clearTimeout(saveTimers.current[questionId]);
      saveTimers.current[questionId] = setTimeout(() => {
        fetch(`/api/attempts/${params.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save", questionId, response }),
        }).catch(() => toast("Answer could not be saved — check your connection.", "error"));
      }, 600);
    },
    [params.id, toast]
  );

  function setAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswer(questionId, value);
  }

  function markForReview() {
    const q = initial?.paper.questions[current];
    if (!q) return;
    setMarked((prev) => {
      const next = new Set(prev);
      next.has(q.id) ? next.delete(q.id) : next.add(q.id);
      return next;
    });
  }

  function goTo(i: number) {
    setCurrent(i);
    const q = initial?.paper.questions[i];
    if (q) setVisited((prev) => new Set(prev).add(q.id));
  }

  const questions = initial?.paper.questions ?? [];
  const q = questions[current];
  const answeredCount = questions.filter((x) => (answers[x.id] || "").trim().length > 0).length;
  const unanswered = questions.filter((x) => !(answers[x.id] || "").trim()).length;

  const status = (qq: Q) => {
    const answered = (answers[qq.id] || "").trim().length > 0;
    if (marked.has(qq.id)) return "review";
    if (answered) return "answered";
    if (visited.has(qq.id)) return "seen";
    return "unseen";
  };

  if (loading || phase === "loading") return <div className="flex min-h-screen items-center justify-center"><Spinner label="Preparing exam hall…" /></div>;
  if (error) return <div className="p-xl"><ErrorState message={error} onRetry={reload} /></div>;
  if (!initial || !q) return null;

  const low = remaining <= 300;
  const mid = remaining <= 900 && remaining > 300;

  return (
    <div className="min-h-screen bg-canvas pb-xxl">
      {/* Exam top bar */}
      <header className="sticky top-0 z-20 border-b border-hairline-soft bg-canvas">
        <div className="flex flex-wrap items-center justify-between gap-sm px-md py-sm lg:px-xl">
          <div className="min-w-0">
            <p className="truncate text-body-sm text-muted">{initial.paper.subjectName} · {initial.paper.mode} · {initial.paper.totalMarks} marks</p>
            <p className="truncate text-title text-ink">{initial.paper.title}</p>
          </div>
          <div className="flex items-center gap-sm">
            {ambience && (
              <div className={snatching ? "hidden" : ""}>
                <AmbiencePlayer url={ambience} volume={0.4} playSignal={playSignal} />
              </div>
            )}
            <div className={cn("rounded-full px-md py-xs text-title tabular-nums", low ? "bg-ink text-on-primary" : mid ? "bg-canvas-soft text-ink" : "bg-canvas-soft text-ink")}>
              <Bell size={14} className={cn("mr-xs inline", low && "bell-shake")} />
              {toHm(remaining)}
            </div>
            <Button onClick={() => setShowSubmit(true)} variant="primary">
              Submit
            </Button>
          </div>
        </div>
        {initial.strictMode ? (
          <p className="px-md pb-xs text-caption text-faint lg:px-xl">Strict mode · timer cannot be paused · progress saved automatically</p>
        ) : (
          <div className="flex items-center gap-xs px-md pb-xs lg:px-xl">
            <span className="text-caption text-faint">Practice mode</span>
            <button className="text-caption underline" onClick={() => setStrictPaused((p) => !p)}>
              {strictPaused ? "Resume timer" : "Pause timer"}
            </button>
          </div>
        )}
      </header>

      {snatching && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-canvas/80">
          <div className="invigilator-walk text-[120px]">🧑‍🏫</div>
          <div className="paper-snatch fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-canvas p-xl text-h4 text-ink shadow-overlay">
            Your answer sheet
          </div>
          <p className="fixed bottom-[30%] left-1/2 -translate-x-1/2 text-h3 text-ink">Time&apos;s up — the invigilator has collected your paper.</p>
        </div>
      )}

      <div className="grid gap-lg px-md py-lg lg:grid-cols-[1fr_300px] lg:px-xl">
        {/* Question panel */}
        <div>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-sm">
              <div className="flex items-center gap-xs">
                <Badge tone="ink">Q{q.number}</Badge>
                <Badge tone="outline">{q.type.replace("_", " ")}</Badge>
                <Badge tone="neutral">{q.marks} mark{q.marks > 1 ? "s" : ""}</Badge>
                {q.choiceGroup != null && <Badge tone="neutral">internal choice</Badge>}
              </div>
              <button onClick={markForReview} className={cn("flex items-center gap-xs rounded-full px-sm py-xs text-caption", marked.has(q.id) ? "bg-ink text-on-primary" : "bg-canvas-soft text-muted")}>
                <Flag size={12} /> {marked.has(q.id) ? "Marked for review" : "Mark for review"}
              </button>
            </div>

            <p className="mt-md whitespace-pre-wrap text-body text-ink">{q.text}</p>

            <div className="mt-lg">
              {OBJECTIVE.has(q.type) && q.options.length > 0 && (
                <div className="flex flex-col gap-xs">
                  {q.options.map((opt) => (
                    <label key={opt.id} className={cn("flex cursor-pointer items-start gap-sm rounded-sm border px-md py-sm text-body-sm", answers[q.id] === opt.id ? "border-ink bg-canvas-soft" : "border-hairline-soft hover:bg-canvas-soft")}>
                      <input type="radio" name={q.id} className="mt-1 accent-ink" checked={answers[q.id] === opt.id} onChange={() => setAnswer(q.id, opt.id)} />
                      <span className="text-ink">
                        <span className="font-semibold">{opt.id.toUpperCase()}.</span> {opt.text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
              {q.type === "TRUE_FALSE" && q.options.length === 0 && (
                <Segmented options={[{ value: "true", label: "True" }, { value: "false", label: "False" }]} value={(answers[q.id] as string) || ""} onChange={(v) => setAnswer(q.id, v)} />
              )}
              {(q.type === "SHORT" || q.type === "LONG" || q.type === "CASE" || q.type === "NUMERICAL" || q.type === "DERIVATION") && (
                <textarea
                  className="input min-h-40 resize-y"
                  placeholder={q.type === "NUMERICAL" ? "Show all working and state the final answer with units…" : "Write your answer…"}
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                />
              )}
              {q.type === "MATCHING" && (
                <input className="input" placeholder="e.g. a-p, b-q, c-r, d-s" value={answers[q.id] || ""} onChange={(e) => setAnswer(q.id, e.target.value)} />
              )}
            </div>

            {!initial.strictMode && revealed.has(q.id) && (
              <p className="mt-md rounded-sm bg-canvas-soft p-sm text-body-sm text-ink">Reference answer (practice mode): showing solution preview is disabled during strict exams only.</p>
            )}

            <div className="mt-lg flex items-center justify-between">
              <Button variant="outline" onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}>
                <ChevronLeft size={16} /> Previous
              </Button>
              <span className="text-caption text-muted">
                {current + 1} / {questions.length}
              </span>
              {current === questions.length - 1 ? (
                <Button onClick={() => setShowSubmit(true)}>
                  Review & submit <Send size={14} />
                </Button>
              ) : (
                <Button variant="outline" onClick={() => goTo(Math.min(questions.length - 1, current + 1))}>
                  Next <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </Card>
          <p className="mt-xs text-center text-caption text-faint">Shortcuts: ← → to move, M to mark for review, Ctrl/⌘+Enter to submit</p>
        </div>

        {/* Question palette */}
        <aside className="lg:sticky lg:top-28 lg:h-fit">
          <Card>
            <div className="flex items-center justify-between">
              <h3 className="text-title text-ink">Question palette</h3>
              <button className="text-caption text-muted underline lg:hidden" onClick={() => setShowPalette((p) => !p)}>
                {showPalette ? "Hide" : "Show"}
              </button>
            </div>
            <div className={cn("mt-sm", !showPalette && "hidden lg:block")}>
              <div className="grid grid-cols-6 gap-xs">
                {questions.map((qq, i) => {
                  const s = status(qq);
                  const active = i === current;
                  return (
                    <button
                      key={qq.id}
                      onClick={() => goTo(i)}
                      aria-label={`Question ${qq.number}, ${s}`}
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-sm text-body-sm transition-colors",
                        active && "ring-2 ring-ink",
                        s === "answered" && "bg-ink text-on-primary",
                        s === "review" && "bg-canvas-soft text-ink border border-ink",
                        s === "seen" && "bg-canvas-soft text-muted",
                        s === "unseen" && "bg-field text-faint"
                      )}
                    >
                      {qq.number}
                    </button>
                  );
                })}
              </div>
              <div className="mt-md flex flex-wrap gap-xs text-caption text-muted">
                <span className="flex items-center gap-xs"><span className="inline-block h-3 w-3 rounded-sm bg-ink" /> Answered ({answeredCount})</span>
                <span className="flex items-center gap-xs"><span className="inline-block h-3 w-3 rounded-sm border border-ink bg-canvas-soft" /> Review ({marked.size})</span>
                <span className="flex items-center gap-xs"><span className="inline-block h-3 w-3 rounded-sm bg-field" /> Unanswered ({unanswered})</span>
              </div>
            </div>
          </Card>
        </aside>
      </div>

      <Modal open={showSubmit} onClose={() => setShowSubmit(false)} title="Submit examination?">
        <p className="text-body text-ink">
          You have answered <strong>{answeredCount}</strong> of <strong>{questions.length}</strong> questions.
          {unanswered > 0 && ` ${unanswered} question(s) are still unanswered.`}
        </p>
        <ul className="mt-sm max-h-40 overflow-y-auto text-body-sm text-muted">
          {questions.filter((x) => !(answers[x.id] || "").trim()).map((x) => (
            <li key={x.id}>• Question {x.number} unanswered</li>
          ))}
        </ul>
        <div className="mt-lg flex justify-end gap-xs">
          <Button variant="outline" onClick={() => setShowSubmit(false)}>
            Keep working
          </Button>
          <Button onClick={() => submit(false)}>Submit paper</Button>
        </div>
      </Modal>
    </div>
  );
}
