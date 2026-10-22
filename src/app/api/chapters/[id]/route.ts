import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "STUDIED", "REVISION_REQUIRED", "TEST_PENDING", "MASTERED"]).optional(),
  confidence: z.number().int().min(1).max(5).optional(),
  completion: z.number().int().min(0).max(100).optional(),
  order: z.number().int().min(0).optional(),
  lastStudiedAt: z.string().nullable().optional(),
  weakConcepts: z.array(z.string()).optional(),
  nextRevisionAt: z.string().nullable().optional(),
  topics: z.array(z.object({ name: z.string().min(1), mastered: z.boolean().optional() })).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid chapter data." }, { status: 400 });
  const { topics, weakConcepts, lastStudiedAt, nextRevisionAt, ...rest } = parsed.data;
  try {
    if (topics) {
      await db.topic.deleteMany({ where: { chapterId: params.id } });
      await db.topic.createMany({ data: topics.map((t) => ({ chapterId: params.id, name: t.name, mastered: t.mastered ?? false })) });
    }
    const chapter = await db.chapter.update({
      where: { id: params.id },
      data: {
        ...rest,
        ...(weakConcepts ? { weakConcepts: JSON.stringify(weakConcepts) } : {}),
        ...(lastStudiedAt !== undefined ? { lastStudiedAt: lastStudiedAt ? new Date(lastStudiedAt) : null } : {}),
        ...(nextRevisionAt !== undefined ? { nextRevisionAt: nextRevisionAt ? new Date(nextRevisionAt + "T00:00:00.000Z") : null } : {}),
      },
      include: { topics: true },
    });
    return NextResponse.json(chapter);
  } catch {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.chapter.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
  }
}
