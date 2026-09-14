import { formatProjectDate, projectStatusNamed } from "@/lib/projects";
import { cn, getInitials } from "@/lib/utils";
import type { Project } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { priorityClasses, statusClasses } from "../../enum";

type ProjectDetailCardProps = {
  project: Project;
  logoURL?: string | null;
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

const tabTriggerClass =
  "data-[state=active]:border-b-primary data-[state=active]:text-foreground text-muted-foreground rounded-none border-0 border-b-2 border-transparent bg-transparent! px-0 py-4 shadow-none!";

export function ProjectDetailCard({ project, logoURL }: ProjectDetailCardProps) {
  const statusLabel = projectStatusNamed[project.status] ?? project.status;
  const initials = getInitials(project.name).slice(0, 2) || "P";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card/60 shadow-sm backdrop-blur-sm">
      <div className="border-b border-border/60 bg-gradient-to-br from-card via-card to-muted/20 px-4 py-5 sm:px-6 md:px-8 md:py-6">
        <div className="flex gap-4">
          <div className="bg-primary/10 text-primary hidden size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:flex">
            {logoURL ? (
              <img src={logoURL} alt="" className="size-full object-cover" />
            ) : (
              <span className="text-lg font-semibold">{initials}</span>
            )}
          </div>
          <div className="min-w-0 space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight lg:text-2xl">{project.name}</h1>
            <p className="text-muted-foreground max-w-2xl text-sm">
              {project.description?.trim() || "No description yet."}
            </p>
            <div className="flex flex-wrap items-center gap-2 capitalize">
              <Badge className={cn("border-0", statusClasses[project.status])}>
                {statusLabel}
              </Badge>
              <Badge className={cn("border-0", priorityClasses[project.priority])}>
                {project.priority}
              </Badge>
            </div>
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
          <TabsList className="-mb-0.5 h-auto! max-w-full justify-start gap-6 overflow-x-auto border-none bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabsTrigger value="overview" className={tabTriggerClass}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="tasks" className={tabTriggerClass}>
              Tasks
            </TabsTrigger>
            <TabsTrigger value="risks" className={tabTriggerClass}>
              Risks
            </TabsTrigger>
            <TabsTrigger value="issues" className={tabTriggerClass}>
              Issues
            </TabsTrigger>
            <TabsTrigger value="finance" className={tabTriggerClass}>
              Financials
            </TabsTrigger>
          </TabsList>
        </div>
      </div>
    </div>
  );
}
