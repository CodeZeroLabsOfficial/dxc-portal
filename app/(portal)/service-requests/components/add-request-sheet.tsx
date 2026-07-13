"use client";

import React from "react";
import { format } from "date-fns";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { useServiceRequestStore } from "../store";
import { requestFormSchema, type RequestFormValues } from "../schemas";
import {
  priorityDotColors,
  statusDotColors,
  EnumRequestStage,
  stageNamed,
  EnumRequestPriority
} from "../enum";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type AddRequestSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
};

export default function AddRequestSheet({ isOpen, onClose, editId }: AddRequestSheetProps) {
  const { addItem, updateItem, items } = useServiceRequestStore();
  const [assignedUsers, setAssignedUsers] = React.useState<string[]>([]);
  const [newUser, setNewUser] = React.useState("");

  const defaultValues: RequestFormValues = {
    title: "",
    description: "",
    assignedTo: [],
    status: EnumRequestStage.Created,
    priority: EnumRequestPriority.Medium,
    dueDate: null,
    reminderDate: null
  };

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues
  });

  React.useEffect(() => {
    if (editId) {
      const item = items.find((entry) => entry.id === editId);
      if (item) {
        form.reset({
          title: item.title,
          description: item.description,
          assignedTo: item.assignedTo,
          status: item.status as RequestFormValues["status"],
          priority: item.priority as RequestFormValues["priority"],
          dueDate: item.dueDate ?? null,
          reminderDate: item.reminderDate ?? null
        });
        setAssignedUsers(item.assignedTo);
      }
    } else {
      form.reset(defaultValues);
      setAssignedUsers([]);
    }
  }, [editId, items, isOpen, form]);

  const onSubmit = async (data: RequestFormValues) => {
    data.assignedTo = assignedUsers;
    try {
      if (editId) {
        await updateItem(editId, data);
        toast.success("Service request updated");
      } else {
        await addItem(data);
        toast.success("Service request created");
      }
      form.reset();
      setAssignedUsers([]);
      setNewUser("");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Unable to save service request");
    }
  };

  const addAssignedUser = () => {
    if (newUser.trim() && !assignedUsers.includes(newUser.trim())) {
      const updated = [...assignedUsers, newUser.trim()];
      setAssignedUsers(updated);
      form.setValue("assignedTo", updated);
      setNewUser("");
    }
  };

  const removeAssignedUser = (user: string) => {
    const updated = assignedUsers.filter((entry) => entry !== user);
    setAssignedUsers(updated);
    form.setValue("assignedTo", updated);
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editId ? "Edit service request" : "Add service request"}</SheetTitle>
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
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter description"
                      rows={4}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Assigned to</FormLabel>
              <div className="flex flex-wrap items-center gap-2">
                {assignedUsers.map((user) => (
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    key={user}
                    onClick={() => removeAssignedUser(user)}>
                    {user}
                    <X className="size-3" />
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="Enter user name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAssignedUser();
                    }
                  }}
                />
                <Button type="button" variant="outline" size="icon" onClick={addAssignedUser}>
                  <Plus />
                </Button>
              </div>
              {form.formState.errors.assignedTo ? (
                <p className="text-destructive mt-1 text-sm font-medium">
                  {form.formState.errors.assignedTo.message}
                </p>
              ) : null}
            </FormItem>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
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
              name="reminderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder date</FormLabel>
                  <FormControl>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(EnumRequestStage).map((stage) => (
                            <SelectItem key={stage} value={stage}>
                              <span
                                className={cn("size-2 rounded-full", statusDotColors[stage])}
                              />
                              {stageNamed[stage]}
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
                          {Object.values(EnumRequestPriority).map((priority) => (
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

            <Button className="w-full" type="submit">
              {editId ? "Save changes" : "Add service request"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
