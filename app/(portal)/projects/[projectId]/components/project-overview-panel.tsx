"use client";

import { formatProjectDate, projectStatusNamed } from "@/lib/projects";
import type { Project, ProjectIssue, ProjectRisk, ProjectSubtask } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProjectActivityStream } from "./project-activity-stream";

type ProjectOverviewPanelProps = {
  project: Project;
  clientName: string;
  managerName: string;
  subtasks: ProjectSubtask[];
  risks: ProjectRisk[];
  issues: ProjectIssue[];
};

function DetailSection({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-muted-foreground mb-3 text-xs font-medium uppercase">{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export function ProjectOverviewPanel({
  project,
  clientName,
  managerName,
  subtasks,
  risks,
  issues
}: ProjectOverviewPanelProps) {
  const done = subtasks.filter((item) => item.status === "done").length;
  const inProgress = subtasks.filter((item) => item.status === "in_progress").length;
  const todo = subtasks.filter((item) => item.status === "todo").length;
  const openRisks = risks.filter((item) => item.status !== "closed").length;
  const openIssues = issues.filter(
    (item) => item.status !== "resolved" && item.status !== "closed"
  ).length;
  const remaining = project.budget.allocated - project.budget.spent;
  const currency = project.budget.currency || "AUD";
  const money = (value: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0
    }).format(value);

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DetailSection label="Status">
            <DetailRow
              label="Status"
              value={
                <Badge variant="secondary" className="capitalize">
                  {projectStatusNamed[project.status] ?? project.status}
                </Badge>
              }
            />
            <DetailRow
              label="Priority"
              value={<span className="capitalize">{project.priority}</span>}
            />
            <div className="space-y-2">
              <DetailRow label="Progress" value={`${project.progress}%`} />
              <Progress value={project.progress} />
            </div>
          </DetailSection>

          <DetailSection label="Ownership">
            <DetailRow label="Client" value={clientName} />
            <DetailRow label="Manager" value={managerName} />
            <DetailRow
              label="Resources"
              value={
                project.resources.length
                  ? project.resources.join(", ")
                  : "—"
              }
            />
          </DetailSection>

          <DetailSection label="Schedule">
            <DetailRow
              label="Start"
              value={formatProjectDate(project.startDate)}
            />
            <DetailRow label="End" value={formatProjectDate(project.endDate)} />
          </DetailSection>

          <DetailSection label="Work summary">
            <DetailRow
              label="Subtasks"
              value={`${subtasks.length} (${done} done · ${inProgress} in progress · ${todo} todo)`}
            />
            <DetailRow label="Risks" value={`${openRisks} open`} />
            <DetailRow label="Issues" value={`${openIssues} open`} />
          </DetailSection>

          <DetailSection label="Budget">
            <DetailRow label="Allocated" value={money(project.budget.allocated)} />
            <DetailRow label="Spent" value={money(project.budget.spent)} />
            <DetailRow label="Remaining" value={money(remaining)} />
          </DetailSection>
        </CardContent>
      </Card>

      <ProjectActivityStream projectId={project.id} />
    </div>
  );
}
