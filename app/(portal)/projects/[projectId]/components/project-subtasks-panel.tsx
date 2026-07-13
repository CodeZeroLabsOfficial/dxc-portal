"use client";

import React from "react";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { doc, updateDoc, writeBatch } from "firebase/firestore";
import { toast } from "sonner";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragCancelEvent,
  DragOverlay
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";

import { db } from "@/lib/firebase";
import { appendProjectActivity } from "@/lib/project-activity";
import { averageProgress } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { ProjectSubtask, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ProjectSubtaskItem } from "./project-subtask-item";
import { ProjectSubtaskSheet } from "./project-subtask-sheet";
import {
  subtaskStatusDotColors,
  subtaskStatusNamed,
  type SubtaskStatus
} from "./subtask-helpers";

type ProjectSubtasksPanelProps = {
  projectId: string;
  subtasks: ProjectSubtask[];
  users: UserProfile[];
  actorId?: string | null;
  actorName?: string | null;
};

export function ProjectSubtasksPanel({
  projectId,
  subtasks,
  users,
  actorId = null,
  actorName = null
}: ProjectSubtasksPanelProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState<SubtaskStatus | null>(null);
  const [filterAssignee, setFilterAssignee] = React.useState<string[]>([]);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const userNameById = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users) {
      map.set(user.uid, user.displayName || user.email || "User");
    }
    return map;
  }, [users]);

  const sorted = React.useMemo(
    () => [...subtasks].sort((a, b) => a.order - b.order),
    [subtasks]
  );

  const assigneesInList = React.useMemo(() => {
    const ids = new Set(
      sorted.map((item) => item.assigneeId).filter((id): id is string => Boolean(id))
    );
    return Array.from(ids)
      .map((id) => ({ id, name: userNameById.get(id) ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sorted, userNameById]);

  const filtered = sorted.filter((item) => {
    if (filterStatus && item.status !== filterStatus) return false;
    if (filterAssignee.length > 0) {
      if (!item.assigneeId || !filterAssignee.includes(item.assigneeId)) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const assigneeName = item.assigneeId
        ? (userNameById.get(item.assigneeId) ?? "").toLowerCase()
        : "";
      return item.title.toLowerCase().includes(query) || assigneeName.includes(query);
    }
    return true;
  });

  const editSubtask = editId ? (sorted.find((item) => item.id === editId) ?? null) : null;
  const activeSubtask = activeId ? (filtered.find((item) => item.id === activeId) ?? null) : null;
  const filterCount = (filterStatus ? 1 : 0) + (filterAssignee.length > 0 ? 1 : 0);

  async function refreshProjectProgress(next: ProjectSubtask[]) {
    await updateDoc(doc(db, "projects", projectId), {
      progress: averageProgress(next.map((item) => item.progress))
    });
  }

  async function handleStatusToggle(id: string, nextDone: boolean) {
    const current = sorted.find((item) => item.id === id);
    if (!current) return;

    const progress = nextDone ? 100 : 0;
    const status: SubtaskStatus = nextDone ? "done" : "todo";

    await updateDoc(doc(db, "projects", projectId, "subtasks", id), { progress, status });
    const next = sorted.map((item) =>
      item.id === id ? { ...item, progress, status } : item
    );
    await refreshProjectProgress(next);
    await appendProjectActivity({
      projectId,
      type: "subtask_progress",
      title: nextDone ? "Subtask completed" : "Subtask reopened",
      description: current.title,
      actorId,
      actorName
    });
  }

  async function handleSaved(subtask: ProjectSubtask, mode: "create" | "update") {
    const next =
      mode === "create"
        ? [...sorted, subtask]
        : sorted.map((item) => (item.id === subtask.id ? subtask : item));
    await refreshProjectProgress(next);
    await appendProjectActivity({
      projectId,
      type: mode === "create" ? "subtask_added" : "subtask_progress",
      title: mode === "create" ? "Subtask added" : "Subtask updated",
      description: subtask.title,
      actorId,
      actorName
    });
  }

  async function handleReorder(nextFiltered: ProjectSubtask[]) {
    const filteredIds = new Set(nextFiltered.map((item) => item.id));
    const others = sorted.filter((item) => !filteredIds.has(item.id));
    const merged = [...nextFiltered, ...others].map((item, index) => ({
      ...item,
      order: index
    }));

    const batch = writeBatch(db);
    for (const item of merged) {
      batch.update(doc(db, "projects", projectId, "subtasks", item.id), { order: item.order });
    }
    await batch.commit();
    toast.success("Subtasks reordered");
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = filtered.findIndex((item) => item.id === active.id);
    const newIndex = filtered.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    void handleReorder(arrayMove(filtered, oldIndex, newIndex));
  }

  function handleDragCancel(_event: DragCancelEvent) {
    setActiveId(null);
  }

  function clearFilters() {
    setFilterStatus(null);
    setFilterAssignee([]);
  }

  function handleAssigneeFilter(id: string, pressed: boolean) {
    setFilterAssignee((current) => {
      if (pressed) return current.includes(id) ? current : [...current, id];
      return current.filter((entry) => entry !== id);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="text-muted-foreground text-sm">
          {filtered.length} of {sorted.length} subtasks
        </div>

        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative grow lg:grow-0">
            <Search className="absolute top-2.5 left-3 size-4 opacity-50" />
            <Input
              placeholder="Search subtasks..."
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="relative">
                <SlidersHorizontal />
                {filterCount > 0 ? (
                  <Badge
                    variant="secondary"
                    className="absolute -end-1.5 -top-1.5 size-4 rounded-full p-0">
                    {filterCount}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="space-y-6 p-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="flex gap-2 *:grow">
                    {(Object.keys(subtaskStatusNamed) as SubtaskStatus[]).map((status) => (
                      <Toggle
                        key={status}
                        variant="outline"
                        size="sm"
                        pressed={filterStatus === status}
                        onPressedChange={() =>
                          setFilterStatus(filterStatus === status ? null : status)
                        }
                        className="px-3 text-xs capitalize">
                        <span
                          className={cn("size-2 rounded-full", subtaskStatusDotColors[status])}
                        />
                        {subtaskStatusNamed[status]}
                      </Toggle>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Assignees</h4>
                  {assigneesInList.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No assignees yet</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {assigneesInList.map((assignee) => (
                        <Toggle
                          key={assignee.id}
                          variant="outline"
                          size="sm"
                          pressed={filterAssignee.includes(assignee.id)}
                          onPressedChange={(pressed) =>
                            handleAssigneeFilter(assignee.id, pressed)
                          }
                          className="px-3 text-xs">
                          {assignee.name}
                        </Toggle>
                      ))}
                    </div>
                  )}
                </div>

                {filterCount > 0 ? (
                  <div className="text-end">
                    <Button variant="link" size="sm" className="px-0!" onClick={clearFilters}>
                      Clear filters
                      <X />
                    </Button>
                  </div>
                ) : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={() => {
                    setEditId(null);
                    setSheetOpen(true);
                  }}>
                  <Plus />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add subtask</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <h3 className="text-xl font-medium">No subtasks found</h3>
          <p className="text-muted-foreground mt-2">Add a subtask to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
          modifiers={[restrictToVerticalAxis]}>
          <SortableContext
            items={filtered.map((item) => item.id)}
            strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-1 space-y-4">
              {filtered.map((item) => (
                <ProjectSubtaskItem
                  key={item.id}
                  subtask={item}
                  assigneeName={
                    item.assigneeId ? (userNameById.get(item.assigneeId) ?? null) : null
                  }
                  onClick={() => {
                    setEditId(item.id);
                    setSheetOpen(true);
                  }}
                  onStatusToggle={(id, nextDone) => void handleStatusToggle(id, nextDone)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeSubtask ? (
              <ProjectSubtaskItem
                subtask={activeSubtask}
                assigneeName={
                  activeSubtask.assigneeId
                    ? (userNameById.get(activeSubtask.assigneeId) ?? null)
                    : null
                }
                isDraggingOverlay
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <ProjectSubtaskSheet
        projectId={projectId}
        users={users}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditId(null);
        }}
        editSubtask={editSubtask}
        nextOrder={sorted.length}
        onSaved={(subtask, mode) => void handleSaved(subtask, mode)}
      />
    </div>
  );
}
