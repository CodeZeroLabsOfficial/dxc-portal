import * as z from "zod";
import { EnumProjectPriority, EnumProjectStatus } from "./enum";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  managerId: z.string().min(1, "Project manager is required"),
  status: z.enum(
    Object.values(EnumProjectStatus) as [EnumProjectStatus, ...EnumProjectStatus[]]
  ),
  priority: z.enum(
    Object.values(EnumProjectPriority) as [EnumProjectPriority, ...EnumProjectPriority[]]
  ),
  startDate: z.date().optional().nullable(),
  endDate: z.date().optional().nullable(),
  resources: z.array(z.string())
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
