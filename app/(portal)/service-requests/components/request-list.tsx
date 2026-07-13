"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Plus, X, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

import type { FilterTab } from "../types";
import type { ServiceRequestStage } from "@/types";
import { useServiceRequestStore } from "../store";
import StatusTabs from "./status-tabs";
import RequestItem from "./request-item";
import { EnumRequestPriority, priorityDotColors, stageNamed } from "../enum";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  rectSortingStrategy
} from "@dnd-kit/sortable";

type RequestListProps = {
  activeTab: FilterTab;
  onSelectItem: (id: string) => void;
  onAddClick: () => void;
};

export default function RequestList({ activeTab, onSelectItem, onAddClick }: RequestListProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const {
    items,
    updateItem,
    reorderItems,
    filterUser,
    setFilterUser,
    filterPriority,
    setFilterPriority,
    searchQuery,
    setSearchQuery,
    toggleStarred,
    showStarredOnly,
    toggleShowStarredOnly,
    setActiveTab
  } = useServiceRequestStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const uniqueUsers = Array.from(new Set(items.flatMap((item) => item.assignedTo)));

  const filteredItems = items.filter((item) => {
    if (activeTab !== "all" && item.status !== activeTab) return false;

    if (filterUser && filterUser.length > 0) {
      if (!filterUser.some((user) => item.assignedTo.includes(user))) return false;
    }

    if (filterPriority && item.priority !== filterPriority) return false;
    if (showStarredOnly && !item.starred) return false;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.assignedTo.some((user) => user.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleStatusChange = async (id: string, status: ServiceRequestStage) => {
    await updateItem(id, { status });
    toast.success(`Stage changed to ${stageNamed[status]}`);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = filteredItems.findIndex((item) => item.id === active.id);
    const newIndex = filteredItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(filteredItems, oldIndex, newIndex);
    reorderItems(newItems.map((item, index) => ({ id: item.id, position: index })));
    toast.success("Requests reordered");
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null);
  };

  const handleUserFilterChange = (user: string, checked: boolean) => {
    if (!filterUser) {
      setFilterUser(checked ? [user] : null);
      return;
    }
    const next = checked ? [...filterUser, user] : filterUser.filter((entry) => entry !== user);
    setFilterUser(next.length > 0 ? next : null);
  };

  const clearFilters = () => {
    setFilterUser(null);
    setFilterPriority(null);
    setSearchQuery("");
    if (showStarredOnly) toggleShowStarredOnly();
  };

  const handleStarToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    void toggleStarred(id);
  };

  const activeItem = filteredItems.find((item) => item.id === activeId);

  return (
    <>
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <StatusTabs activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative w-auto">
            <Search className="absolute top-2.5 left-3 size-4 opacity-50" />
            <Input
              placeholder="Search requests..."
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="relative">
                <SlidersHorizontal />
                {(filterUser || filterPriority || showStarredOnly) && (
                  <Badge
                    variant="secondary"
                    className="absolute -end-1.5 -top-1.5 size-4 rounded-full p-0">
                    {(filterUser ? 1 : 0) + (filterPriority ? 1 : 0) + (showStarredOnly ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
              <div className="space-y-6 p-4">
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Assigned users</h4>
                  <div className="flex flex-wrap gap-2">
                    {uniqueUsers.map((user) => (
                      <Toggle
                        key={user}
                        variant="outline"
                        size="sm"
                        pressed={filterUser?.includes(user) || false}
                        onPressedChange={(pressed) => handleUserFilterChange(user, pressed)}
                        className="px-3 text-xs">
                        {user}
                      </Toggle>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="starred"
                    checked={showStarredOnly}
                    onCheckedChange={toggleShowStarredOnly}
                  />
                  <Label htmlFor="starred">Show starred only</Label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Priority</h4>
                  <div className="flex gap-2 *:grow">
                    {Object.values(EnumRequestPriority).map((priority) => (
                      <Toggle
                        key={priority}
                        variant="outline"
                        size="sm"
                        pressed={filterPriority === priority}
                        onPressedChange={() =>
                          setFilterPriority(filterPriority === priority ? null : priority)
                        }
                        className="px-3 text-xs capitalize">
                        <span className={cn("size-2 rounded-full", priorityDotColors[priority])} />
                        {priority}
                      </Toggle>
                    ))}
                  </div>

                  {(filterUser || filterPriority || showStarredOnly) && (
                    <div className="text-end">
                      <Button variant="link" size="sm" className="px-0!" onClick={clearFilters}>
                        Clear filters
                        <X />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={onAddClick}
                  className="fixed end-6 bottom-6 z-10 rounded-full! md:size-14">
                  <Plus className="md:size-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Add service request</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex h-[calc(100vh-12rem)] flex-col items-center justify-center py-12 text-center">
          <h3 className="text-xl font-medium">No requests found</h3>
          <p className="text-muted-foreground mt-2">Add a new service request to get started</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}>
          <SortableContext items={items.map((item) => item.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredItems.map((item) => (
                <RequestItem
                  key={item.id}
                  item={item}
                  onClick={() => onSelectItem(item.id)}
                  onStatusChange={(id, status) => void handleStatusChange(id, status)}
                  onStarToggle={handleStarToggle}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeItem ? <RequestItem item={activeItem} isDraggingOverlay /> : null}
          </DragOverlay>
        </DndContext>
      )}
    </>
  );
}
