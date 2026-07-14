"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Check,
  CircleAlert,
  Plus,
  Trash2,
  X
} from "lucide-react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { appendProjectActivity } from "@/lib/project-activity";
import { cn } from "@/lib/utils";
import type { ProjectIssue, ProjectRisk } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty";

type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

type ChecklistCardProps = {
  title: string;
  placeholder: string;
  emptyIcon: LucideIcon;
  emptyPrimary: string;
  emptySecondary: React.ReactNode;
  items: ChecklistItem[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
};

function ChecklistCard({
  title,
  placeholder,
  emptyIcon: EmptyIcon,
  emptyPrimary,
  emptySecondary,
  items,
  onAdd,
  onToggle,
  onRemove
}: ChecklistCardProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function handleAdd() {
    if (!draft.trim() || saving) return;
    setSaving(true);
    try {
      await onAdd(draft.trim());
      setDraft("");
      setIsAdding(false);
    } finally {
      setSaving(false);
    }
  }

  function cancelAdd() {
    setIsAdding(false);
    setDraft("");
  }

  return (
    <Card className="border-border/80 flex min-h-80 flex-col bg-card/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardAction>
          {!isAdding ? (
            <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => setIsAdding(true)}>
              <Plus className="size-3.5" aria-hidden />
              Add
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col space-y-4 pt-0">
        {items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-muted flex items-center justify-between rounded-md p-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Checkbox
                    checked={item.done}
                    onCheckedChange={(checked) => void onToggle(item.id, Boolean(checked))}
                  />
                  <span
                    className={cn(
                      "truncate text-sm",
                      item.done && "text-muted-foreground line-through"
                    )}>
                    {item.title}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-400!"
                  size="sm"
                  onClick={() => void onRemove(item.id)}>
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty className="border-0 flex-1 justify-center p-0 py-12">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <EmptyIcon className="text-muted-foreground/50 size-10" aria-hidden />
              </EmptyMedia>
              <EmptyDescription className="max-w-sm space-y-2">
                <p>{emptyPrimary}</p>
                <p>{emptySecondary}</p>
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {isAdding ? (
          <div className="flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={placeholder}
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleAdd();
                if (e.key === "Escape") cancelAdd();
              }}
            />
            <Button onClick={() => void handleAdd()} disabled={saving || !draft.trim()}>
              <Check />
            </Button>
            <Button variant="destructive" onClick={cancelAdd}>
              <X />
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type ProjectRisksIssuesPanelProps = {
  projectId: string;
  risks: ProjectRisk[];
  issues: ProjectIssue[];
  actorId?: string | null;
  actorName?: string | null;
};

export function ProjectRisksIssuesPanel({
  projectId,
  risks,
  issues,
  actorId = null,
  actorName = null
}: ProjectRisksIssuesPanelProps) {
  async function addRisk(title: string) {
    await addDoc(collection(db, "projects", projectId, "risks"), {
      title,
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
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

  async function toggleRisk(id: string, done: boolean) {
    await updateDoc(doc(db, "projects", projectId, "risks", id), {
      status: done ? "closed" : "open"
    });
  }

  async function removeRisk(id: string) {
    await deleteDoc(doc(db, "projects", projectId, "risks", id));
    toast.success("Risk removed");
  }

  async function addIssue(title: string) {
    await addDoc(collection(db, "projects", projectId, "issues"), {
      title,
      description: null,
      severity: "medium",
      status: "open",
      ownerId: null,
      createdAt: serverTimestamp()
    });
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

  async function toggleIssue(id: string, done: boolean) {
    await updateDoc(doc(db, "projects", projectId, "issues", id), {
      status: done ? "resolved" : "open"
    });
  }

  async function removeIssue(id: string) {
    await deleteDoc(doc(db, "projects", projectId, "issues", id));
    toast.success("Issue removed");
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <ChecklistCard
        title="Risks"
        placeholder="Enter risk title"
        emptyIcon={AlertTriangle}
        emptyPrimary="No risks for this project yet."
        emptySecondary={
          <>
            Use <strong className="text-foreground/90">Add</strong> to capture the first risk.
          </>
        }
        items={risks.map((item) => ({
          id: item.id,
          title: item.title,
          done: item.status === "closed"
        }))}
        onAdd={addRisk}
        onToggle={toggleRisk}
        onRemove={removeRisk}
      />
      <ChecklistCard
        title="Issues"
        placeholder="Enter issue title"
        emptyIcon={CircleAlert}
        emptyPrimary="No issues for this project yet."
        emptySecondary={
          <>
            Use <strong className="text-foreground/90">Add</strong> to capture the first issue.
          </>
        }
        items={issues.map((item) => ({
          id: item.id,
          title: item.title,
          done: item.status === "resolved" || item.status === "closed"
        }))}
        onAdd={addIssue}
        onToggle={toggleIssue}
        onRemove={removeIssue}
      />
    </div>
  );
}
