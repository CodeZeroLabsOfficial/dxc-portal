"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp
} from "firebase/firestore";
import { AlertTriangle, Briefcase, CalendarDays, ListTodo } from "lucide-react";

import { db } from "@/lib/firebase";
import { useActiveClient } from "@/hooks/use-active-client";
import type { Project, ServiceRequest } from "@/types";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AchievementByYear } from "./achievement-by-year";
import { ChartProjectOverview } from "./chart-project-overview";
import { ChartProjectEfficiency } from "./chart-project-efficiency";
import { Reminders } from "./reminders";
import { SuccessMetrics } from "./success-metrics";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

export function DashboardOverview() {
  const { activeClient } = useActiveClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [leaveCount, setLeaveCount] = useState(0);

  useEffect(() => {
    if (!activeClient) {
      setProjects([]);
      setRequests([]);
      return;
    }

    const projectsQuery = query(
      collection(db, "projects"),
      where("clientId", "==", activeClient.id),
      orderBy("updatedAt", "desc")
    );
    const requestsQuery = query(
      collection(db, "serviceRequests"),
      where("clientId", "==", activeClient.id),
      orderBy("updatedAt", "desc")
    );

    const unsubProjects = onSnapshot(projectsQuery, (snap) => {
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
    });

    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
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
            stage: data.stage,
            progress: data.progress ?? 0,
            createdBy: data.createdBy
          };
        })
      );
    });

    return () => {
      unsubProjects();
      unsubRequests();
    };
  }, [activeClient]);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const leaveQuery = query(
      collection(db, "calendarEvents"),
      where("type", "==", "annual_leave"),
      where("start", ">=", Timestamp.fromDate(start)),
      where("start", "<=", Timestamp.fromDate(end))
    );
    const unsubscribe = onSnapshot(leaveQuery, (snap) => setLeaveCount(snap.size));
    return () => unsubscribe();
  }, []);

  const openProjects = projects.filter((item) => item.status === "active").length;
  const openRequests = requests.filter((item) => item.stage !== "completed").length;
  const overdueRequests = requests.filter(
    (item) => item.dueDate && item.dueDate < new Date() && item.stage !== "completed"
  ).length;

  return (
    <div className="space-y-4">
      {!activeClient ? (
        <p className="text-muted-foreground text-sm">Select a client to view live metrics.</p>
      ) : null}

      <div className="*:data-[slot=card]:from-primary/10 grid gap-4 *:data-[slot=card]:bg-gradient-to-t md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active projects</CardTitle>
            <CardDescription>
              {activeClient ? `For ${activeClient.name}` : "Select a client"}
            </CardDescription>
            <CardAction>
              <Briefcase className="text-muted-foreground/50 size-4 lg:size-6" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl lg:text-3xl">{openProjects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open requests</CardTitle>
            <CardDescription>
              {activeClient ? `For ${activeClient.name}` : "Select a client"}
            </CardDescription>
            <CardAction>
              <ListTodo className="text-muted-foreground/50 size-4 lg:size-6" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl lg:text-3xl">{openRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Overdue requests</CardTitle>
            <CardDescription>
              {activeClient ? `For ${activeClient.name}` : "Select a client"}
            </CardDescription>
            <CardAction>
              <AlertTriangle className="text-muted-foreground/50 size-4 lg:size-6" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl lg:text-3xl">{overdueRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Leave this month</CardTitle>
            <CardDescription>Across the organisation</CardDescription>
            <CardAction>
              <CalendarDays className="text-muted-foreground/50 size-4 lg:size-6" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="font-display text-2xl lg:text-3xl">{leaveCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartProjectOverview />
        </div>
        <SuccessMetrics />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <Reminders />
        <AchievementByYear />
        <ChartProjectEfficiency />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.slice(0, 5).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{project.name}</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </Link>
            ))}
            {activeClient && projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects yet.</p>
            ) : null}
            {!activeClient ? (
              <p className="text-muted-foreground text-sm">Select a client to view projects.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent service requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{request.title}</p>
                  <p className="text-muted-foreground text-xs">{request.progress}%</p>
                </div>
                <StatusBadge kind="stage" value={request.stage} />
              </div>
            ))}
            {activeClient && requests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No service requests yet.</p>
            ) : null}
            {!activeClient ? (
              <p className="text-muted-foreground text-sm">
                Select a client to view service requests.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
