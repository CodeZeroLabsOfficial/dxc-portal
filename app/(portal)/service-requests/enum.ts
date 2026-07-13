import type { ServiceRequestStage } from "@/types";

export enum EnumRequestPriority {
  High = "high",
  Medium = "medium",
  Low = "low"
}

export enum EnumRequestStage {
  Created = "created",
  InProgress = "in_progress",
  Review = "review",
  Submitted = "submitted",
  Feedback = "feedback",
  Completed = "completed"
}

export const priorityClasses: Record<EnumRequestPriority, string> = {
  [EnumRequestPriority.High]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  [EnumRequestPriority.Medium]:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  [EnumRequestPriority.Low]: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
};

export const priorityDotColors: Record<EnumRequestPriority, string> = {
  [EnumRequestPriority.High]: "bg-red-500",
  [EnumRequestPriority.Medium]: "bg-yellow-500",
  [EnumRequestPriority.Low]: "bg-gray-400"
};

export const statusClasses: Record<ServiceRequestStage, string> = {
  created: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  submitted: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  feedback: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
};

export const stageNamed: Record<ServiceRequestStage, string> = {
  created: "Created",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
  feedback: "Feedback",
  completed: "Completed"
};

export const statusDotColors: Record<ServiceRequestStage, string> = {
  created: "bg-slate-500",
  in_progress: "bg-purple-500",
  review: "bg-amber-500",
  submitted: "bg-cyan-500",
  feedback: "bg-orange-500",
  completed: "bg-green-500"
};
