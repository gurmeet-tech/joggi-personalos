"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  FlaskConical,
  BookOpen,
  CalendarRange,
  RotateCcw,
  NotebookPen,
  Mic,
  Briefcase,
  ListTodo,
  Target,
  BarChart3,
  Sparkles,
  Settings,
  Search,
  Bell,
  Plus,
  Menu,
  X,
  User,
} from "lucide-react";
import { cn, greetingForHour, initials } from "@/lib/utils";
import { Badge } from "@/components/ui";

const NAV_GROUPS: Array<{ label: string; items: Array<{ href: string; label: string; icon: React.ElementType }> }> = [
  {
    label: "Command",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
      { href: "/assistant", label: "AI assistant", icon: Sparkles },
    ],
  },
  {
    label: "Study",
    items: [
      { href: "/exam-studio", label: "AI Exam Studio", icon: FlaskConical },
      { href: "/syllabus", label: "Subjects & syllabus", icon: BookOpen },
      { href: "/planner", label: "Study planner", icon: CalendarRange },
      { href: "/revision", label: "Revision center", icon: RotateCcw },
      { href: "/mistakes", label: "Mistake notebook", icon: NotebookPen },
    ],
  },
  {
    label: "Skills",
    items: [
      { href: "/english", label: "English lab", icon: Mic },
      { href: "/freelance", label: "Freelance CRM", icon: Briefcase },
    ],
  },
  {
    label: "Life",
    items: [
      { href: "/tasks", label: "Tasks & calendar", icon: ListTodo },
      { href: "/habits", label: "Habits & goals", icon: Target },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "System",
    items: [{ href: "/settings", label: "Settings", icon: Settings }],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-lg overflow-y-auto px-sm py-md" aria-label="Primary">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="label-cap mb-xs px-md">{group.label}</div>
          <div className="flex flex-col gap-xxs">
            {group.items.map((item) => {
              const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn("nav-row", active ? "nav-row-active" : "nav-row-idle")}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function QuickAdd({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const items = [
    { label: "Task", href: "/tasks?new=1" },
    { label: "Study session", href: "/planner?new=1" },
    { label: "Exam paper", href: "/exam-studio" },
    { label: "Goal", href: "/habits?new=goal" },
    { label: "Freelance lead", href: "/freelance?new=1" },
    { label: "Mistake", href: "/mistakes?new=1" },
    { label: "Journal entry", href: "/habits?new=journal" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 pt-section" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="fade-up w-full max-w-md rounded-md bg-canvas p-md shadow-overlay">
        <div className="mb-sm flex items-center justify-between">
          <h2 className="text-title text-ink">Quick add</h2>
          <button onClick={onClose} aria-label="Close quick add" className="rounded-full p-xs text-muted hover:bg-canvas-soft">
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-xxs">
          {items.map((i) => (
            <button
              key={i.label}
              className="nav-row nav-row-idle text-left"
              onClick={() => {
                onClose();
                router.push(i.href);
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; onboarded: boolean }>({ name: "Student", onboarded: false });
  const [dueCount, setDueCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const isExam = pathname.startsWith("/exam/active");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setProfile({ name: p.name || "Student", onboarded: !!p.onboarded });
        if (!p.onboarded) router.replace("/onboarding");
      })
      .catch(() => {});
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setDueCount((d.revisionDue?.length || 0) + (d.overdueTasks?.length || 0)))
      .catch(() => {});
  }, [pathname, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuickOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  if (isExam) return <>{children}</>;

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar — floating canvas-soft column per design system */}
      <aside className="fixed inset-y-lg left-lg z-30 hidden w-64 flex-col rounded-md bg-canvas-soft lg:flex">
        <Link href="/dashboard" className="flex items-center gap-sm px-md pt-md">
          <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-ink text-label text-on-primary" style={{ borderRadius: "30%" }}>
            OS
          </span>
          <span className="text-title text-ink">MY OS</span>
        </Link>
        <div className="mt-sm flex-1 overflow-hidden">
          <NavLinks />
        </div>
        <div className="px-md pb-md">
          <button className="btn-primary w-full" onClick={() => setQuickOpen(true)}>
            <Plus size={16} /> Quick add
          </button>
          <p className="mt-xs text-center text-caption text-faint">Ctrl / ⌘ + K</p>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-ink/30 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setMobileOpen(false)}>
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto rounded-r-md bg-canvas-soft">
            <div className="flex items-center justify-between px-md pt-md">
              <span className="text-title text-ink">MY OS</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-full p-xs text-muted hover:bg-field">
                <X size={18} />
              </button>
            </div>
            <NavLinks onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-[17rem]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-hairline-soft bg-canvas/95 backdrop-blur">
          <div className="flex items-center gap-sm px-md py-sm lg:px-xl">
            <button className="rounded-full p-xs text-ink hover:bg-canvas-soft lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-body-sm text-muted">{dateLabel}</p>
              <p className="truncate text-title text-ink">
                {greetingForHour(now.getHours())}, {profile.name.split(" ")[0]}.
              </p>
            </div>
            <button
              className="hidden items-center gap-xs rounded-full bg-canvas-soft px-sm py-xs text-body-sm text-muted hover:text-ink md:flex"
              onClick={() => router.push("/assistant")}
            >
              <Search size={14} /> Ask anything…
            </button>
            <button
              className="relative rounded-full p-sm text-ink hover:bg-canvas-soft"
              aria-label={dueCount ? `${dueCount} items need attention` : "Notifications"}
              onClick={() => router.push("/dashboard")}
            >
              <Bell size={18} />
              {dueCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-xxs text-[10px] font-semibold text-on-primary">
                  {dueCount > 9 ? "9+" : dueCount}
                </span>
              )}
            </button>
            <button className="flex items-center gap-xs rounded-full bg-canvas-soft py-xs pl-xs pr-sm text-body-sm text-ink hover:opacity-80" onClick={() => router.push("/settings")}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-label text-on-primary">{initials(profile.name)}</span>
              <span className="hidden sm:inline">Profile</span>
            </button>
          </div>
        </header>

        <main className="px-md py-lg lg:px-xl">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hairline-soft bg-canvas lg:hidden" aria-label="Mobile">
        <div className="flex items-stretch justify-around py-xs">
          {[
            { href: "/dashboard", label: "Home", icon: LayoutGrid },
            { href: "/exam-studio", label: "Exams", icon: FlaskConical },
            { href: "/tasks", label: "Tasks", icon: ListTodo },
            { href: "/english", label: "Speak", icon: Mic },
            { href: "/analytics", label: "Stats", icon: BarChart3 },
          ].map((i) => {
            const active = pathname === i.href || (i.href !== "/dashboard" && pathname.startsWith(i.href));
            const Icon = i.icon;
            return (
              <Link key={i.href} href={i.href} className={cn("flex flex-col items-center gap-xxs rounded-full px-sm py-xs text-caption", active ? "text-ink" : "text-faint")}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.6} />
                {i.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="h-16 lg:hidden" />

      {quickOpen && <QuickAdd onClose={() => setQuickOpen(false)} />}
      {!profile.onboarded && <Badge className="sr-only">setup required</Badge>}
    </div>
  );
}
