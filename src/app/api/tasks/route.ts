import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { todayISO } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const where = {
    ...(sp.get("status") ? { status: sp.get("status")! } : {}),
    ...(sp.get("category") ? { category: sp.get("category")! } : {}),
    ...(sp.get("from") || sp.get("to")
      ? {
          dueAt: {
            ...(sp.get("from") ? { gte: sp.get("from")! } : {}),
            ...(sp.get("to") ? { lte: sp.get("to")! + "T23:59:59" } : {}),
          },
        }
      : {}),
  };
  const tasks = await db.task.findMany({ where, orderBy: [{ status: "asc" }, { dueAt: "asc" }, { order: "asc" }] });
  return NextResponse.json(tasks);
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).nullable().optional(),
  category: z.enum(["ACADEMICS", "ENGLISH", "FREELANCE", "PERSONAL", "HEALTH", "ADMIN", "OTHER"]).default("PERSONAL"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueAt: z.string().nullable().optional(),
  reminderAt: z.string().nullable().optional(),
  recurring: z.string().max(300).nullable().optional(),
  tags: z.array(z.string().max(30)).max(12).default([]),
  parentTaskId: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  const count = await db.task.count();
  const task = await db.task.create({
    data: {
      ...parsed.data,
      tags: JSON.stringify(parsed.data.tags),
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : todayISO() + "T21:00:00.000Z",
      order: count,
    },
  });
  // Recurring task: also create the next occurrence
  if (parsed.data.recurring) {
    try {
      const rule = JSON.parse(parsed.data.recurring) as { freq?: string; interval?: number };
      if (rule.freq) {
        const next = new Date();
        next.setDate(next.getDate() + (rule.interval || (rule.freq === "WEEKLY" ? 7 : rule.freq === "MONTHLY" ? 30 : 1)));
        await db.task.create({
          data: {
            ...parsed.data,
            tags: JSON.stringify(parsed.data.tags),
            dueAt: next.toISOString(),
            order: count + 1,
          },
        });
      }
    } catch {
      /* ignore malformed recurring rules */
    }
  }
  return NextResponse.json(task, { status: 201 });
}
