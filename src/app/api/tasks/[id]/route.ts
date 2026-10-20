import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).nullable().optional(),
  category: z.enum(["ACADEMICS", "ENGLISH", "FREELANCE", "PERSONAL", "HEALTH", "ADMIN", "OTHER"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "SKIPPED"]).optional(),
  dueAt: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  order: z.number().int().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid task update." }, { status: 400 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.tags) data.tags = JSON.stringify(parsed.data.tags);
  if (parsed.data.dueAt !== undefined) data.dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null;
  if (parsed.data.status === "DONE") data.completedAt = new Date().toISOString();
  if (parsed.data.status && parsed.data.status !== "DONE") data.completedAt = null;
  try {
    const task = await db.task.update({ where: { id: params.id }, data });
    // Spawn next recurring occurrence on completion
    if (parsed.data.status === "DONE") {
      const full = await db.task.findUnique({ where: { id: params.id } });
      if (full?.recurring) {
        try {
          const rule = JSON.parse(full.recurring) as { freq?: string; interval?: number };
          if (rule.freq) {
            const next = new Date(full.dueAt || Date.now());
            next.setDate(next.getDate() + (rule.interval || (rule.freq === "WEEKLY" ? 7 : rule.freq === "MONTHLY" ? 30 : 1)));
            await db.task.create({
              data: {
                title: full.title,
                description: full.description,
                category: full.category,
                priority: full.priority,
                dueAt: next.toISOString(),
                recurring: full.recurring,
                tags: full.tags,
                order: full.order,
              },
            });
          }
        } catch {
          /* ignore */
        }
      }
    }
    return NextResponse.json(task);
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.task.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }
}
