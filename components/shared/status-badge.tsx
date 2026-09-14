import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ServiceRequestStage } from "@/types";

const stageClass: Record<ServiceRequestStage, string> = {
  created: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  in_progress: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  review: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  submitted: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  feedback: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
};

const stageLabel: Record<ServiceRequestStage, string> = {
  created: "Created",
  in_progress: "In Progress",
  review: "Review",
  submitted: "Submitted",
  feedback: "Feedback",
  completed: "Completed"
};

type StatusBadgeProps = {
  kind: "stage" | "client-status";
  value: string;
  className?: string;
};

export function StatusBadge({ kind, value, className }: StatusBadgeProps) {
  if (kind === "stage") {
    const stage = value as ServiceRequestStage;
    return (
      <Badge className={cn("border-0", stageClass[stage] ?? "", className)}>
        {stageLabel[stage] ?? value}
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        "border-0 capitalize",
        value === "active"
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
        className
      )}>
      {value}
    </Badge>
  );
}
