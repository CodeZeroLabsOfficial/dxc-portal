"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Check,
  FileIcon,
  FilePlus,
  Trash2,
  X,
  Edit,
  PlusCircleIcon,
  ClockIcon
} from "lucide-react";
import { toast } from "sonner";

import { useServiceRequestStore } from "../store";
import { statusClasses, priorityClasses, stageNamed } from "../enum";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

type RequestDetailSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  requestId: string | null;
  onEditClick?: (id: string) => void;
};

export default function RequestDetailSheet({
  isOpen,
  onClose,
  requestId,
  onEditClick
}: RequestDetailSheetProps) {
  const {
    items,
    addComment,
    deleteComment,
    addFile,
    removeFile,
    addSubTask,
    updateSubTask,
    removeSubTask
  } = useServiceRequestStore();

  const [newComment, setNewComment] = React.useState("");
  const [newSubTask, setNewSubTask] = React.useState("");
  const [isAddingSubTask, setIsAddingSubTask] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const item = items.find((entry) => entry.id === requestId);
  if (!item) return null;

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Comment is required");
      return;
    }
    await addComment(item.id, newComment.trim());
    setNewComment("");
    toast.success("Comment added");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await addFile(item.id, file);
        toast.success(`${file.name} uploaded`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload file");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddSubTask = async () => {
    if (!newSubTask.trim()) {
      toast.error("Subtask title is required");
      return;
    }
    await addSubTask(item.id, newSubTask.trim());
    setNewSubTask("");
    setIsAddingSubTask(false);
    toast.success("Subtask added");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between pe-6">
            <SheetTitle>{item.title}</SheetTitle>
            {onEditClick ? (
              <Button variant="outline" onClick={() => onEditClick(item.id)}>
                <Edit />
                Edit
              </Button>
            ) : null}
          </div>
          <div className="flex items-center gap-2 capitalize">
            <Badge className={statusClasses[item.status]}>{stageNamed[item.status]}</Badge>
            <Badge className={priorityClasses[item.priority]}>{item.priority}</Badge>
          </div>
        </SheetHeader>

        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Description</h4>
            <p className="text-muted-foreground text-sm">
              {item.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Assigned to</h4>
              <p className="text-muted-foreground text-sm">
                {item.assignedTo.length ? item.assignedTo.join(", ") : "Unassigned"}
              </p>
            </div>
            {item.dueDate ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Due date</h4>
                <p className="text-muted-foreground text-sm">
                  {format(new Date(item.dueDate), "PPP")}
                </p>
              </div>
            ) : null}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Created</h4>
              <p className="text-muted-foreground text-sm">
                {format(new Date(item.createdAt), "PPP")}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4 p-4">
          <h4 className="text-sm font-medium">Subtasks</h4>
          {item.subTasks && item.subTasks.length > 0 ? (
            <div className="space-y-2">
              {item.subTasks.map((subTask) => (
                <div
                  key={subTask.id}
                  className="bg-muted flex items-center justify-between rounded-md p-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={subTask.completed}
                      onCheckedChange={(checked) =>
                        void updateSubTask(item.id, subTask.id, Boolean(checked))
                      }
                    />
                    <span
                      className={cn(
                        "text-sm",
                        subTask.completed && "text-muted-foreground line-through"
                      )}>
                      {subTask.title}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-red-400!"
                    size="sm"
                    onClick={() =>
                      void removeSubTask(item.id, subTask.id).then(() =>
                        toast.success("Subtask removed")
                      )
                    }>
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">
              No subtasks yet.
            </div>
          )}

          {!isAddingSubTask ? (
            <Button variant="outline" size="sm" onClick={() => setIsAddingSubTask(true)}>
              <PlusCircleIcon />
              <span>Add subtask</span>
            </Button>
          ) : (
            <div className="flex gap-2">
              <Input
                value={newSubTask}
                onChange={(e) => setNewSubTask(e.target.value)}
                placeholder="Enter subtask title"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleAddSubTask();
                  if (e.key === "Escape") {
                    setIsAddingSubTask(false);
                    setNewSubTask("");
                  }
                }}
              />
              <Button onClick={() => void handleAddSubTask()}>
                <Check />
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  setIsAddingSubTask(false);
                  setNewSubTask("");
                }}>
                <X />
              </Button>
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Attachments</h4>
            <div>
              <input
                type="file"
                id="service-request-file-upload"
                multiple
                className="sr-only"
                onChange={(e) => void handleFileUpload(e)}
                disabled={uploading}
              />
              <label htmlFor="service-request-file-upload">
                <Button variant="outline" size="sm" asChild disabled={uploading}>
                  <span>
                    <FilePlus />
                    {uploading ? "Uploading..." : "Upload"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {item.files && item.files.length > 0 ? (
            <div className="space-y-2">
              {item.files.map((file) => (
                <div
                  key={file.id}
                  className="bg-muted flex items-center justify-between rounded-md p-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileIcon className="h-4 w-4 shrink-0" />
                    <div className="overflow-hidden">
                      <Link
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-sm hover:underline">
                        {file.name}
                      </Link>
                      <span className="text-muted-foreground text-xs">
                        {formatFileSize(file.size)} •{" "}
                        {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeFile(item.id, file.id)}
                    className="text-red-400!">
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">
              No files attached.
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4 p-4">
          <h4 className="text-sm font-medium">Comments ({item.comments.length})</h4>

          {item.comments.length === 0 ? (
            <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">
              No comments yet.
            </div>
          ) : null}

          <div className="space-y-2">
            {item.comments.map((comment) => (
              <div key={comment.id} className="bg-muted group relative space-y-3 rounded-md p-3">
                <p className="text-sm">{comment.text}</p>
                <div className="text-muted-foreground flex justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="size-3" /> {format(new Date(comment.createdAt), "PPp")}
                  </div>
                  <div className="absolute end-2 bottom-2 flex items-center opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      onClick={() => void deleteComment(item.id, comment.id)}
                      className="text-red-400!"
                      size="sm">
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Textarea
              placeholder="Write your comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <Button onClick={() => void handleAddComment()}>Add comment</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
