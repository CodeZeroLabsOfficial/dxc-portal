import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";

import { db } from "@/lib/firebase";
import type { ProjectActivityType } from "@/types";

type AppendProjectActivityInput = {
  projectId: string;
  type: ProjectActivityType;
  title: string;
  description?: string | null;
  actorId?: string | null;
  actorName?: string | null;
};

export async function appendProjectActivity({
  projectId,
  type,
  title,
  description = null,
  actorId = null,
  actorName = null
}: AppendProjectActivityInput) {
  await addDoc(collection(db, "projects", projectId, "activities"), {
    type,
    title,
    description,
    actorId,
    actorName,
    createdAt: serverTimestamp()
  });
}

export function formatActivityTimestamp(value: Date | null | undefined) {
  if (!value) return "Just now";
  return formatDistanceToNow(value, { addSuffix: true });
}
