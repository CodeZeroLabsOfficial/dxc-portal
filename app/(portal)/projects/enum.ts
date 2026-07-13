import type { ProjectPriority, ProjectStatus } from "@/types";

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

export const priorityClasses: Record<ProjectPriority, string> = {
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
};

export const priorityDotColors: Record<ProjectPriority, string> = {
  high: "bg-red-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400"
};

export const statusClasses: Record<ProjectStatus, string> = {
  active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delayed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  at_risk: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100"
};

export const statusDotColors: Record<ProjectStatus, string> = {
  active: "bg-blue-500",
  delayed: "bg-purple-500",
  at_risk: "bg-red-500",
  completed: "bg-green-500"
};
