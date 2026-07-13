"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where
} from "firebase/firestore";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { db } from "@/lib/firebase";
import { mapProjectDoc, projectStatusNamed } from "@/lib/projects";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import type { Project, UserProfile } from "@/types";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { priorityClasses, statusClasses } from "./enum";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { getDocs } from "firebase/firestore";

export default function ProjectsPage() {
  const { user } = useAuth();
  const { activeClient } = useActiveClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [managerId, setManagerId] = useState("");
  const [allocated, setAllocated] = useState("0");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getDocs(collection(db, "users")).then((snap) => {
      setUsers(
        snap.docs.map((item) => {
          const data = item.data();
          return {
            uid: item.id,
            displayName: data.displayName ?? "User",
            email: data.email ?? "",
            role: data.role ?? "staff"
          };
        })
      );
    });
  }, []);

  useEffect(() => {
    if (!activeClient) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const q = query(
      collection(db, "projects"),
      where("clientId", "==", activeClient.id),
      orderBy("updatedAt", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProjects(
          snap.docs.map((item) => mapProjectDoc(item.id, item.data() as Record<string, unknown>))
        );
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load projects. Check Firestore indexes.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [activeClient]);

  async function createProject() {
    if (!user || !activeClient || !name.trim() || !managerId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, "projects"), {
        clientId: activeClient.id,
        name: name.trim(),
        managerId,
        status: "active",
        priority: "medium",
        resources: [],
        progress: 0,
        startDate: null,
        endDate: null,
        budget: {
          allocated: Number(allocated) || 0,
          spent: 0,
          currency: "AUD"
        },
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success("Project created");
      setOpen(false);
      setName("");
      setManagerId("");
      setAllocated("0");
    } catch (error) {
      console.error(error);
      toast.error("Unable to create project");
    } finally {
      setSaving(false);
    }
  }

  if (!activeClient) {
    return (
      <PageContent>
        <PageHeader title="Projects" description="Select a client to continue." />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title="Projects"
        description={`Client: ${activeClient.name}`}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus />
            New Project
          </Button>
        }
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-sm">
            No projects yet for this client.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id}>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Manager:{" "}
                    {users.find((item) => item.uid === project.managerId)?.displayName ?? "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-semibold">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 capitalize">
                      <Badge className={cn("border-0", statusClasses[project.status])}>
                        {projectStatusNamed[project.status] ?? project.status}
                      </Badge>
                      <Badge className={cn("border-0", priorityClasses[project.priority])}>
                        {project.priority}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ${project.budget.spent.toLocaleString()} / $
                      {project.budget.allocated.toLocaleString()} {project.budget.currency}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Project name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Project manager</Label>
              <Select value={managerId} onValueChange={setManagerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((item) => (
                    <SelectItem key={item.uid} value={item.uid}>
                      {item.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Budget allocated (AUD)</Label>
              <Input
                type="number"
                min="0"
                value={allocated}
                onChange={(e) => setAllocated(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => void createProject()}
              disabled={saving || !name.trim() || !managerId}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContent>
  );
}
