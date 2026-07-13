"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, FileIcon, Star, BellIcon } from "lucide-react";
import { priorityClasses, statusClasses, stageNamed } from "../enum";
import type { ServiceRequestItem } from "../types";
import type { ServiceRequestStage } from "@/types";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RequestItemProps = {
  item: ServiceRequestItem;
  onClick?: () => void;
  onStatusChange?: (id: string, status: ServiceRequestStage) => void;
  onStarToggle?: (id: string, e: React.MouseEvent) => void;
  isDraggingOverlay?: boolean;
};

export default function RequestItem({
  item,
  onClick,
  onStatusChange,
  onStarToggle,
  isDraggingOverlay = false
}: RequestItemProps) {
  const completedSubTasks = item.subTasks?.filter((st) => st.completed).length || 0;
  const totalSubTasks = item.subTasks?.length || 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? (!isDraggingOverlay ? 0.4 : 0.8) : 1,
    zIndex: isDragging ? 100 : 1
  };

  const reminderDateFormatted = item.reminderDate
    ? format(new Date(item.reminderDate), "MMM d, yyyy - h:mm a")
    : null;

  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={style}>
      <Card
        className={cn(
          "flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md",
          item.status === "completed" ? "opacity-70" : ""
        )}
        onClick={onClick}>
        <CardContent className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                checked={item.status === "completed"}
                onCheckedChange={() =>
                  onStatusChange?.(
                    item.id,
                    item.status === "completed" ? "created" : "completed"
                  )
                }
                onClick={(e) => e.stopPropagation()}
              />

              <h3
                className={cn(
                  "text-md flex-1 leading-none font-medium",
                  item.status === "completed" ? "text-muted-foreground line-through" : ""
                )}>
                {item.title}
              </h3>

              <Star
                className={cn(
                  "size-5 cursor-pointer",
                  item.starred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                )}
                onClick={(e) => onStarToggle?.(item.id, e)}
              />
            </div>

            <div className="text-muted-foreground flex flex-wrap items-center gap-1 text-sm">
              <span>Assigned to:</span>
              {item.assignedTo.map((user, idx) => (
                <Badge key={idx} variant="outline" className="font-normal">
                  {user}
                </Badge>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {item.dueDate ? (
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <Calendar className="h-3 w-3" />
                  <span>{format(new Date(item.dueDate), "MMM d, yyyy")}</span>
                </div>
              ) : null}

              {item.reminderDate ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs">
                        <BellIcon className="size-3" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reminder: {reminderDateFormatted}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>

            {totalSubTasks > 0 ? (
              <div className="text-muted-foreground text-xs">
                Subtasks: {completedSubTasks}/{totalSubTasks}
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between border-t">
          <div className="flex items-center gap-2 capitalize">
            <Badge className={statusClasses[item.status]}>{stageNamed[item.status]}</Badge>
            <Badge className={priorityClasses[item.priority]}>{item.priority}</Badge>
          </div>

          {(item.files?.length || 0) > 0 ? (
            <div className="flex items-center gap-1">
              <FileIcon className="text-muted-foreground size-3" />
              <span className="text-muted-foreground text-xs">{item.files?.length}</span>
            </div>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
