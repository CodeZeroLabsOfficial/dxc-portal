import { formatProjectDate, projectStatusNamed } from "@/lib/projects";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTitle } from "@/components/shared/typography";

type ProjectDetailCardProps = {
  project: Project;
  clientName: string;
  managerName: string;
};

function MetaField({
  label,
  value,
  align = "left"
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
}) {
  return (
    <div
      className={
        align === "center"
          ? "text-center"
          : align === "right"
            ? "text-right"
            : "text-left"
      }>
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm tabular-nums">{value}</p>
    </div>
  );
}

export function ProjectDetailCard({
  project,
  clientName,
  managerName
}: ProjectDetailCardProps) {
  const statusLabel = projectStatusNamed[project.status] ?? project.status;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/60 bg-gradient-to-br from-card via-card to-muted/20 px-4 py-5 sm:px-6 md:px-8 md:py-6">
        <div className="min-w-0 space-y-3">
          <PageTitle>{project.name}</PageTitle>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="font-medium text-foreground">{clientName}</span>
            <span aria-hidden className="text-muted-foreground/60">
              ·
            </span>
            <span>{managerName}</span>
            <span aria-hidden className="text-muted-foreground/60">
              ·
            </span>
            <Badge className="border-0 capitalize">{statusLabel}</Badge>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6 md:px-8">
        <div className="grid grid-cols-3 items-end gap-3">
          <MetaField label="Start" value={formatProjectDate(project.startDate)} />
          <MetaField
            label="Progress"
            value={`${project.progress}%`}
            align="center"
          />
          <MetaField
            label="End"
            value={formatProjectDate(project.endDate)}
            align="right"
          />
        </div>
        <Progress value={project.progress} />
      </div>

      <div className="border-t">
        <div className="px-4 sm:px-6 md:px-8">
          <TabsList className="-mb-0.5 h-auto! gap-6 border-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="subtasks"
              className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
              Subtasks
            </TabsTrigger>
            <TabsTrigger
              value="risks"
              className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
              Risks & Issues
            </TabsTrigger>
            <TabsTrigger
              value="finance"
              className="data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!">
              Finance
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );
}
