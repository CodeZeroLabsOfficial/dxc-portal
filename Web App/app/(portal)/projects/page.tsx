import { Metadata } from "next";
import { Plus } from "lucide-react";
import { generateMeta } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { PageContent } from "@/components/shared/page-content";

import projects from "./data.json";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Projects",
    description: "Track project status, progress, and team assignments.",
    canonical: "/projects"
  });
}

export default function ProjectsPage() {
  return (
    <PageContent>
      <PageHeader
        title="Projects"
        description="List of your ongoing projects"
        actions={
          <Button>
            <Plus />
            New Project
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {projects.map((project) => (
          <Link href={`/projects/${project.id}`} key={project.id}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
                <CardDescription>{project.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground mb-4 text-sm">{project.date}</div>

                <div className="mb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm opacity-90">Progress</span>
                    <span className="text-sm font-semibold">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} indicatorColor={project.progressColor} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="*:data-[slot=avatar]:ring-background flex -space-x-2 *:data-[slot=avatar]:ring-2">
                    {project.team.map((member, i) => (
                      <Avatar key={i}>
                        <AvatarImage src={member.avatar} alt={`${member.id}`} />
                        <AvatarFallback>CN</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>

                  <Badge
                    className={`${project.badgeColor} border-0 text-white hover:${project.badgeColor}`}>
                    {project.timeLeft}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </PageContent>
  );
}
