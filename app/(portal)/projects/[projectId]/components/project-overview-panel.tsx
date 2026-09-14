"use client";

import { format, isWithinInterval, startOfWeek, endOfWeek } from "date-fns";
import {
  CheckCircle2Icon,
  CircleIcon,
  InfoIcon,
  PlusIcon,
  TrendingUpIcon
} from "lucide-react";

import {
  daysUntil,
  formatCompactMoney,
  formatProjectDate,
  projectStatusNamed
} from "@/lib/projects";
import { getInitials } from "@/lib/utils";
import type { Project, ProjectSubtask, UserProfile } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { subtaskStatusNamed, type SubtaskStatus } from "./subtask-helpers";

type ProjectOverviewPanelProps = {
  project: Project;
  clientName: string;
  managerName: string;
  users: UserProfile[];
  subtasks: ProjectSubtask[];
  onViewAllTasks?: () => void;
  onNewTask?: () => void;
  onAddTeam?: () => void;
  onToggleTask?: (id: string, nextDone: boolean) => void;
};

const statusVariant: Record<SubtaskStatus, "outline" | "info" | "success"> = {
  todo: "outline",
  in_progress: "info",
  done: "success"
};

function userById(users: UserProfile[], id?: string | null) {
  if (!id) return null;
  return users.find((user) => user.uid === id) ?? null;
}

function userByName(users: UserProfile[], name: string) {
  const needle = name.trim().toLowerCase();
  return users.find((user) => user.displayName.trim().toLowerCase() === needle) ?? null;
}

export function ProjectOverviewPanel({
  project,
  clientName,
  managerName,
  users,
  subtasks,
  onViewAllTasks,
  onNewTask,
  onAddTeam,
  onToggleTask
}: ProjectOverviewPanelProps) {
  const doneCount = subtasks.filter((item) => item.status === "done").length;
  const remainingDays = daysUntil(project.endDate);
  const allocated = project.budget.allocated;
  const spent = project.budget.spent;
  const currency = project.budget.currency || "AUD";
  const budgetUsed = allocated > 0 ? Math.round((spent / allocated) * 100) : 0;
  const money = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const dueThisWeek = subtasks.filter(
    (item) => item.dueDate && isWithinInterval(item.dueDate, { start: weekStart, end: weekEnd })
  ).length;

  const recentTasks = [...subtasks]
    .sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      const aTime = a.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (aTime !== bTime) return aTime - bTime;
      return a.order - b.order;
    })
    .slice(0, 5);

  const manager = userById(users, project.managerId);
  const team = [
    manager
      ? {
          id: manager.uid,
          name: manager.displayName,
          role: manager.jobTitle?.trim() || "Project Manager",
          photoURL: manager.photoURL ?? null
        }
      : project.managerId
        ? {
            id: project.managerId,
            name: managerName,
            role: "Project Manager",
            photoURL: null
          }
        : null,
    ...project.resources.map((name, index) => {
      const match = userByName(users, name);
      return {
        id: match?.uid ?? `resource-${index}`,
        name: match?.displayName ?? name,
        role: match?.jobTitle?.trim() || "Assigned",
        photoURL: match?.photoURL ?? null
      };
    })
  ].filter((member): member is NonNullable<typeof member> => Boolean(member));

  const projectInfo = [
    { label: "Project Manager", value: managerName },
    { label: "Industry", value: project.industry?.trim() || "—" },
    { label: "Started", value: formatProjectDate(project.startDate) },
    { label: "Deadline", value: formatProjectDate(project.endDate) },
    { label: "Budget", value: money(allocated) },
    { label: "Type", value: project.type?.trim() || "—" }
  ];

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="space-y-4 lg:col-span-2 lg:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              About this project
              <Tooltip>
                <TooltipTrigger asChild>
                  <InfoIcon className="text-muted-foreground size-3.5" />
                </TooltipTrigger>
                <TooltipContent>Goal, scope, and current bets</TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {project.description?.trim() || "No description yet."}
            </p>
            {project.goals.length > 0 ? (
              <div className="mt-2 divide-y">
                {project.goals.map((goal, index) => (
                  <div key={`${goal.title}-${index}`} className="flex items-center gap-3 py-3 last:pb-0">
                    {goal.done ? (
                      <CheckCircle2Icon className="size-4.5 shrink-0 text-green-600" />
                    ) : (
                      <CircleIcon className="text-muted-foreground/40 size-4.5 shrink-0" />
                    )}
                    <span className="text-sm font-medium">{goal.title}</span>
                    {goal.status ? (
                      <span className="text-muted-foreground ms-auto shrink-0 text-sm">
                        {goal.status}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <div>
                <div className="font-display text-2xl lg:text-3xl">
                  {doneCount}
                  <span className="text-muted-foreground text-base font-normal">
                    /{subtasks.length}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Tasks · {doneCount} done</p>
              </div>
              <div>
                <div className="font-display text-2xl lg:text-3xl">
                  {remainingDays === null ? "—" : Math.abs(remainingDays)}
                  {remainingDays !== null ? (
                    <span className="text-muted-foreground text-base font-normal">d</span>
                  ) : null}
                </div>
                <p className="text-muted-foreground text-sm">
                  {remainingDays === null
                    ? "No deadline"
                    : remainingDays < 0
                      ? `Overdue ${project.endDate ? format(project.endDate, "MMM d") : ""}`.trim()
                      : `Until ${project.endDate ? format(project.endDate, "MMM d") : "deadline"}`}
                </p>
              </div>
              <div>
                <div className="font-display text-2xl lg:text-3xl">
                  {formatCompactMoney(spent, currency)}
                  <span className="text-muted-foreground text-base font-normal">
                    /{formatCompactMoney(allocated, currency)}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">Budget · {budgetUsed}% used</p>
              </div>
              <div>
                <div className="font-display flex items-center gap-1.5 text-2xl lg:text-3xl">
                  {project.progress}%
                  <TrendingUpIcon className="size-5 text-green-600" />
                </div>
                <p className="text-muted-foreground text-sm">Progress vs plan</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline gap-2">
              Recent Tasks
              <span className="text-muted-foreground text-xs font-normal">
                {Math.min(recentTasks.length, subtasks.length)} of {subtasks.length}
                {dueThisWeek > 0 ? ` · ${dueThisWeek} due this week` : ""}
              </span>
            </CardTitle>
            <CardAction className="flex items-center gap-2 @max-md/card:w-full">
              <Button variant="outline" size="sm" onClick={onViewAllTasks}>
                View all
              </Button>
              <Button size="sm" onClick={onNewTask}>
                <PlusIcon /> New
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {recentTasks.length === 0 ? (
              <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
                No tasks yet on this project.
              </p>
            ) : (
              <div className="divide-y">
                {recentTasks.map((task) => {
                  const assignee = userById(users, task.assigneeId);
                  return (
                    <div key={task.id} className="flex items-center gap-3 px-(--card-spacing) py-3">
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={(checked) =>
                          onToggleTask?.(task.id, checked === true)
                        }
                        aria-label={`Mark ${task.title} as done`}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{task.title}</div>
                        <div className="text-muted-foreground text-xs">
                          {task.dueDate
                            ? `Due ${format(task.dueDate, "MMM d")}`
                            : "No due date"}
                        </div>
                      </div>
                      <Badge variant={statusVariant[task.status]} className="ms-auto shrink-0">
                        {subtaskStatusNamed[task.status]}
                      </Badge>
                      <Avatar className="size-7 shrink-0">
                        <AvatarImage
                          src={assignee?.photoURL ?? undefined}
                          alt={assignee?.displayName ?? "Unassigned"}
                        />
                        <AvatarFallback>
                          {assignee ? getInitials(assignee.displayName).slice(0, 2) : "—"}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 lg:space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-baseline gap-2">
              Team
              <span className="text-muted-foreground text-xs font-normal">
                {team.length} {team.length === 1 ? "member" : "members"}
              </span>
            </CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={onAddTeam}>
                <PlusIcon /> Add
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="p-0">
            {team.length === 0 ? (
              <p className="text-muted-foreground px-(--card-spacing) py-6 text-sm">
                No team members yet.
              </p>
            ) : (
              <div className="divide-y">
                {team.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 px-(--card-spacing) py-3">
                    <Avatar className="size-9">
                      <AvatarImage src={member.photoURL ?? undefined} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name).slice(0, 2) || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{member.name}</div>
                      <div className="text-muted-foreground truncate text-xs">{member.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Info</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="divide-y">
              <div className="flex items-center justify-between px-4 py-3 pt-0 text-sm">
                <span className="text-muted-foreground">Client</span>
                <Badge variant="secondary">{clientName}</Badge>
              </div>
              {projectInfo.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between px-4 py-3 text-sm last:pb-0">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
