"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi, Card, Button, Spinner, ErrorState, Badge, Field, Input, useToast } from "@/components/ui";
import { isValidVideoUrl, youtubeIdFromUrl } from "@/lib/utils";
import { Clock, FileText, AlertTriangle, Play, Check } from "lucide-react";

interface Paper {
  id: string;
  title: string;
  mode: string;
  totalMarks: number;
  durationMinutes: number;
  instructions: string[];
  markingScheme: { negativeMarking?: boolean; notes?: string };
  subjectName: string;
  isDemo: boolean;
  questions: Array<{ id: string; type: string; marks: number }>;
}
interface Profile {
  ambienceVideoUrl: string;
  ambienceVolume: number;
  strictMode: boolean;
}

export default function ExamBriefPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const toast = useToast();
  const { data: paper, loading, error, reload } = useApi<Paper>(`/api/papers/${params.id}`);
  const { data: profile } = useApi<Profile>("/api/profile");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  if (loading) return <Spinner label="Loading paper…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!paper) return null;

  const effectiveVideo = videoUrl ?? profile?.ambienceVideoUrl ?? "";
  const validation = effectiveVideo ? isValidVideoUrl(effectiveVideo) : { ok: true };
  const typeCounts = paper.questions.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] || 0) + 1;
    return acc;
  }, {});

  async function start() {
    setStarting(true);
    try {
      if (effectiveVideo && !validation.ok) {
        toast("Fix the exam ambience video URL before starting.", "error");
        setStarting(false);
        return;
      }
      const res = await fetch("/api/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId: paper!.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not start attempt.");
      const attempt = await res.json();
      router.push(`/exam/active/${attempt.id}`);
    } catch (e) {
      toast((e as Error).message, "error");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl pb-xxl">
      <p className="label-cap">Examination brief</p>
      <h1 className="mt-xs text-h2 text-ink">{paper.title}</h1>
      <div className="mt-sm flex flex-wrap gap-xs">
        <Badge tone="outline">{paper.subjectName}</Badge>
        <Badge tone="outline">{paper.mode}</Badge>
        {paper.isDemo && <Badge tone="neutral">demo-generated</Badge>}
      </div>

      <div className="mt-lg grid grid-cols-2 gap-md sm:grid-cols-4">
        {[
          { label: "Max marks", value: paper.totalMarks },
          { label: "Duration", value: `${paper.durationMinutes}m` },
          { label: "Questions", value: paper.questions.length },
        ].map((s) => (
          <Card key={s.label} soft>
            <p className="label-cap">{s.label}</p>
            <p className="mt-xxs text-h4 text-ink">{s.value}</p>
          </Card>
        ))}
        <Card soft>
          <p className="label-cap">Strict mode</p>
          <p className="mt-xxs text-h4 text-ink">{profile?.strictMode === false ? "Off" : "On"}</p>
        </Card>
      </div>

      <Card className="mt-lg">
        <h3 className="flex items-center gap-xs text-title text-ink">
          <FileText size={16} /> Question breakdown
        </h3>
        <div className="mt-sm flex flex-wrap gap-xs">
          {Object.entries(typeCounts).map(([t, c]) => (
            <Badge key={t} tone="neutral">
              {t.replace("_", " ")} × {c}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="mt-md">
        <h3 className="flex items-center gap-xs text-title text-ink">
          <AlertTriangle size={16} /> Exam instructions
        </h3>
        <ol className="mt-sm flex flex-col gap-xs">
          {paper.instructions.map((ins, i) => (
            <li key={i} className="flex gap-sm text-body-sm text-ink">
              <span className="text-muted">{i + 1}.</span> {ins}
            </li>
          ))}
        </ol>
        {paper.markingScheme?.negativeMarking && (
          <p className="mt-sm rounded-sm bg-canvas-soft px-sm py-xs text-body-sm text-ink">
            Negative marking is active: {paper.markingScheme.notes || "⅓ mark deducted per incorrect objective answer."}
          </p>
        )}
      </Card>

      <Card className="mt-md">
        <h3 className="flex items-center gap-xs text-title text-ink">
          <Clock size={16} /> Exam hall ambience
        </h3>
        <p className="mt-sm text-body-sm text-muted">
          The supplied video plays audio-only during the exam to simulate an exam hall. Its visuals stay hidden. If your browser blocks autoplay, an “Enable exam audio” button will appear once the exam starts.
        </p>
        <div className="mt-md">
          <Field label="Ambience video URL" hint="YouTube link or direct .mp4/.webm/.mp3 file URL.">
            <Input value={effectiveVideo} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://youtu.be/…" />
          </Field>
          {effectiveVideo && !validation.ok && <p className="mt-xs text-body-sm text-ink">{validation.error}</p>}
          {effectiveVideo && validation.ok && (
            <p className="mt-xs flex items-center gap-xs text-body-sm text-muted">
              <Check size={14} /> Valid {validation.kind === "youtube" ? "YouTube" : "media"} link.
            </p>
          )}
        </div>
      </Card>

      <Card className="mt-lg" soft>
        <p className="text-body text-ink">
          {profile?.strictMode === false
            ? "Practice mode: the timer can be paused, and you may reveal answers mid-exam."
            : "Strict mode: the timer cannot be paused. Refreshing the page preserves your remaining time and answers. The paper auto-submits at zero."}
        </p>
      </Card>

      <Button className="mt-lg w-full" onClick={start} disabled={starting || !validation.ok}>
        {starting ? <Spinner label="Preparing exam…" /> : <><Play size={16} /> Start examination</>}
      </Button>
      <p className="mt-sm text-center text-caption text-faint">
        Starting begins the countdown immediately. {youtubeIdFromUrl(effectiveVideo) ? "Audio playback will be attempted automatically." : ""}
      </p>
    </div>
  );
}
