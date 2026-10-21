export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateOffsetISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatTime(iso: string | Date | null | undefined): string {
  if (!iso) return "—";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function greetingForHour(hour: number): string {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late-night grind";
}

export function relativeDay(iso: string): string {
  const today = todayISO();
  if (iso === today) return "Today";
  const t = new Date(today + "T00:00:00");
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round((d.getTime() - t.getTime()) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  if (diff < -1 && diff > -7) return `${-diff} days ago`;
  return formatDate(iso);
}

export function streakFromDates(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (set.has(key)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (streak === 0 && cursor.toISOString().slice(0, 10) === todayISO()) {
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
    if (streak > 3650) break;
  }
  return streak;
}

export function daysUntil(targetISO: string): number {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(`${targetISO}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 0;
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const DELUSIONAL_QUOTES = [
  "Boards don't stand a chance. You're built different this year.",
  "You're not behind — you're just getting started, and you already know that.",
  "One chapter today beats a hundred excuses tomorrow.",
  "The version of you on result day is watching. Make him proud.",
  "You don't need motivation. You need to start — the fire comes after.",
  "Nobody's coming to save you. Good. You never needed saving anyway.",
  "Study like the rank is already yours and you're just claiming it.",
  "Discipline is just self-respect in action. Respect yourself today.",
  "You've survived worse weeks than this. This one's easy.",
  "Your future self is begging for the version of today you're about to build.",
  "Every mock test is a rehearsal for the day you win.",
  "Delusion check: you ARE that guy. Now go act like it.",
];

export function quoteForDay(seed: number): string {
  const i = Math.abs(Math.floor(seed)) % DELUSIONAL_QUOTES.length;
  return DELUSIONAL_QUOTES[i];
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function minutesToHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

export function toHm(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function youtubeIdFromUrl(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([\w-]{11})/,
    /(?:youtu\.be\/)([\w-]{11})/,
    /(?:youtube\.com\/embed\/)([\w-]{11})/,
    /(?:youtube\.com\/shorts\/)([\w-]{11})/,
    /^([\w-]{11})$/,
  ];
  for (const p of patterns) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export function isDirectMediaUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mp3|wav|m4a)(\?.*)?$/i.test(url.trim());
}

export function isValidVideoUrl(url: string): { ok: boolean; kind?: "youtube" | "file"; id?: string; error?: string } {
  const trimmed = (url || "").trim();
  if (!trimmed) return { ok: false, error: "Enter a video URL." };
  const yt = youtubeIdFromUrl(trimmed);
  if (yt) return { ok: true, kind: "youtube", id: yt };
  if (isDirectMediaUrl(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.protocol === "http:" || u.protocol === "https:") return { ok: true, kind: "file" };
    } catch {
      /* fallthrough */
    }
    return { ok: false, error: "Direct media URL must be a valid http(s) link." };
  }
  return {
    ok: false,
    error: "Unsupported link. Use a YouTube link (youtube.com/watch, youtu.be) or a direct .mp4/.webm/.mp3 file URL.",
  };
}
