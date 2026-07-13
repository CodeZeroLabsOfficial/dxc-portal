import * as z from "zod";
import { EnumRequestPriority, EnumRequestStage } from "./enum";

export const requestFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  assignedTo: z.array(z.string()).min(1, "At least one assignee is required"),
  status: z.enum(Object.values(EnumRequestStage) as [EnumRequestStage, ...EnumRequestStage[]]),
  priority: z.enum(
    Object.values(EnumRequestPriority) as [EnumRequestPriority, ...EnumRequestPriority[]]
  ),
  dueDate: z.date().optional().nullable(),
  reminderDate: z.date().optional().nullable()
});

export type RequestFormValues = z.infer<typeof requestFormSchema>;
