"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";

import { db } from "@/lib/firebase";
import type { Project } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export function ProfileProjects({ userId }: { userId: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "projects"), where("managerId", "==", userId));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setProjects(
          snap.docs.map((item) => {
            const data = item.data();
            return {
              id: item.id,
              clientId: data.clientId,
              name: data.name,
              managerId: data.managerId,
              status: data.status,
              progress: data.progress ?? 0,
              budget: data.budget ?? { allocated: 0, spent: 0, currency: "AUD" },
              createdBy: data.createdBy
            };
          })
        );
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading projects…</p>;
  }

  if (projects.length === 0) {
    return <p className="text-muted-foreground text-sm">No managed projects yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Project</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Progress</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>
              <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                {project.name}
              </Link>
            </TableCell>
            <TableCell>
              <StatusBadge kind="client-status" value={project.status === "active" ? "active" : "inactive"} />
            </TableCell>
            <TableCell className="w-48">
              <div className="flex items-center gap-2">
                <Progress value={project.progress} className="flex-1" />
                <span className="text-muted-foreground text-xs">{project.progress}%</span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
