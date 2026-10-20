import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";
import { parseJSON, todayISO } from "@/lib/utils";

const STATUSES = ["LEAD", "CONTACTED", "REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"] as const;

export async function GET() {
  const leads = await db.freelanceLead.findMany({ orderBy: { updatedAt: "desc" } });
  const serialised = leads.map((l) => ({ ...l, messages: parseJSON<Array<{ role: string; content: string; createdAt: string }>>(l.messages, []) }));
  const stageCounts: Record<string, number> = {};
  for (const s of STATUSES) stageCounts[s] = serialised.filter((l) => l.status === s).length;

  const total = serialised.length;
  const contacted = serialised.filter((l) => ["CONTACTED", "REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"].includes(l.status)).length;
  const replied = serialised.filter((l) => ["REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].includes(l.status)).length;
  const qualified = serialised.filter((l) => ["QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON"].includes(l.status)).length;
  const proposals = serialised.filter((l) => ["PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"].includes(l.status)).length;
  const won = serialised.filter((l) => l.status === "WON");
  const revenue = won.reduce((s, l) => s + (l.estimatedValue || 0), 0);

  const rate = (num: number, den: number) => (den < 5 ? null : Math.round((num / den) * 1000) / 10);

  return NextResponse.json({
    leads: serialised,
    stages: STATUSES.map((s) => ({ status: s, count: stageCounts[s] })),
    metrics: {
      total,
      contacted,
      replied,
      qualified,
      proposals,
      won: won.length,
      lost: serialised.filter((l) => l.status === "LOST").length,
      revenue,
      avgDeal: won.length ? Math.round(revenue / won.length) : 0,
      outreachToReplyRate: rate(replied, contacted),
      replyToQualifiedRate: rate(qualified, replied),
      proposalToCloseRate: rate(won.length, proposals),
      overallConversionRate: rate(won.length, total),
      followUpsDue: serialised.filter((l) => l.nextFollowUpAt && l.nextFollowUpAt <= todayISO() && !["WON", "LOST"].includes(l.status)).length,
      note: "Rates require at least 5 samples in the denominator; otherwise shown as 'not enough data'.",
    },
  });
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  company: z.string().max(100).nullable().optional(),
  contactEmail: z.string().max(150).nullable().optional(),
  contactPhone: z.string().max(30).nullable().optional(),
  source: z.string().max(60).nullable().optional(),
  service: z.string().min(1).max(200),
  estimatedValue: z.number().min(0).nullable().optional(),
  notes: z.string().max(4000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid lead." }, { status: 400 });
  const lead = await db.freelanceLead.create({ data: parsed.data });
  return NextResponse.json(lead, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = z
    .object({
      id: z.string().min(1),
      status: z.enum(STATUSES).optional(),
      nextFollowUpAt: z.string().nullable().optional(),
      lastFollowUpAt: z.string().nullable().optional(),
      nextAction: z.string().max(500).nullable().optional(),
      notes: z.string().max(4000).nullable().optional(),
      lostReason: z.string().max(300).nullable().optional(),
      estimatedValue: z.number().min(0).nullable().optional(),
      message: z.string().max(6000).optional(),
      delete: z.boolean().optional(),
    })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid update." }, { status: 400 });
  const { id, delete: del, message, ...rest } = parsed.data;
  if (del) {
    await db.freelanceLead.delete({ where: { id } }).catch(() => null);
    return NextResponse.json({ ok: true });
  }
  const lead = await db.freelanceLead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ error: "Lead not found." }, { status: 404 });
  const messages = parseJSON<Array<{ role: string; content: string; createdAt: string }>>(lead.messages, []);
  if (message) messages.push({ role: "draft", content: message, createdAt: new Date().toISOString() });
  const updated = await db.freelanceLead.update({
    where: { id },
    data: {
      ...rest,
      ...(rest.status && !rest.lastFollowUpAt && ["CONTACTED", "PROPOSAL_SENT"].includes(rest.status) ? { lastFollowUpAt: todayISO() } : {}),
      messages: JSON.stringify(messages),
    },
  });
  return NextResponse.json({ ...updated, messages });
}
