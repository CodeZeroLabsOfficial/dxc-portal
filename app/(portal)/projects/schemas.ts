import * as z from "zod";
import { EnumProjectPriority, EnumProjectStatus } from "./enum";

export const projectGoalSchema = z.object({
  title: z.string().min(1),
  status: z.string(),
  done: z.boolean()
});

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  industry: z.string().optional(),
  type: z.string().optional(),
  managerId: z.string().min(1, "Project manager is required"),
  status: z.enum(
    Object.values(EnumProjectStatus) as [EnumProjectStatus, ...EnumProjectStatus[]]
  ),
  priority: z.enum(
    Object.values(EnumProjectPriority) as [EnumProjectPriority, ...EnumProjectPriority[]]
  ),
  progress: z.number().min(0).max(100),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  resources: z.array(z.string()),
  goals: z.array(projectGoalSchema)
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
