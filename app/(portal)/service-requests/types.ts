import type { ServiceRequestStage } from "@/types";
import { EnumRequestPriority } from "./enum";

export type RequestPriority = `${EnumRequestPriority}`;
export type FilterTab = "all" | ServiceRequestStage;

export type RequestComment = {
  id: string;
  text: string;
  createdAt: Date;
};

export type RequestFile = {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
  storagePath?: string;
};

export type RequestSubTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type ServiceRequestItem = {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  assignedTo: string[];
  comments: RequestComment[];
  status: ServiceRequestStage;
  priority: RequestPriority;
  progress: number;
  createdAt: Date;
  dueDate?: Date | null;
  reminderDate?: Date | null;
  files?: RequestFile[];
  subTasks?: RequestSubTask[];
  starred: boolean;
  createdBy: string;
};
