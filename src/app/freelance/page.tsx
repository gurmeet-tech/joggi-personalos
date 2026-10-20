"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Field, Input, Select, Modal, useToast, EmptyState, Stat } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/utils";
import { Plus, Trash2, Sparkles, Copy, Briefcase, Send } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  company: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  source: string | null;
  service: string;
  estimatedValue: number | null;
  status: string;
  notes: string | null;
  nextAction: string | null;
  nextFollowUpAt: string | null;
  lastFollowUpAt: string | null;
  lostReason: string | null;
  messages: Array<{ role: string; content: string; createdAt: string }>;
}
interface Data {
  leads: Lead[];
  stages: Array<{ status: string; count: number }>;
  metrics: {
    total: number;
    contacted: number;
    replied: number;
    qualified: number;
    proposals: number;
    won: number;
    lost: number;
    revenue: number;
    avgDeal: number;
    outreachToReplyRate: number | null;
    replyToQualifiedRate: number | null;
    proposalToCloseRate: number | null;
    overallConversionRate: number | null;
    followUpsDue: number;
    note: string;
  };
}

const STATUSES = ["LEAD", "CONTACTED", "REPLIED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"];
const STATUS_LABEL: Record<string, string> = {
  LEAD: "Lead",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  QUALIFIED: "Qualified",
  PROPOSAL_SENT: "Proposal sent",
  NEGOTIATION: "Negotiation",
  WON: "Won",
  LOST: "Lost",
};

export default function FreelancePage() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi<Data>("/api/leads");
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState<Lead | null>(null);
  const [draftKind, setDraftKind] = useState("OUTREACH");
  const [draft, setDraft] = useState<string>("");
  const [drafting, setDrafting] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", service: "", estimatedValue: "", contactEmail: "", source: "" });

  const today = todayISO();

  async function addLead() {
    if (!form.name.trim() || !form.service.trim()) {
      toast("Name and service are required.", "error");
      return;
    }
    await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        company: form.company || null,
        service: form.service,
        estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : null,
        contactEmail: form.contactEmail || null,
        source: form.source || null,
      }),
    }).catch(() => null);
    toast("Lead added.", "success");
    setShowAdd(false);
    setForm({ name: "", company: "", service: "", estimatedValue: "", contactEmail: "", source: "" });
    reload();
  }

  async function patch(body: Record<string, unknown>) {
    await fetch("/api/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => null);
    reload();
  }

  async function generateDraft(kind: string, lead: Lead) {
    setDrafting(true);
    setDraftKind(kind);
    try {
      const res = await fetch("/api/ai/freelance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          name: lead.name,
          service: lead.service,
          value: lead.estimatedValue ? String(lead.estimatedValue) : undefined,
          context: lead.notes || undefined,
        }),
      });
      const json = await res.json();
      setDraft(json.text || "Could not generate a draft.");
    } catch {
      setDraft("Could not generate a draft.");
    } finally {
      setDrafting(false);
    }
  }

  if (loading) return <Spinner label="Loading pipeline…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const metrics = data?.metrics;
  const rateLabel = (r: number | null) => (r == null ? "—" : `${r}%`);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Income</p>
          <h1 className="mt-xs text-h2 text-ink">Freelance CRM.</h1>
          <p className="mt-sm text-body text-muted">Track every lead, never miss a follow-up, and let the assistant draft your messages.</p>
        </div>
        <div className="flex gap-xs">
          <Button variant="outline" onClick={() => setView((v) => (v === "pipeline" ? "list" : "pipeline"))}>
            <Briefcase size={16} /> {view === "pipeline" ? "List view" : "Pipeline view"}
          </Button>
          <Button onClick={() => setShowAdd(true)}>
            <Plus size={16} /> New lead
          </Button>
        </div>
      </div>

      <div className="grid gap-md md:grid-cols-4">
        <Stat label="Pipeline" value={metrics?.total ?? 0} sub={`${metrics?.won ?? 0} won · ${metrics?.lost ?? 0} lost`} />
        <Stat label="Revenue won" value={`₹${(metrics?.revenue ?? 0).toLocaleString("en-IN")}`} sub={`avg deal ₹${(metrics?.avgDeal ?? 0).toLocaleString("en-IN")}`} />
        <Stat label="Close rate" value={rateLabel(metrics?.proposalToCloseRate ?? null)} sub={metrics?.note.split(";")[0]} />
        <Stat label="Follow-ups due" value={metrics?.followUpsDue ?? 0} sub={metrics?.followUpsDue ? "Action today" : "All clear"} />
      </div>

      <Card soft className="mt-md">
        <p className="text-caption text-muted">
          Funnel — outreach→reply <span className="text-ink">{rateLabel(metrics?.outreachToReplyRate ?? null)}</span> · reply→qualified{" "}
          <span className="text-ink">{rateLabel(metrics?.replyToQualifiedRate ?? null)}</span> · proposal→close{" "}
          <span className="text-ink">{rateLabel(metrics?.proposalToCloseRate ?? null)}</span> · overall{" "}
          <span className="text-ink">{rateLabel(metrics?.overallConversionRate ?? null)}</span>
        </p>
      </Card>

      {!data?.leads.length && (
        <EmptyState title="No leads yet" description="Add your first prospect to start tracking outreach and revenue." action={<Button onClick={() => setShowAdd(true)}>Add lead</Button>} />
      )}

      {view === "pipeline" && data?.leads.length ? (
        <div className="mt-lg grid gap-md md:grid-cols-2 xl:grid-cols-4">
          {STATUSES.filter((s) => !["WON", "LOST"].includes(s)).map((st) => {
            const leads = data.leads.filter((l) => l.status === st);
            return (
              <div key={st} className="rounded-md bg-canvas-soft p-sm">
                <div className="mb-xs flex items-center justify-between">
                  <span className="label-cap">{STATUS_LABEL[st]}</span>
                  <Badge tone="neutral">{leads.length}</Badge>
                </div>
                <div className="flex flex-col gap-xs">
                  {leads.map((l) => (
                    <button key={l.id} onClick={() => { setDetail(l); setDraft(""); }} className="card w-full p-sm text-left hover:opacity-80">
                      <p className="text-body-sm text-ink">{l.name}</p>
                      <p className="truncate text-caption text-muted">{l.service}</p>
                      <div className="mt-xs flex items-center justify-between">
                        {l.estimatedValue != null && <span className="text-caption text-ink">₹{l.estimatedValue.toLocaleString("en-IN")}</span>}
                        {l.nextFollowUpAt && (
                          <span className={`text-caption ${l.nextFollowUpAt <= today ? "text-ink font-medium" : "text-muted"}`}>
                            {l.nextFollowUpAt <= today ? "due " : ""}{formatDate(l.nextFollowUpAt)}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                  {!leads.length && <p className="text-caption text-faint">Empty</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "list" || data?.leads.length === 0 ? (
        <Card className="mt-lg">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-body-sm">
              <thead>
                <tr className="border-b border-hairline-soft">
                  {["Name", "Service", "Value", "Status", "Follow-up", ""].map((h) => (
                    <th key={h} className="pb-xs text-label text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.leads.map((l) => (
                  <tr key={l.id} className="border-b border-hairline-soft last:border-0">
                    <td className="py-sm">
                      <button onClick={() => setDetail(l)} className="text-ink hover:underline">
                        {l.name}
                        {l.company && <span className="block text-caption text-muted">{l.company}</span>}
                      </button>
                    </td>
                    <td className="py-sm text-muted">{l.service}</td>
                    <td className="py-sm text-ink">{l.estimatedValue != null ? `₹${l.estimatedValue.toLocaleString("en-IN")}` : "—"}</td>
                    <td className="py-sm">
                      <select
                        value={l.status}
                        onChange={(e) => patch({ id: l.id, status: e.target.value })}
                        className="input !w-auto !py-xxs !text-caption"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-sm text-muted">{l.nextFollowUpAt ? formatDate(l.nextFollowUpAt) : "—"}</td>
                    <td className="py-sm text-right">
                      <button onClick={() => patch({ id: l.id, delete: true })} aria-label="Delete" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="New lead">
        <div className="flex flex-col gap-md">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Company / business">
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </Field>
            <Field label="Source">
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="Instagram, referral…" />
            </Field>
          </div>
          <Field label="Service offered">
            <Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="e.g. Thumbnail design" />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Estimated value (₹)">
              <Input type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </Field>
          </div>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button onClick={addLead}>Add lead</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? "Lead"} wide>
        {detail && (
          <div className="flex flex-col gap-md">
            <div className="flex flex-wrap items-center gap-xs">
              <Badge tone="ink">{STATUS_LABEL[detail.status]}</Badge>
              {detail.estimatedValue != null && <Badge tone="outline">₹{detail.estimatedValue.toLocaleString("en-IN")}</Badge>}
              {detail.source && <Badge tone="neutral">{detail.source}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-sm">
              <Field label="Status">
                <Select value={detail.status} onChange={(e) => { patch({ id: detail.id, status: e.target.value }); setDetail({ ...detail, status: e.target.value }); }}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Next follow-up">
                <Input type="date" value={detail.nextFollowUpAt ?? ""} onChange={(e) => { patch({ id: detail.id, nextFollowUpAt: e.target.value || null }); setDetail({ ...detail, nextFollowUpAt: e.target.value || null }); }} />
              </Field>
            </div>
            <Field label="Next action">
              <Input value={detail.nextAction ?? ""} onChange={(e) => setDetail({ ...detail, nextAction: e.target.value })} onBlur={() => patch({ id: detail.id, nextAction: detail.nextAction })} placeholder="e.g. Send revised quote" />
            </Field>
            <Field label="Notes">
              <textarea className="input min-h-20 resize-y" value={detail.notes ?? ""} onChange={(e) => setDetail({ ...detail, notes: e.target.value })} onBlur={() => patch({ id: detail.id, notes: detail.notes })} />
            </Field>

            <div className="rounded-sm border border-hairline-soft p-md">
              <div className="flex flex-wrap items-center justify-between gap-sm">
                <h4 className="flex items-center gap-xs text-title text-ink">
                  <Sparkles size={16} /> AI message drafting
                </h4>
                <div className="flex flex-wrap gap-xs">
                  {["OUTREACH", "FOLLOWUP", "PROPOSAL", "OBJECTION"].map((k) => (
                    <Button key={k} variant="soft" className="!min-h-8 !text-caption" onClick={() => generateDraft(k, detail)}>
                      {k === "FOLLOWUP" ? "Follow-up" : k[0] + k.slice(1).toLowerCase()}
                    </Button>
                  ))}
                </div>
              </div>
              {drafting ? (
                <p className="mt-sm text-body-sm text-muted">Drafting {draftKind.toLowerCase()}…</p>
              ) : draft ? (
                <>
                  <textarea className="input mt-sm min-h-32 resize-y" value={draft} onChange={(e) => setDraft(e.target.value)} />
                  <div className="mt-sm flex gap-xs">
                    <Button
                      variant="outline"
                      className="!min-h-8 !text-caption"
                      onClick={() => {
                        navigator.clipboard?.writeText(draft);
                        toast("Draft copied.", "success");
                      }}
                    >
                      <Copy size={12} /> Copy
                    </Button>
                    <Button
                      className="!min-h-8 !text-caption"
                      onClick={() => {
                        patch({ id: detail.id, message: draft });
                        toast("Draft saved to lead history.", "success");
                        setDraft("");
                      }}
                    >
                      <Send size={12} /> Save to lead
                    </Button>
                  </div>
                </>
              ) : (
                <p className="mt-sm text-body-sm text-muted">Pick a message type to draft outreach, follow-ups or proposal replies tailored to this lead.</p>
              )}
            </div>

            {detail.messages.length > 0 && (
              <div>
                <p className="label-cap">History</p>
                <ul className="mt-xs flex flex-col gap-xs">
                  {detail.messages.map((m, i) => (
                    <li key={i} className="rounded-sm bg-canvas-soft p-sm">
                      <p className="text-caption text-muted">{m.role} · {formatDate(m.createdAt)}</p>
                      <p className="whitespace-pre-wrap text-body-sm text-ink">{m.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
