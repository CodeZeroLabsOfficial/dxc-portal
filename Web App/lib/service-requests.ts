import type { ServiceRequestStage } from "@/types";
import { SERVICE_REQUEST_STAGE_PROGRESS } from "@/types";

export const SERVICE_REQUEST_STAGES: ServiceRequestStage[] = [
  "created",
  "in_progress",
  "review",
  "submitted",
  "feedback",
  "completed"
];

export function getStageProgress(stage: ServiceRequestStage): number {
  return SERVICE_REQUEST_STAGE_PROGRESS[stage];
}

export function stageLabel(stage: ServiceRequestStage): string {
  const labels: Record<ServiceRequestStage, string> = {
    created: "Created",
    in_progress: "In Progress",
    review: "Review",
    submitted: "Submitted",
    feedback: "Feedback",
    completed: "Completed"
  };
  return labels[stage];
}
