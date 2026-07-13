import type { ProjectPriority } from "@/types";

export enum EnumProjectPriority {
  High = "high",
  Medium = "medium",
  Low = "low"
}

export enum EnumProjectStatus {
  Active = "active",
  Delayed = "delayed",
  AtRisk = "at_risk",
  Completed = "completed"
}

export { projectStatusNamed } from "@/lib/projects";

export const priorityDotColors: Record<ProjectPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400"
};
