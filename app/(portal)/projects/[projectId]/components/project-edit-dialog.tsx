"use client";

import { useEffect, useState } from "react";
import { Timestamp, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import type { Project, ProjectStatus, UserProfile } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

type ProjectEditDialogProps = {
  project: Project;
  users: UserProfile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const STATUSES: ProjectStatus[] = ["active", "on_hold", "completed", "archived"];

function toInputDate(value: Date | null | undefined): string {
  if (!value) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromInputDate(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function ProjectEditDialog({
  project,
  users,
  open,
  onOpenChange
}: ProjectEditDialogProps) {
  const [name, setName] = useState(project.name);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [managerId, setManagerId] = useState(project.managerId);
  const [startDate, setStartDate] = useState(toInputDate(project.startDate));
  const [endDate, setEndDate] = useState(toInputDate(project.endDate));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(project.name);
    setStatus(project.status);
    setManagerId(project.managerId);
    setStartDate(toInputDate(project.startDate));
    setEndDate(toInputDate(project.endDate));
  }, [open, project]);

  async function save() {
    if (!name.trim() || !managerId) return;
    setSaving(true);
    try {
      const start = fromInputDate(startDate);
      const end = fromInputDate(endDate);
      await updateDoc(doc(db, "projects", project.id), {
        name: name.trim(),
        status,
        managerId,
        startDate: start ? Timestamp.fromDate(start) : null,
        endDate: end ? Timestamp.fromDate(end) : null,
        updatedAt: serverTimestamp()
      });
      toast.success("Project updated");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to update project");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Manager</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.uid} value={user.uid}>
                    {user.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-start">Start date</Label>
              <Input
                id="project-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-end">End date</Label>
              <Input
                id="project-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || !name.trim() || !managerId}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
