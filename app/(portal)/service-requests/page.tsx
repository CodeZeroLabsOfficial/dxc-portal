"use client";

import { useEffect, useMemo } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";

import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/storage";
import { getStageProgress } from "@/lib/service-requests";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import type { ServiceRequestStage } from "@/types";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";

import RequestsBoard from "./components/requests-board";
import { useServiceRequestStore } from "./store";
import type { RequestFile, RequestPriority, ServiceRequestItem } from "./types";

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function mapDoc(id: string, data: Record<string, unknown>): ServiceRequestItem {
  const stage = (data.stage as ServiceRequestStage) || "created";
  return {
    id,
    clientId: String(data.clientId ?? ""),
    title: String(data.title ?? ""),
    description: (data.description as string | undefined) ?? undefined,
    assignedTo: Array.isArray(data.assignedTo) ? (data.assignedTo as string[]) : [],
    comments: Array.isArray(data.comments)
      ? (data.comments as Array<Record<string, unknown>>).map((comment) => ({
          id: String(comment.id ?? uuidv4()),
          text: String(comment.text ?? ""),
          createdAt: toDate(comment.createdAt) ?? new Date()
        }))
      : [],
    status: stage,
    priority: ((data.priority as RequestPriority) || "medium") as RequestPriority,
    progress: Number(data.progress ?? getStageProgress(stage)),
    createdAt: toDate(data.createdAt) ?? new Date(),
    dueDate: toDate(data.dueDate),
    reminderDate: toDate(data.reminderDate),
    files: Array.isArray(data.files)
      ? (data.files as Array<Record<string, unknown>>).map((file) => ({
          id: String(file.id ?? uuidv4()),
          name: String(file.name ?? "file"),
          url: String(file.url ?? ""),
          type: String(file.type ?? ""),
          size: Number(file.size ?? 0),
          uploadedAt: toDate(file.uploadedAt) ?? new Date(),
          storagePath: file.storagePath ? String(file.storagePath) : undefined
        }))
      : [],
    subTasks: Array.isArray(data.subTasks)
      ? (data.subTasks as Array<Record<string, unknown>>).map((subTask) => ({
          id: String(subTask.id ?? uuidv4()),
          title: String(subTask.title ?? ""),
          completed: Boolean(subTask.completed)
        }))
      : [],
    starred: Boolean(data.starred),
    createdBy: String(data.createdBy ?? "")
  };
}

export default function ServiceRequestsPage() {
  const { user } = useAuth();
  const { activeClient } = useActiveClient();
  const { setItems, setPersistence } = useServiceRequestStore();

  const persistence = useMemo(() => {
    if (!user || !activeClient) return null;

    return {
      create: async (item: {
        title: string;
        description?: string;
        assignedTo: string[];
        status: ServiceRequestStage;
        priority: RequestPriority;
        dueDate?: Date | null;
        reminderDate?: Date | null;
      }) => {
        const ref = await addDoc(collection(db, "serviceRequests"), {
          clientId: activeClient.id,
          title: item.title,
          description: item.description ?? null,
          assignedTo: item.assignedTo,
          stage: item.status,
          progress: getStageProgress(item.status),
          priority: item.priority,
          dueDate: item.dueDate ? Timestamp.fromDate(item.dueDate) : null,
          reminderDate: item.reminderDate ? Timestamp.fromDate(item.reminderDate) : null,
          comments: [],
          files: [],
          subTasks: [],
          starred: false,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return ref.id;
      },
      update: async (id: string, patch: Partial<ServiceRequestItem>) => {
        const payload: Record<string, unknown> = {
          updatedAt: serverTimestamp()
        };

        if (patch.title !== undefined) payload.title = patch.title;
        if (patch.description !== undefined) payload.description = patch.description ?? null;
        if (patch.assignedTo !== undefined) payload.assignedTo = patch.assignedTo;
        if (patch.status !== undefined) {
          payload.stage = patch.status;
          payload.progress = patch.progress ?? getStageProgress(patch.status);
        }
        if (patch.progress !== undefined) payload.progress = patch.progress;
        if (patch.priority !== undefined) payload.priority = patch.priority;
        if (patch.dueDate !== undefined) {
          payload.dueDate = patch.dueDate ? Timestamp.fromDate(patch.dueDate) : null;
        }
        if (patch.reminderDate !== undefined) {
          payload.reminderDate = patch.reminderDate
            ? Timestamp.fromDate(patch.reminderDate)
            : null;
        }
        if (patch.comments !== undefined) {
          payload.comments = patch.comments.map((comment) => ({
            ...comment,
            createdAt: Timestamp.fromDate(comment.createdAt)
          }));
        }
        if (patch.files !== undefined) {
          payload.files = patch.files.map((file) => ({
            ...file,
            uploadedAt: Timestamp.fromDate(file.uploadedAt)
          }));
        }
        if (patch.subTasks !== undefined) payload.subTasks = patch.subTasks;
        if (patch.starred !== undefined) payload.starred = patch.starred;

        await updateDoc(doc(db, "serviceRequests", id), payload);
      },
      remove: async (id: string) => {
        await deleteDoc(doc(db, "serviceRequests", id));
      },
      uploadFile: async (requestId: string, file: File): Promise<RequestFile> => {
        const uploaded = await uploadFile(
          `service-requests/${requestId}/${Date.now()}-${file.name}`,
          file
        );
        return {
          id: uuidv4(),
          name: file.name,
          url: uploaded.url,
          type: file.type,
          size: file.size,
          uploadedAt: new Date(),
          storagePath: uploaded.storagePath
        };
      }
    };
  }, [user, activeClient]);

  useEffect(() => {
    setPersistence(persistence);
    return () => setPersistence(null);
  }, [persistence, setPersistence]);

  useEffect(() => {
    if (!activeClient) {
      setItems([]);
      return;
    }

    const q = query(
      collection(db, "serviceRequests"),
      where("clientId", "==", activeClient.id),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((item) => mapDoc(item.id, item.data())));
      },
      (error) => {
        console.error(error);
        toast.error("Unable to load service requests. Check Firestore indexes.");
      }
    );

    return () => unsubscribe();
  }, [activeClient, setItems]);

  if (!activeClient) {
    return (
      <PageContent>
        <PageHeader title="Service requests" description="Select a client to continue." />
      </PageContent>
    );
  }

  return (
    <PageContent>
      <RequestsBoard />
    </PageContent>
  );
}
