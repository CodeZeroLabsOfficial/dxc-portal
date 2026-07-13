"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  Timestamp
} from "firebase/firestore";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Plus } from "lucide-react";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import { getStageProgress, SERVICE_REQUEST_STAGES, stageLabel } from "@/lib/service-requests";
import { uploadFile } from "@/lib/storage";
import type { ServiceRequest, ServiceRequestStage, UserProfile } from "@/types";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";
import { getDocs } from "firebase/firestore";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export default function ServiceRequestsPage() {
  const { user, userProfile } = useAuth();
  const { activeClient } = useActiveClient();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<ServiceRequest | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      setRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "serviceRequests"),
      where("clientId", "==", activeClient.id),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setRequests(
          snap.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              clientId: data.clientId,
              title: data.title,
              description: data.description ?? null,
              createdAt: toDate(data.createdAt),
              dueDate: toDate(data.dueDate),
              assigneeId: data.assigneeId ?? null,
              stage: data.stage as ServiceRequestStage,
              progress: data.progress ?? 0,
              createdBy: data.createdBy,
              updatedAt: toDate(data.updatedAt)
            };
          })
        );
        setLoading(false);
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load service requests. Check Firestore indexes.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeClient]);

  async function createRequest() {
    if (!user || !activeClient || !title.trim()) return;
    setSaving(true);
    try {
      const stage: ServiceRequestStage = "created";
      await addDoc(collection(db, "serviceRequests"), {
        clientId: activeClient.id,
        title: title.trim(),
        description: description.trim() || null,
        createdAt: serverTimestamp(),
        dueDate: dueDate ? Timestamp.fromDate(new Date(dueDate)) : null,
        assigneeId: assigneeId || null,
        stage,
        progress: getStageProgress(stage),
        createdBy: user.uid,
        updatedAt: serverTimestamp()
      });
      toast.success("Service request created");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssigneeId("");
    } catch (error) {
      console.error(error);
      toast.error("Unable to create request");
    } finally {
      setSaving(false);
    }
  }

  async function updateStage(requestId: string, stage: ServiceRequestStage) {
    try {
      await updateDoc(doc(db, "serviceRequests", requestId), {
        stage,
        progress: getStageProgress(stage),
        updatedAt: serverTimestamp()
      });
      if (selected?.id === requestId) {
        setSelected((prev) =>
          prev ? { ...prev, stage, progress: getStageProgress(stage) } : prev
        );
      }
      toast.success("Stage updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update stage");
    }
  }

  async function onUpload(file: File) {
    if (!selected || !user) return;
    setUploading(true);
    try {
      const fileId = crypto.randomUUID();
      const path = `service-requests/${selected.id}/${fileId}-${file.name}`;
      const uploaded = await uploadFile(path, file);
      await addDoc(collection(db, "serviceRequests", selected.id, "attachments"), {
        name: file.name,
        storagePath: uploaded.storagePath,
        url: uploaded.url,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp()
      });
      toast.success("File attached");
    } catch (error) {
      console.error(error);
      toast.error("Unable to upload file");
    } finally {
      setUploading(false);
    }
  }

  const columns = useMemo<ColumnDef<ServiceRequest>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => <StatusBadge kind="stage" value={row.original.stage} />
      },
      {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => (
          <div className="w-28 space-y-1">
            <Progress value={row.original.progress} />
            <p className="text-muted-foreground text-xs">{row.original.progress}%</p>
          </div>
        )
      },
      {
        accessorKey: "assigneeId",
        header: "Assignee",
        cell: ({ row }) =>
          users.find((u) => u.uid === row.original.assigneeId)?.displayName ?? "Unassigned"
      },
      {
        accessorKey: "dueDate",
        header: "Due",
        cell: ({ row }) =>
          row.original.dueDate ? format(row.original.dueDate, "dd MMM yyyy") : "—"
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => setSelected(row.original)}>
            Open
          </Button>
        )
      }
    ],
    [users]
  );

  if (!activeClient) {
    return (
      <PageContent>
        <PageHeader title="Service requests" description="Select a client to continue." />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title="Service requests"
        description={`Client: ${activeClient.name}`}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus />
            New request
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading...</p>
          ) : (
            <DataTable columns={columns} data={requests} />
          )}
        </CardContent>
      </Card>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New service request</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
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
          </div>
          <SheetFooter>
            <Button onClick={() => void createRequest()} disabled={saving || !title.trim()}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{selected?.title}</SheetTitle>
          </SheetHeader>
          {selected ? (
            <div className="space-y-6 px-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <div className="flex flex-wrap gap-2">
                  {SERVICE_REQUEST_STAGES.map((stage) => (
                    <Button
                      key={stage}
                      size="sm"
                      variant={selected.stage === stage ? "default" : "outline"}
                      onClick={() => void updateStage(selected.id, stage)}>
                      {stageLabel(stage)}
                    </Button>
                  ))}
                </div>
                <Progress value={selected.progress} className="mt-2" />
                <p className="text-muted-foreground text-xs">{selected.progress}%</p>
              </div>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Created: </span>
                  {selected.createdAt ? format(selected.createdAt, "dd MMM yyyy") : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Due: </span>
                  {selected.dueDate ? format(selected.dueDate, "dd MMM yyyy") : "—"}
                </p>
                <p>
                  <span className="text-muted-foreground">Assignee: </span>
                  {users.find((u) => u.uid === selected.assigneeId)?.displayName ?? "Unassigned"}
                </p>
                <p className="pt-2">{selected.description || "No description"}</p>
              </div>
              <div className="space-y-2">
                <Label>Attach document</Label>
                <Input
                  type="file"
                  disabled={uploading}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onUpload(file);
                  }}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                Created by {userProfile?.displayName ?? "staff"}
              </p>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageContent>
  );
}
