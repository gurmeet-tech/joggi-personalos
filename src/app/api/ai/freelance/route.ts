import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { freelanceAssist } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      kind: z.enum(["OUTREACH", "FOLLOWUP", "PROPOSAL", "OBJECTION", "NEGOTIATION", "ANALYSIS"]),
      name: z.string().max(100).optional(),
      service: z.string().max(200).optional(),
      value: z.string().max(50).optional(),
      context: z.string().max(2000).optional(),
      lostReasons: z.array(z.string()).optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const result = await freelanceAssist(parsed.data.kind, parsed.data as Record<string, unknown>);
  return NextResponse.json(result);
}
