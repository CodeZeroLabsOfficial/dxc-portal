"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { appendProjectActivity } from "@/lib/project-activity";
import { averageProgress, mapProjectDoc, toProjectDate } from "@/lib/projects";
import { useActiveClient } from "@/hooks/use-active-client";
import { useAuth } from "@/hooks/use-auth";
import type { Project, ProjectIssue, ProjectRisk, ProjectSubtask, UserProfile } from "@/types";
import { PageBackButton } from "@/components/shared/page-back-button";
import { PageContent } from "@/components/shared/page-content";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectDeleteDialog } from "./components/project-delete-dialog";
import { ProjectDetailCard } from "./components/project-detail-card";
import { ProjectEditSheet } from "./components/project-edit-sheet";
import { ProjectOverviewPanel } from "./components/project-overview-panel";
import { ProjectIssuesPanel, ProjectRisksPanel } from "./components/project-risks-issues-panel";
import { ProjectSubtasksPanel } from "./components/project-subtasks-panel";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { activeClient } = useActiveClient();
  const { user, userProfile } = useAuth();
  const actorId = user?.uid ?? null;
  const actorName = userProfile?.displayName ?? user?.email ?? null;
  const [project, setProject] = useState<Project | null>(null);
  const [managerName, setManagerName] = useState("—");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subtasks, setSubtasks] = useState<ProjectSubtask[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [allocated, setAllocated] = useState("0");
  const [spent, setSpent] = useState("0");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState("overview");
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);

  useEffect(() => {
    void getDocs(collection(db, "users")).then((snap) => {
      setUsers(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            uid: item.id,
            displayName: data.displayName ?? "User",
            email: data.email ?? "",
            role: data.role ?? "staff",
            jobTitle: data.jobTitle ?? null,
            photoURL: data.photoURL ?? null
          };
        })
      );
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "projects", projectId), (snap) => {
      if (!snap.exists()) {
        setProject(null);
        return;
      }
      const data = snap.data();
      setProject(mapProjectDoc(snap.id, data as Record<string, unknown>));
      setAllocated(String(data.budget?.allocated ?? 0));
      setSpent(String(data.budget?.spent ?? 0));
    });
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    if (!project?.managerId) {
      setManagerName("—");
      return;
    }
    let cancelled = false;
    void getDoc(doc(db, "users", project.managerId)).then((snap) => {
      if (cancelled) return;
      if (!snap.exists()) {
        setManagerName("—");
        return;
      }
      const data = snap.data();
      setManagerName(data.displayName?.trim() || data.email || "—");
    });
    return () => {
      cancelled = true;
    };
  }, [project?.managerId]);

  useEffect(() => {
    const unsubSubtasks = onSnapshot(collection(db, "projects", projectId, "subtasks"), (snap) => {
      setSubtasks(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            title: data.title,
            assigneeId: data.assigneeId ?? null,
            status: data.status ?? "todo",
            progress: data.progress ?? 0,
            dueDate: toProjectDate(data.dueDate),
            order: data.order ?? 0
          };
        })
      );
    });
    const unsubRisks = onSnapshot(collection(db, "projects", projectId, "risks"), (snap) => {
      setRisks(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            title: data.title,
            description: data.description ?? null,
            severity: data.severity,
            status: data.status,
            ownerId: data.ownerId ?? null
          };
        })
      );
    });
    const unsubIssues = onSnapshot(collection(db, "projects", projectId, "issues"), (snap) => {
      setIssues(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            title: data.title,
            description: data.description ?? null,
            severity: data.severity,
            status: data.status,
            ownerId: data.ownerId ?? null
          };
        })
      );
    });
    return () => {
      unsubSubtasks();
      unsubRisks();
      unsubIssues();
    };
  }, [projectId]);

  async function saveFinance() {
    await updateDoc(doc(db, "projects", projectId), {
      budget: {
        allocated: Number(allocated) || 0,
        spent: Number(spent) || 0,
        currency: "AUD"
      },
      updatedAt: serverTimestamp()
    });
    await appendProjectActivity({
      projectId,
      type: "finance_updated",
      title: "Finance updated",
      description: `Allocated ${Number(allocated) || 0} · Spent ${Number(spent) || 0}`,
      actorId,
      actorName
    });
    toast.success("Finance updated");
  }

  async function toggleTask(id: string, nextDone: boolean) {
    const current = subtasks.find((item) => item.id === id);
    if (!current) return;
    const progress = nextDone ? 100 : 0;
    const status = nextDone ? "done" : "todo";
    await updateDoc(doc(db, "projects", projectId, "subtasks", id), { progress, status });
    const next = subtasks.map((item) =>
      item.id === id ? { ...item, progress, status } : item
    );
    await updateDoc(doc(db, "projects", projectId), {
      progress: averageProgress(next.map((item) => item.progress))
    });
    await appendProjectActivity({
      projectId,
      type: "subtask_progress",
      title: nextDone ? "Task completed" : "Task reopened",
      description: current.title,
      actorId,
      actorName
    });
  }

  const clientName = activeClient?.name?.trim() || "—";

  if (!project) {
    return (
      <PageContent>
        <div className="flex items-center justify-between">
          <PageBackButton href="/projects" label="Projects" />
        </div>
        <p className="text-muted-foreground text-sm">Loading…</p>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <Tabs value={tab} onValueChange={setTab} className="gap-4">
        <ProjectDetailCard
          project={project}
          logoURL={activeClient?.logoURL}
          onEdit={() => setEditOpen(true)}
        />

        <TabsContent value="overview" className="space-y-4">
          <ProjectOverviewPanel
            project={project}
            clientName={clientName}
            managerName={managerName}
            users={users}
            subtasks={subtasks}
            onViewAllTasks={() => setTab("tasks")}
            onNewTask={() => {
              setTab("tasks");
              setTaskSheetOpen(true);
            }}
            onAddTeam={() => setEditOpen(true)}
            onToggleTask={(id, nextDone) => void toggleTask(id, nextDone)}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <ProjectSubtasksPanel
            projectId={projectId}
            subtasks={subtasks}
            users={users}
            actorId={actorId}
            actorName={actorName}
            createOpen={taskSheetOpen}
            onCreateOpenChange={setTaskSheetOpen}
          />
        </TabsContent>

        <TabsContent value="risks" className="space-y-4">
          <ProjectRisksPanel
            projectId={projectId}
            risks={risks}
            actorId={actorId}
            actorName={actorName}
          />
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <ProjectIssuesPanel
            projectId={projectId}
            issues={issues}
            actorId={actorId}
            actorName={actorName}
          />
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <Card className="border-border/80 flex min-h-80 flex-col bg-card/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Financials</CardTitle>
              <CardAction>
                <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => void saveFinance()}>
                  Save
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
              <p className="text-muted-foreground text-sm">Allocated and spent in AUD</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Allocated</Label>
                  <Input
                    value={allocated}
                    onChange={(e) => setAllocated(e.target.value)}
                    type="number"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spent</Label>
                  <Input value={spent} onChange={(e) => setSpent(e.target.value)} type="number" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectEditSheet
        project={project}
        users={users}
        open={editOpen}
        onOpenChange={setEditOpen}
        onDelete={() => setDeleteOpen(true)}
      />
      <ProjectDeleteDialog
        projectId={project.id}
        projectName={project.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </PageContent>
  );
}
