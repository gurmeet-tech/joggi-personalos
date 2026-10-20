"use client";

import React, { useState } from "react";
import { useApi, Card, Button, Badge, Spinner, ErrorState, Field, Input, Select, Modal, useToast, EmptyState, Checkbox, Segmented, Progress } from "@/components/ui";
import { formatDate, todayISO } from "@/lib/utils";
import { Plus, Trash2, Target, ListChecks } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  dueAt: string | null;
  tags: string;
}
interface Goal {
  id: string;
  title: string;
  description: string | null;
  type: string;
  category: string;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  deadline: string | null;
  status: string;
}

const CATEGORIES = ["ACADEMICS", "ENGLISH", "FREELANCE", "PERSONAL", "HEALTH", "ADMIN", "OTHER"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TasksPage() {
  const toast = useToast();
  const [tab, setTab] = useState<"tasks" | "goals">("tasks");
  const [filter, setFilter] = useState<"open" | "done" | "all">("open");
  const { data: tasks, loading, error, reload } = useApi<Task[]>("/api/tasks");
  const { data: goals, reload: reloadGoals } = useApi<Goal[]>("/api/goals");
  const [showTask, setShowTask] = useState(false);
  const [showGoal, setShowGoal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", category: "ACADEMICS", priority: "MEDIUM", dueAt: todayISO() });
  const [goalForm, setGoalForm] = useState({ title: "", type: "SHORT_TERM", category: "ACADEMICS", targetValue: "", unit: "", deadline: "" });

  async function addTask() {
    if (!taskForm.title.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...taskForm, dueAt: taskForm.dueAt ? taskForm.dueAt + "T18:00:00" : null }),
    }).catch(() => null);
    toast("Task added.", "success");
    setShowTask(false);
    setTaskForm({ title: "", category: "ACADEMICS", priority: "MEDIUM", dueAt: todayISO() });
    reload();
  }

  async function toggleTask(id: string, done: boolean) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: done ? "DONE" : "TODO" }),
    }).catch(() => null);
    reload();
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" }).catch(() => null);
    reload();
  }

  async function addGoal() {
    if (!goalForm.title.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: goalForm.title,
        type: goalForm.type,
        category: goalForm.category,
        targetValue: goalForm.targetValue ? Number(goalForm.targetValue) : null,
        unit: goalForm.unit || null,
        deadline: goalForm.deadline || null,
      }),
    }).catch(() => null);
    toast("Goal created.", "success");
    setShowGoal(false);
    setGoalForm({ title: "", type: "SHORT_TERM", category: "ACADEMICS", targetValue: "", unit: "", deadline: "" });
    reloadGoals();
  }

  async function nudgeGoal(id: string, currentValue: number) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, currentValue }),
    }).catch(() => null);
    reloadGoals();
  }

  async function completeGoal(id: string) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "COMPLETED" }),
    }).catch(() => null);
    reloadGoals();
  }

  async function deleteGoal(id: string) {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, delete: true }),
    }).catch(() => null);
    reloadGoals();
  }

  if (loading) return <Spinner label="Loading tasks…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const today = todayISO();
  const filteredTasks = (tasks ?? []).filter((t) => (filter === "open" ? t.status !== "DONE" : filter === "done" ? t.status === "DONE" : true));
  const openCount = (tasks ?? []).filter((t) => t.status !== "DONE").length;
  const overdue = (tasks ?? []).filter((t) => t.status !== "DONE" && t.dueAt && t.dueAt.slice(0, 10) < today).length;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <p className="label-cap">Execution</p>
          <h1 className="mt-xs text-h2 text-ink">Tasks & goals.</h1>
          <p className="mt-sm text-body text-muted">{openCount} open · {overdue} overdue.</p>
        </div>
        <Button onClick={() => (tab === "tasks" ? setShowTask(true) : setShowGoal(true))}>
          <Plus size={16} /> {tab === "tasks" ? "New task" : "New goal"}
        </Button>
      </div>

      <Segmented options={[{ value: "tasks", label: "Tasks" }, { value: "goals", label: "Goals" }]} value={tab} onChange={setTab} />

      {tab === "tasks" && (
        <>
          <div className="mt-md flex items-center gap-sm">
            <Segmented options={[{ value: "open", label: "Open" }, { value: "done", label: "Done" }, { value: "all", label: "All" }]} value={filter} onChange={setFilter} />
          </div>
          {!filteredTasks.length ? (
            <EmptyState title="No tasks here" description="Add a task to start planning your day." action={<Button onClick={() => setShowTask(true)}>Add task</Button>} />
          ) : (
            <div className="mt-md flex flex-col gap-xs">
              {filteredTasks.map((t) => {
                const isOverdue = t.status !== "DONE" && t.dueAt && t.dueAt.slice(0, 10) < today;
                return (
                  <Card key={t.id} soft className="flex items-center gap-sm">
                    <Checkbox label="" checked={t.status === "DONE"} onChange={(e) => toggleTask(t.id, e.target.checked)} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-body-sm ${t.status === "DONE" ? "line-through text-muted" : "text-ink"}`}>{t.title}</p>
                      <p className="text-caption text-muted">
                        {t.category} · {t.dueAt ? formatDate(t.dueAt) : "no date"}
                        {isOverdue && <span className="text-ink"> · overdue</span>}
                      </p>
                    </div>
                    {t.priority !== "MEDIUM" && <Badge tone={t.priority === "URGENT" || t.priority === "HIGH" ? "ink" : "neutral"}>{t.priority}</Badge>}
                    <button onClick={() => deleteTask(t.id)} aria-label="Delete" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                      <Trash2 size={14} />
                    </button>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "goals" && (
        <>
          {!goals?.length ? (
            <EmptyState title="No goals yet" description="Set a short-term, monthly or long-term goal to track measurable progress." action={<Button onClick={() => setShowGoal(true)}>Create goal</Button>} />
          ) : (
            <div className="mt-md grid gap-md md:grid-cols-2">
              {goals.map((g) => {
                const pct = g.targetValue ? Math.min(100, Math.round((g.currentValue / g.targetValue) * 100)) : 0;
                return (
                  <Card key={g.id} className={g.status === "COMPLETED" ? "opacity-60" : ""}>
                    <div className="flex items-start justify-between gap-sm">
                      <div className="flex items-start gap-xs">
                        <Target size={16} className="mt-xxs text-muted" />
                        <div>
                          <p className="text-title text-ink">{g.title}</p>
                          <p className="text-caption text-muted">
                            {g.type.replace("_", " ").toLowerCase()} · {g.category}
                            {g.deadline ? ` · by ${formatDate(g.deadline)}` : ""}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => deleteGoal(g.id)} aria-label="Delete" className="rounded-full p-xs text-muted hover:bg-field hover:text-ink">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {g.targetValue != null && (
                      <>
                        <div className="mt-sm flex items-center justify-between text-caption text-muted">
                          <span>
                            {g.currentValue} / {g.targetValue} {g.unit ?? ""}
                          </span>
                          <span>{pct}%</span>
                        </div>
                        <Progress className="mt-xs" value={g.currentValue} max={g.targetValue} />
                        <div className="mt-sm flex gap-xs">
                          <Button variant="soft" className="!min-h-8 !text-caption" onClick={() => nudgeGoal(g.id, g.currentValue + 1)}>
                            +1
                          </Button>
                          <Button variant="outline" className="!min-h-8 !text-caption" onClick={() => completeGoal(g.id)} disabled={g.status === "COMPLETED"}>
                            {g.status === "COMPLETED" ? "Completed" : "Mark complete"}
                          </Button>
                        </div>
                      </>
                    )}
                    {g.targetValue == null && g.status !== "COMPLETED" && (
                      <Button variant="outline" className="mt-sm !min-h-8 !text-caption" onClick={() => completeGoal(g.id)}>
                        Mark complete
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={showTask} onClose={() => setShowTask(false)} title="New task">
        <div className="flex flex-col gap-md">
          <Field label="Title">
            <Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Category">
              <Select value={taskForm.category} onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Due date">
            <Input type="date" value={taskForm.dueAt} onChange={(e) => setTaskForm({ ...taskForm, dueAt: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowTask(false)}>
              Cancel
            </Button>
            <Button onClick={addTask}>
              <ListChecks size={16} /> Add task
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showGoal} onClose={() => setShowGoal(false)} title="New goal">
        <div className="flex flex-col gap-md">
          <Field label="Goal">
            <Input value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Type">
              <Select value={goalForm.type} onChange={(e) => setGoalForm({ ...goalForm, type: e.target.value })}>
                <option value="SHORT_TERM">Short term</option>
                <option value="MONTHLY">Monthly</option>
                <option value="LONG_TERM">Long term</option>
              </Select>
            </Field>
            <Field label="Category">
              <Select value={goalForm.category} onChange={(e) => setGoalForm({ ...goalForm, category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-sm">
            <Field label="Target value (optional)">
              <Input type="number" value={goalForm.targetValue} onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })} />
            </Field>
            <Field label="Unit (optional)">
              <Input value={goalForm.unit} onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })} placeholder="e.g. chapters" />
            </Field>
          </div>
          <Field label="Deadline (optional)">
            <Input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-xs">
            <Button variant="outline" onClick={() => setShowGoal(false)}>
              Cancel
            </Button>
            <Button onClick={addGoal}>Create goal</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
