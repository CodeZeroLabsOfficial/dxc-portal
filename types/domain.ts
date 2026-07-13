import type { ServiceRequestStage } from "./user";

export type ProjectStatus = "active" | "delayed" | "at_risk" | "completed";
export type ProjectPriority = "low" | "medium" | "high";

export type Project = {
  id: string;
  clientId: string;
  name: string;
  managerId: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  resources: string[];
  progress: number;
  startDate?: Date | null;
  endDate?: Date | null;
  budget: {
    allocated: number;
    spent: number;
    currency: string;
  };
  createdBy: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type ProjectSubtask = {
  id: string;
  title: string;
  assigneeId?: string | null;
  status: "todo" | "in_progress" | "done";
  progress: number;
  dueDate?: Date | null;
  order: number;
};

export type ProjectRisk = {
  id: string;
  title: string;
  description?: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "mitigating" | "closed";
  ownerId?: string | null;
  createdAt?: Date | null;
};

export type ProjectIssue = {
  id: string;
  title: string;
  description?: string | null;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "closed";
  ownerId?: string | null;
  createdAt?: Date | null;
};

export type ProjectActivityType =
  | "project_updated"
  | "status_changed"
  | "progress_changed"
  | "subtask_added"
  | "subtask_progress"
  | "risk_added"
  | "issue_added"
  | "finance_updated";

export type ProjectActivity = {
  id: string;
  type: ProjectActivityType;
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName?: string | null;
  createdAt: Date | null;
};

export type ServiceRequest = {
  id: string;
  clientId: string;
  title: string;
  description?: string | null;
  createdAt: Date | null;
  dueDate?: Date | null;
  assigneeId?: string | null;
  stage: ServiceRequestStage;
  progress: number;
  createdBy: string;
  updatedAt?: Date | null;
};

export type ServiceRequestAttachment = {
  id: string;
  name: string;
  storagePath: string;
  url: string;
  contentType: string;
  size: number;
  uploadedBy: string;
  uploadedAt?: Date | null;
};

export type CalendarEventType = "annual_leave" | "staff_movement";

export type CalendarEventRecord = {
  id: string;
  title: string;
  type: CalendarEventType;
  staffId: string;
  start: Date;
  end: Date;
  allDay: boolean;
  notes?: string | null;
  color?: string | null;
  status: "pending" | "approved" | "rejected";
  createdBy: string;
  createdAt?: Date | null;
};
