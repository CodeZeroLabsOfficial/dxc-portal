import { Timestamp } from "firebase/firestore";

import type { Project, ProjectPriority, ProjectStatus } from "@/types";

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
    managerId: String(data.managerId ?? ""),
    status: normalizeProjectStatus(data.status),
    priority: normalizeProjectPriority(data.priority),
    resources: Array.isArray(data.resources) ? (data.resources as string[]) : [],
    progress: typeof data.progress === "number" ? data.progress : 0,
    startDate: toProjectDate(data.startDate),
    endDate: toProjectDate(data.endDate),
    budget,
    createdBy: String(data.createdBy ?? ""),
    createdAt: toProjectDate(data.createdAt),
    updatedAt: toProjectDate(data.updatedAt)
  };
}
