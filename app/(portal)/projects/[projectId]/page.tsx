"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

import { db } from "@/lib/firebase";
import { appendProjectActivity } from "@/lib/project-activity";
import { mapProjectDoc, toProjectDate } from "@/lib/projects";
import { useActiveClient } from "@/hooks/use-active-client";
import { useAuth } from "@/hooks/use-auth";
import type { Project, ProjectIssue, ProjectRisk, ProjectSubtask, UserProfile } from "@/types";
import { PageBackButton } from "@/components/shared/page-back-button";
import { PageContent } from "@/components/shared/page-content";
import { SectionTitle } from "@/components/shared/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ProjectDeleteDialog } from "./components/project-delete-dialog";
import { ProjectDetailCard } from "./components/project-detail-card";
import { ProjectEditSheet } from "./components/project-edit-sheet";
import { ProjectOverviewPanel } from "./components/project-overview-panel";
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
  const [riskTitle, setRiskTitle] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [allocated, setAllocated] = useState("0");
  const [spent, setSpent] = useState("0");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
            jobTitle: data.jobTitle ?? null
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

  async function addRisk() {
    if (!riskTitle.trim()) return;
    const title = riskTitle.trim();
    await addDoc(collection(db, "projects", projectId, "risks"), {
      title,
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
    setRiskTitle("");
    await appendProjectActivity({
      projectId,
      type: "risk_added",
      title: "Risk added",
      description: title,
      actorId,
      actorName
    });
    toast.success("Risk added");
  }

  async function addIssue() {
    if (!issueTitle.trim()) return;
    const title = issueTitle.trim();
    await addDoc(collection(db, "projects", projectId, "issues"), {
      title,
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
    setIssueTitle("");
    await appendProjectActivity({
      projectId,
      type: "issue_added",
      title: "Issue added",
      description: title,
      actorId,
      actorName
    });
    toast.success("Issue added");
  }

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
      <div className="flex items-center justify-between">
        <PageBackButton href="/projects" label="Projects" />
        <Button size="sm" onClick={() => setEditOpen(true)}>
          <Pencil />
          Edit
        </Button>
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <ProjectDetailCard project={project} />

        <TabsContent value="overview" className="space-y-4">
          <ProjectOverviewPanel
            project={project}
            clientName={clientName}
            managerName={managerName}
            subtasks={subtasks}
            risks={risks}
            issues={issues}
          />
        </TabsContent>

        <TabsContent value="subtasks" className="space-y-4">
          <ProjectSubtasksPanel
            projectId={projectId}
            subtasks={subtasks}
            users={users}
            actorId={actorId}
            actorName={actorName}
          />
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="space-y-3">
            <SectionTitle className="text-base">Risks</SectionTitle>
            <div className="flex gap-2">
              <Input
                placeholder="New risk"
                value={riskTitle}
                onChange={(e) => setRiskTitle(e.target.value)}
              />
              <Button onClick={() => void addRisk()}>Add</Button>
            </div>
            {risks.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-4 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground capitalize">
                    {item.severity} · {item.status}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-3">
            <SectionTitle className="text-base">Issues</SectionTitle>
            <div className="flex gap-2">
              <Input
                placeholder="New issue"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
              />
              <Button onClick={() => void addIssue()}>Add</Button>
            </div>
            {issues.map((item) => (
              <Card key={item.id}>
                <CardContent className="py-4 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground capitalize">
                    {item.severity} · {item.status.replace("_", " ")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <p className="text-muted-foreground text-sm">Allocated and spent in AUD</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Allocated</Label>
              <Input value={allocated} onChange={(e) => setAllocated(e.target.value)} type="number" />
            </div>
            <div className="space-y-2">
              <Label>Spent</Label>
              <Input value={spent} onChange={(e) => setSpent(e.target.value)} type="number" />
            </div>
          </div>
          <Button onClick={() => void saveFinance()}>Save finance</Button>
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
