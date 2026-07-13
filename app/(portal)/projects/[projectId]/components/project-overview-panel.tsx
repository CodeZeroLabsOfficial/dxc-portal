import type { ReactNode } from "react";

import { formatProjectDate, projectStatusNamed } from "@/lib/projects";
import type { Project, ProjectIssue, ProjectRisk, ProjectSubtask } from "@/types";
import { MutedText, SectionTitle } from "@/components/shared/typography";

type ProjectOverviewPanelProps = {
  project: Project;
  clientName: string;
  managerName: string;
  subtasks: ProjectSubtask[];
  risks: ProjectRisk[];
  issues: ProjectIssue[];
};

function OverviewBlock({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <SectionTitle className="text-base">{title}</SectionTitle>
      {children}
    </div>
  );
}

function StatRow({ label, value, capitalize }: { label: string; value: string; capitalize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <MutedText>{label}</MutedText>
      <span className={capitalize ? "font-medium capitalize tabular-nums" : "font-medium tabular-nums"}>
        {value}
      </span>
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
    <div className="grid gap-6 sm:grid-cols-2">
      <OverviewBlock title="Status">
        <StatRow
          label="Status"
          value={projectStatusNamed[project.status] ?? project.status}
        />
        <StatRow label="Priority" value={project.priority} capitalize />
        <StatRow label="Progress" value={`${project.progress}%`} />
      </OverviewBlock>

      <OverviewBlock title="Schedule">
        <StatRow
          label="Range"
          value={`${formatProjectDate(project.startDate)} → ${formatProjectDate(project.endDate)}`}
        />
      </OverviewBlock>

      <OverviewBlock title="Ownership">
        <StatRow label="Client" value={clientName} />
        <StatRow label="Manager" value={managerName} />
      </OverviewBlock>

      <OverviewBlock title="Work summary">
        <StatRow
          label="Subtasks"
          value={`${subtasks.length} (${done} done · ${inProgress} in progress · ${todo} todo)`}
        />
        <StatRow label="Risks" value={`${openRisks} open`} />
        <StatRow label="Issues" value={`${openIssues} open`} />
      </OverviewBlock>

      <OverviewBlock title="Budget snapshot">
        <StatRow label="Allocated" value={money(project.budget.allocated)} />
        <StatRow label="Spent" value={money(project.budget.spent)} />
        <StatRow label="Remaining" value={money(remaining)} />
      </OverviewBlock>
    </div>
  );
}
