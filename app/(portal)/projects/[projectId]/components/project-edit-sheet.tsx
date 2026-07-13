"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Timestamp, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import type { Project, UserProfile } from "@/types";
import {
  EnumProjectPriority,
  EnumProjectStatus,
  priorityDotColors,
  projectStatusNamed
} from "../../enum";
import { projectFormSchema, type ProjectFormValues } from "../../schemas";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

type ProjectEditSheetProps = {
  project: Project;
  users: UserProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function isProjectManager(user: UserProfile) {
  return (user.jobTitle ?? "").trim().toLowerCase() === "project manager";
}

export function ProjectEditSheet({
  project,
  users,
  open,
  onOpenChange
}: ProjectEditSheetProps) {
  const [resources, setResources] = React.useState<string[]>(project.resources ?? []);
  const [newResource, setNewResource] = React.useState("");

  const projectManagers = users.filter(isProjectManager);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project.name,
      managerId: project.managerId,
      status: project.status as ProjectFormValues["status"],
      priority: project.priority as ProjectFormValues["priority"],
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
      resources: project.resources ?? []
    }
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset({
      name: project.name,
      managerId: project.managerId,
      status: project.status as ProjectFormValues["status"],
      priority: project.priority as ProjectFormValues["priority"],
      startDate: project.startDate ?? null,
      endDate: project.endDate ?? null,
      resources: project.resources ?? []
    });
    setResources(project.resources ?? []);
    setNewResource("");
  }, [open, project, form]);

  function addResource() {
    const value = newResource.trim();
    if (!value || resources.includes(value)) return;
    const next = [...resources, value];
    setResources(next);
    form.setValue("resources", next);
    setNewResource("");
  }

  function removeResource(name: string) {
    const next = resources.filter((item) => item !== name);
    setResources(next);
    form.setValue("resources", next);
  }

  async function onSubmit(data: ProjectFormValues) {
    data.resources = resources;
    try {
      await updateDoc(doc(db, "projects", project.id), {
        name: data.name.trim(),
        managerId: data.managerId,
        status: data.status,
        priority: data.priority,
        startDate: data.startDate ? Timestamp.fromDate(data.startDate) : null,
        endDate: data.endDate ? Timestamp.fromDate(data.endDate) : null,
        resources: data.resources,
        updatedAt: serverTimestamp()
      });
      toast.success("Project updated");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to update project");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit project</SheetTitle>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4 pt-0">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Manager</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select project manager" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectManagers.map((user) => (
                          <SelectItem key={user.uid} value={user.uid}>
                            {user.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {projectManagers.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No staff with job title “Project Manager”.
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              EnumProjectStatus.Active,
                              EnumProjectStatus.Delayed,
                              EnumProjectStatus.AtRisk,
                              EnumProjectStatus.Completed
                            ] as const
                          ).map((status) => (
                            <SelectItem key={status} value={status}>
                              {projectStatusNamed[status]}
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full capitalize">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              EnumProjectPriority.High,
                              EnumProjectPriority.Medium,
                              EnumProjectPriority.Low
                            ] as const
                          ).map((priority) => (
                            <SelectItem className="capitalize" key={priority} value={priority}>
                              <span
                                className={cn("size-2 rounded-full", priorityDotColors[priority])}
                              />
                              {priority}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Start Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            <CalendarIcon />
                            {field.value ? format(field.value, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project End Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}>
                            <CalendarIcon />
                            {field.value ? format(field.value, "PPP") : "Select a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormItem>
              <FormLabel>Resources assigned</FormLabel>
              <div className="flex flex-wrap items-center gap-2">
                {resources.map((resource) => (
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    key={resource}
                    onClick={() => removeResource(resource)}>
                    {resource}
                    <X className="size-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  placeholder="Enter user name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addResource();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addResource}>
                  <Plus />
                </Button>
              </div>
            </FormItem>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
