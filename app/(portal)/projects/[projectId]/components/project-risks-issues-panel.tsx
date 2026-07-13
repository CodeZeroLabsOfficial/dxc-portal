"use client";

import React from "react";
import { Check, PlusCircleIcon, Trash2, X } from "lucide-react";
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

type ChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

type ChecklistCardProps = {
  title: string;
  placeholder: string;
  emptyLabel: string;
  items: ChecklistItem[];
  onAdd: (title: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
};

function ChecklistCard({
  title,
  placeholder,
  emptyLabel,
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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          {!isAdding ? (
            <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
              <PlusCircleIcon />
              Add
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
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
          <div className="bg-muted text-muted-foreground rounded-md p-4 text-center text-sm">
            {emptyLabel}
          </div>
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
        emptyLabel="No risks yet."
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
        emptyLabel="No issues yet."
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
