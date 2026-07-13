import type { ProjectSubtask } from "@/types";

export type SubtaskStatus = ProjectSubtask["status"];

export const subtaskStatusNamed: Record<SubtaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done"
};

export const subtaskStatusClasses: Record<SubtaskStatus, string> = {
  todo: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
};

export const subtaskStatusDotColors: Record<SubtaskStatus, string> = {
  todo: "bg-blue-500",
  in_progress: "bg-purple-500",
  done: "bg-green-500"
};

export function statusFromProgress(progress: number): SubtaskStatus {
  if (progress >= 100) return "done";
  if (progress > 0) return "in_progress";
  return "todo";
}

export function progressFromStatus(status: SubtaskStatus, current = 0): number {
  if (status === "done") return 100;
  if (status === "todo") return 0;
  return current > 0 && current < 100 ? current : 25;
}
