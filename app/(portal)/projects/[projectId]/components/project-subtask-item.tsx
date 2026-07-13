"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import type { ProjectSubtask } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { subtaskStatusClasses, subtaskStatusNamed } from "./subtask-helpers";

type ProjectSubtaskItemProps = {
  subtask: ProjectSubtask;
  assigneeName?: string | null;
  onClick?: () => void;
  onStatusToggle?: (id: string, nextDone: boolean) => void;
  isDraggingOverlay?: boolean;
};

export function ProjectSubtaskItem({
  subtask,
  assigneeName,
  onClick,
  onStatusToggle,
  isDraggingOverlay = false
}: ProjectSubtaskItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: subtask.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? (!isDraggingOverlay ? 0.4 : 0.8) : 1,
    zIndex: isDragging ? 100 : 1
  };

  const done = subtask.status === "done";

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md",
          done ? "opacity-70" : ""
        )}
        onClick={onClick}>
        <CardContent className="flex items-start gap-3">
          <Checkbox
            checked={done}
            onCheckedChange={(checked) => onStatusToggle?.(subtask.id, checked === true)}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="flex grow flex-col space-y-2">
            <div className="flex flex-col items-start justify-between space-y-1 lg:flex-row lg:space-y-0">
              <h3
                className={cn(
                  "text-md leading-none font-medium",
                  done ? "text-muted-foreground line-through" : ""
                )}>
                {subtask.title}
              </h3>

              <div className="flex items-center gap-2">
                <Badge className={cn("capitalize", subtaskStatusClasses[subtask.status])}>
                  {subtaskStatusNamed[subtask.status]}
                </Badge>
                <Badge variant="secondary" className="tabular-nums">
                  {subtask.progress}%
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {assigneeName ? (
                <Badge variant="outline" className="font-normal">
                  {assigneeName}
                </Badge>
              ) : null}

              {subtask.dueDate ? (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3" />
                  <span>{format(subtask.dueDate, "MMM d, yyyy")}</span>
                </div>
              ) : null}
            </div>

            <Progress value={subtask.progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
