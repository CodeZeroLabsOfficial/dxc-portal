import { Timestamp } from "firebase/firestore";

import type { Project, ProjectGoal, ProjectPriority, ProjectStatus } from "@/types";

export function averageProgress(values: number[]): number {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

export function toProjectDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function formatProjectDate(value: Date | null | undefined): string {
  if (!value) return "—";
  return value.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function formatCompactMoney(value: number, currency = "AUD"): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1
  }).format(value);
}

export function daysUntil(value: Date | null | undefined): number | null {
  if (!value) return null;
  const end = new Date(value);
  end.setHours(0, 0, 0, 0);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

export function mapProjectGoals(value: unknown): ProjectGoal[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const title = String(row.title ?? "").trim();
    if (!title) return [];
    return [
      {
        title,
        status: String(row.status ?? "").trim(),
        done: Boolean(row.done)
      }
    ];
  });
}

export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (value === "delayed" || value === "at_risk" || value === "completed" || value === "active") {
    return value;
  }
  if (value === "on_hold") return "delayed";
  if (value === "archived") return "completed";
  return "active";
}

export function normalizeProjectPriority(value: unknown): ProjectPriority {
  if (value === "low" || value === "medium" || value === "high") return value;
  return "medium";
}

export const projectStatusNamed: Record<ProjectStatus, string> = {
  active: "Active",
  delayed: "Delayed",
  at_risk: "At Risk",
  completed: "Completed"
};

export function mapProjectDoc(id: string, data: Record<string, unknown>): Project {
  const budget = (data.budget as Project["budget"] | undefined) ?? {
    allocated: 0,
    spent: 0,
    currency: "AUD"
  };
  return {
    id,
    clientId: String(data.clientId ?? ""),
    name: String(data.name ?? ""),
    description: typeof data.description === "string" ? data.description : null,
    industry: typeof data.industry === "string" ? data.industry : null,
    type: typeof data.type === "string" ? data.type : null,
    managerId: String(data.managerId ?? ""),
    status: normalizeProjectStatus(data.status),
    priority: normalizeProjectPriority(data.priority),
    resources: Array.isArray(data.resources) ? (data.resources as string[]) : [],
    progress: typeof data.progress === "number" ? data.progress : 0,
    startDate: toProjectDate(data.startDate),
    endDate: toProjectDate(data.endDate),
    budget,
    goals: mapProjectGoals(data.goals),
    createdBy: String(data.createdBy ?? ""),
    createdAt: toProjectDate(data.createdAt),
    updatedAt: toProjectDate(data.updatedAt)
  };
}
