"use client";

import React, { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Music, AlertCircle } from "lucide-react";
import { isValidVideoUrl, youtubeIdFromUrl } from "@/lib/utils";
import { Button } from "@/components/ui";

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement | string, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (v: number) => void;
  destroy: () => void;
  getPlayerState: () => number;
}

export default function AmbiencePlayer({
  url,
  volume,
  playSignal,
  onStatus,
}: {
  url: string;
  volume: number;
  playSignal: number;
  onStatus?: (playing: boolean, blocked: boolean, error?: string) => void;
}) {
  const [blocked, setBlocked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(volume);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const validation = url ? isValidVideoUrl(url) : { ok: false as const, error: "" };

  // ---- YouTube path ----
  useEffect(() => {
    if (!validation.ok || validation.kind !== "youtube") return;
    const id = youtubeIdFromUrl(url);
    if (!id) return;

    function boot() {
      if (!containerRef.current || !window.YT?.Player) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: id,
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, modestbranding: 1, playsinline: 1, rel: 0, loop: 1, playlist: id },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            e.target.setVolume(vol * 100);
          },
          onStateChange: (e: { data: number }) => {
            const isPlaying = e.data === 1;
            setPlaying(isPlaying);
            setBlocked(false);
            onStatus?.(isPlaying, false);
          },
          onError: () => {
            setError("This YouTube video could not be loaded for embedding. Try a different link or a direct file URL.");
            onStatus?.(false, false, "embed failed");
          },
        },
      });
    }

    if (window.YT?.Player) boot();
    else {
      const existing = document.getElementById("yt-iframe-api");
      if (!existing) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        boot();
      };
    }
    return () => {
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  // ---- Direct file path ----
  useEffect(() => {
    if (!validation.ok || validation.kind !== "file") return;
    const el = videoRef.current;
    if (!el) return;
    el.volume = vol;
    el.muted = muted;
  }, [validation.ok, validation.kind, vol, muted]);

  // ---- Attempt playback on the play signal ----
  useEffect(() => {
    if (playSignal === 0) return;
    if (!validation.ok) return;
    if (validation.kind === "youtube") {
      const p = playerRef.current;
      if (!p) return;
      try {
        p.unMute();
        p.setVolume(vol * 100);
        p.playVideo();
        setTimeout(() => {
          if (p.getPlayerState() !== 1) setBlocked(true);
        }, 1200);
      } catch {
        setBlocked(true);
      }
    } else if (videoRef.current) {
      videoRef.current
        .play()
        .then(() => {
          setPlaying(true);
          setBlocked(false);
        })
        .catch(() => setBlocked(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSignal]);

  function enableAudio() {
    setBlocked(false);
    if (validation.kind === "youtube" && playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(vol * 100);
      playerRef.current.playVideo();
    } else if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.play().catch(() => setError("Playback was blocked. Check your browser's autoplay settings."));
    }
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    if (validation.kind === "youtube" && playerRef.current) {
      next ? playerRef.current.mute() : playerRef.current.unMute();
    } else if (videoRef.current) {
      videoRef.current.muted = next;
    }
  }

  function changeVol(v: number) {
    setVol(v);
    if (validation.kind === "youtube" && playerRef.current) playerRef.current.setVolume(v * 100);
    else if (videoRef.current) videoRef.current.volume = v;
  }

  if (!url || !validation.ok) return null;

  return (
    <div className="flex items-center gap-sm rounded-full bg-canvas-soft px-sm py-xs">
      <Music size={14} className={playing ? "text-ink" : "text-faint"} />
      <span className="hidden text-caption text-muted sm:inline">{playing ? "Exam hall ambience playing" : "Ambience ready"}</span>
      <button onClick={toggleMute} aria-label={muted ? "Unmute ambience" : "Mute ambience"} className="text-ink">
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={vol}
        onChange={(e) => changeVol(Number(e.target.value))}
        aria-label="Ambience volume"
        className="h-1 w-20 cursor-pointer accent-ink"
      />
      {blocked && (
        <Button variant="primary" className="!min-h-8 !py-0 !text-caption" onClick={enableAudio}>
          Enable exam audio
        </Button>
      )}
      {error && (
        <span className="flex items-center gap-xs text-caption text-ink">
          <AlertCircle size={12} /> {error}
        </span>
      )}
      <div className="ambience-audio-only" aria-hidden="true">
        <div ref={containerRef} />
        {validation.kind === "file" && <video ref={videoRef} src={url} loop playsInline preload="none" />}
      </div>
    </div>
  );
}
