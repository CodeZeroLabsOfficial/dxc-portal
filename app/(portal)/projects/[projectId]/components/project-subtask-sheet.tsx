"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Timestamp, doc, serverTimestamp, updateDoc, addDoc, collection } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { ProjectSubtask, UserProfile } from "@/types";
import {
  progressFromStatus,
  statusFromProgress,
  subtaskStatusDotColors,
  subtaskStatusNamed,
  type SubtaskStatus
} from "./subtask-helpers";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

const subtaskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  assigneeId: z.string().nullable(),
  status: z.enum(["todo", "in_progress", "done"]),
  progress: z.number().min(0).max(100),
  dueDate: z.date().nullable().optional()
});

type SubtaskFormValues = z.infer<typeof subtaskFormSchema>;

type ProjectSubtaskSheetProps = {
  projectId: string;
  users: UserProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSubtask?: ProjectSubtask | null;
  nextOrder: number;
  onSaved: (subtask: ProjectSubtask, mode: "create" | "update") => void;
};

export function ProjectSubtaskSheet({
  projectId,
  users,
  open,
  onOpenChange,
  editSubtask,
  nextOrder,
  onSaved
}: ProjectSubtaskSheetProps) {
  const isEdit = Boolean(editSubtask);

  const form = useForm<SubtaskFormValues>({
    resolver: zodResolver(subtaskFormSchema),
    defaultValues: {
      title: "",
      assigneeId: null,
      status: "todo",
      progress: 0,
      dueDate: null
    }
  });

  React.useEffect(() => {
    if (!open) return;
    if (editSubtask) {
      form.reset({
        title: editSubtask.title,
        assigneeId: editSubtask.assigneeId ?? null,
        status: editSubtask.status,
        progress: editSubtask.progress,
        dueDate: editSubtask.dueDate ?? null
      });
      return;
    }
    form.reset({
      title: "",
      assigneeId: null,
      status: "todo",
      progress: 0,
      dueDate: null
    });
  }, [open, editSubtask, form]);

  async function onSubmit(data: SubtaskFormValues) {
    const payload = {
      title: data.title.trim(),
      assigneeId: data.assigneeId || null,
      status: data.status,
      progress: data.progress,
      dueDate: data.dueDate ? Timestamp.fromDate(data.dueDate) : null
    };

    try {
      if (editSubtask) {
        await updateDoc(doc(db, "projects", projectId, "subtasks", editSubtask.id), {
          ...payload,
          updatedAt: serverTimestamp()
        });
        onSaved(
          {
            ...editSubtask,
            title: payload.title,
            assigneeId: payload.assigneeId,
            status: payload.status,
            progress: payload.progress,
            dueDate: data.dueDate ?? null
          },
          "update"
        );
        toast.success("Subtask updated");
      } else {
        const created = await addDoc(collection(db, "projects", projectId, "subtasks"), {
          ...payload,
          order: nextOrder,
          createdAt: serverTimestamp()
        });
        onSaved(
          {
            id: created.id,
            title: payload.title,
            assigneeId: payload.assigneeId,
            status: payload.status,
            progress: payload.progress,
            dueDate: data.dueDate ?? null,
            order: nextOrder
          },
          "create"
        );
        toast.success("Subtask added");
      }
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(isEdit ? "Unable to update subtask" : "Unable to add subtask");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit subtask" : "Add subtask"}</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 pt-0">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter subtask title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value ?? "unassigned"}
                      onValueChange={(value) =>
                        field.onChange(value === "unassigned" ? null : value)
                      }>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const status = value as SubtaskStatus;
                        field.onChange(status);
                        form.setValue("progress", progressFromStatus(status, form.getValues("progress")));
                      }}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(subtaskStatusNamed) as SubtaskStatus[]).map((status) => (
                          <SelectItem key={status} value={status}>
                            <span className="flex items-center gap-2 capitalize">
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  subtaskStatusDotColors[status]
                                )}
                              />
                              {subtaskStatusNamed[status]}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress</FormLabel>
                  <FormControl>
                    <div className="flex w-full items-center justify-between gap-2">
                      <Slider
                        aria-label="Subtask progress"
                        min={0}
                        max={100}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => {
                          const progress = value[0] ?? 0;
                          field.onChange(progress);
                          form.setValue("status", statusFromProgress(progress));
                        }}
                      />
                      <output className="w-10 text-sm font-medium tabular-nums">
                        {field.value}
                      </output>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}>
                          <CalendarIcon />
                          {field.value ? format(field.value, "PPP") : "Pick a date"}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={(date) => field.onChange(date ?? null)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEdit ? "Save" : "Add"}</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
