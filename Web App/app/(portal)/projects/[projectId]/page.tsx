"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { averageProgress } from "@/lib/projects";
import type { Project, ProjectIssue, ProjectRisk, ProjectSubtask } from "@/types";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [project, setProject] = useState<Project | null>(null);
  const [subtasks, setSubtasks] = useState<ProjectSubtask[]>([]);
  const [risks, setRisks] = useState<ProjectRisk[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [riskTitle, setRiskTitle] = useState("");
  const [issueTitle, setIssueTitle] = useState("");
  const [allocated, setAllocated] = useState("0");
  const [spent, setSpent] = useState("0");

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "projects", projectId), (snap) => {
      if (!snap.exists()) {
        setProject(null);
        return;
      }
      const data = snap.data();
      setProject({
        id: snap.id,
        clientId: data.clientId,
        name: data.name,
        managerId: data.managerId,
        status: data.status,
        progress: data.progress ?? 0,
        budget: data.budget ?? { allocated: 0, spent: 0, currency: "AUD" },
        createdBy: data.createdBy
      });
      setAllocated(String(data.budget?.allocated ?? 0));
      setSpent(String(data.budget?.spent ?? 0));
    });
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    const unsubSubtasks = onSnapshot(collection(db, "projects", projectId, "subtasks"), (snap) => {
      setSubtasks(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            id: item.id,
            title: data.title,
            assigneeId: data.assigneeId ?? null,
            status: data.status,
            progress: data.progress ?? 0,
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

  async function refreshProjectProgress(nextSubtasks: ProjectSubtask[]) {
    const progress = averageProgress(nextSubtasks.map((item) => item.progress));
    await updateDoc(doc(db, "projects", projectId), {
      progress,
      updatedAt: serverTimestamp()
    });
  }

  async function addSubtask() {
    if (!subtaskTitle.trim()) return;
    const title = subtaskTitle.trim();
    const created = await addDoc(collection(db, "projects", projectId, "subtasks"), {
      title,
      assigneeId: null,
      status: "todo",
      progress: 0,
      dueDate: null,
      order: subtasks.length
    });
    setSubtaskTitle("");
    const next = [
      ...subtasks,
      {
        id: created.id,
        title,
        status: "todo" as const,
        progress: 0,
        order: subtasks.length
      }
    ];
    await refreshProjectProgress(next);
    toast.success("Subtask added");
  }

  async function updateSubtaskProgress(subtaskId: string, progress: number) {
    const status: ProjectSubtask["status"] =
      progress >= 100 ? "done" : progress > 0 ? "in_progress" : "todo";
    await updateDoc(doc(db, "projects", projectId, "subtasks", subtaskId), {
      progress,
      status
    });
    const next = subtasks.map((item) =>
      item.id === subtaskId ? { ...item, progress, status } : item
    );
    await refreshProjectProgress(next);
  }

  async function addRisk() {
    if (!riskTitle.trim()) return;
    await addDoc(collection(db, "projects", projectId, "risks"), {
      title: riskTitle.trim(),
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
    setRiskTitle("");
    toast.success("Risk added");
  }

  async function addIssue() {
    if (!issueTitle.trim()) return;
    await addDoc(collection(db, "projects", projectId, "issues"), {
      title: issueTitle.trim(),
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
    setIssueTitle("");
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
    toast.success("Finance updated");
  }

  if (!project) {
    return (
      <PageContent>
        <PageHeader title="Project" description="Loading..." />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title={project.name}
        description={`Progress ${project.progress}% · ${project.status.replace("_", " ")}`}
      />
      <Progress value={project.progress} />

      <Tabs defaultValue="subtasks">
        <TabsList>
          <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
          <TabsTrigger value="risks">Risks & Issues</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
        </TabsList>

        <TabsContent value="subtasks" className="space-y-4">
          <SectionHeader title="Subtasks" />
          <div className="flex gap-2">
            <Input
              placeholder="New subtask"
              value={subtaskTitle}
              onChange={(e) => setSubtaskTitle(e.target.value)}
            />
            <Button onClick={() => void addSubtask()}>Add</Button>
          </div>
          <div className="space-y-3">
            {subtasks.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <Progress value={item.progress} className="mt-2" />
                  </div>
                  <Select
                    value={String(item.progress)}
                    onValueChange={(value) => void updateSubtaskProgress(item.id, Number(value))}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 25, 50, 75, 100].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <div className="space-y-3">
            <SectionHeader title="Risks" />
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
            <SectionHeader title="Issues" />
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
          <SectionHeader title="Finance" description="Allocated and spent in AUD" />
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
    </PageContent>
  );
}
