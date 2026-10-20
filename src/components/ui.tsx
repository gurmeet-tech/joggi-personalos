"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ---------- Button ----------

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "soft" | "ghost" }) {
  const v =
    variant === "primary" ? "btn-primary" : variant === "outline" ? "btn-outline" : variant === "soft" ? "btn-soft" : "btn text-muted hover:bg-canvas-soft";
  return <button className={cn(v, className)} {...props} />;
}

// ---------- Card ----------

export function Card({ className, soft, ...props }: React.HTMLAttributes<HTMLDivElement> & { soft?: boolean }) {
  return <div className={cn(soft ? "card-soft" : "card", className)} {...props} />;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-h4 text-ink", className)}>{children}</h3>;
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
      <div>
        <h1 className="text-h3 text-ink">{title}</h1>
        {subtitle && <p className="mt-xs max-w-2xl text-body text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------- Input primitives ----------

export function Field({ label, hint, className, children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={cn("block", className)}>
      <span className="label-cap mb-xs block">{label}</span>
      {children}
      {hint && <span className="mt-xs block text-caption text-faint">{hint}</span>}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("input", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn("input min-h-24 resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn("input cursor-pointer appearance-none bg-no-repeat pr-xl", props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23141414' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",
        backgroundPosition: "right 16px center",
      }}
    />
  );
}

export function Checkbox({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex cursor-pointer items-center gap-xs text-body-sm text-ink">
      <input type="checkbox" className="h-4 w-4 accent-ink" {...props} />
      {label}
    </label>
  );
}

// ---------- Badge / Progress ----------

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ink" | "accent" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-canvas-soft text-muted",
    ink: "bg-ink text-on-primary",
    accent: "bg-accent text-on-primary",
    outline: "border border-hairline text-ink",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-sm py-xxs text-label", tones[tone], className)}>{children}</span>;
}

export function Progress({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pctv = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-field", className)} role="progressbar" aria-valuenow={pctv} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-ink transition-all duration-300" style={{ width: `${pctv}%` }} />
    </div>
  );
}

export function Stat({ label, value, sub, hint }: { label: string; value: React.ReactNode; sub?: string; hint?: string }) {
  const caption = sub ?? hint;
  return (
    <div className="rounded-sm bg-canvas-soft px-md py-sm">
      <div className="label-cap">{label}</div>
      <div className="mt-xxs text-h4 text-ink">{value}</div>
      {caption && <div className="mt-xxs text-caption text-muted">{caption}</div>}
    </div>
  );
}

// ---------- Empty / Loading / Error states ----------

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center justify-center gap-sm py-xxl text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-canvas-soft">
        <span className="text-h4 text-faint">○</span>
      </div>
      <h3 className="text-title text-ink">{title}</h3>
      {description && <p className="max-w-md text-body-sm text-muted">{description}</p>}
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-sm py-xl text-body-sm text-muted" role="status">
      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-hairline border-t-ink" />
      {label || "Loading…"}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-hairline">
      <p className="text-body text-ink">{message}</p>
      {onRetry && (
        <Button variant="outline" className="mt-sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30 p-md sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cn("fade-up max-h-[88vh] w-full overflow-y-auto rounded-md bg-canvas p-xl shadow-overlay", wide ? "max-w-3xl" : "max-w-lg")} role="dialog" aria-modal="true" aria-label={title}>
        <div className="mb-md flex items-center justify-between gap-md">
          <h2 className="text-h4 text-ink">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-full p-xs text-muted hover:bg-canvas-soft hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------- Toast ----------

interface ToastItem {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}
const ToastCtx = createContext<(message: string, tone?: ToastItem["tone"]) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: string, tone: ToastItem["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-lg left-1/2 z-[60] flex w-full max-w-md -translate-x-1/2 flex-col gap-xs px-md">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "fade-up pointer-events-auto rounded-md px-md py-sm text-body-sm shadow-toast",
              t.tone === "error" ? "bg-ink text-on-primary" : t.tone === "success" ? "bg-ink text-on-primary" : "border border-hairline bg-canvas text-ink"
            )}
            role="alert"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------- Tabs ----------

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-xxs rounded-full bg-canvas-soft p-xxs", className)} role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn("rounded-full px-sm py-xs text-body-sm transition-colors", value === o.value ? "bg-canvas text-ink" : "text-muted hover:text-ink")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------- Quick fetch hook ----------

export function useApi<T>(url: string, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `Request failed (${r.status})`);
        return r.json();
      })
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError(null);
        }
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, tick, ...deps]);
  return { data, loading, error, reload };
}

export async function api<T = unknown>(url: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}
