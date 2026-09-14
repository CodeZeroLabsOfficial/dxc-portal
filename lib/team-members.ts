import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, inMemoryPersistence, initializeAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import { db, firebaseApp } from "@/lib/firebase";
import type { Client, ClientMemberRole, OrgRole, UserProfile } from "@/types";

export type ClientGrant = {
  clientId: string;
  clientName: string;
  role: ClientMemberRole;
};

export function grantLabel(
  user: UserProfile,
  grants: ClientGrant[],
  clientCount: number
): string {
  if (user.role === "admin") return "All clients";
  if (grants.length === 0) return "No clients";
  if (clientCount > 0 && grants.length >= clientCount) return "All clients";
  return grants.map((grant) => grant.clientName).join(", ");
}

export async function loadClientGrants(clients: Client[]): Promise<Map<string, ClientGrant[]>> {
  const byUser = new Map<string, ClientGrant[]>();
  for (const client of clients) {
    const snap = await getDocs(collection(db, "clients", client.id, "members"));
    for (const member of snap.docs) {
      const rows = byUser.get(member.id) ?? [];
      rows.push({
        clientId: client.id,
        clientName: client.name,
        role: (member.data().role as ClientMemberRole) ?? "staff"
      });
      byUser.set(member.id, rows);
    }
  }
  return byUser;
}

export async function syncClientMemberships({
  userId,
  createdBy,
  clients,
  selectedClientIds,
  allClients,
  role
}: {
  userId: string;
  createdBy: string;
  clients: Client[];
  selectedClientIds: string[];
  allClients: boolean;
  role: ClientMemberRole;
}) {
  const targetIds = new Set(allClients ? clients.map((client) => client.id) : selectedClientIds);
  await Promise.all(
    clients.map(async (client) => {
      const ref = doc(db, "clients", client.id, "members", userId);
      if (targetIds.has(client.id)) {
        await setDoc(ref, {
          role,
          createdBy,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return;
      }
      await deleteDoc(ref);
    })
  );
}

export async function createInvitedMember({
  email,
  password,
  role
}: {
  email: string;
  password: string;
  role: OrgRole;
}): Promise<string> {
  const secondary = initializeApp(firebaseApp.options, `invite-${crypto.randomUUID()}`);
  const secondaryAuth = initializeAuth(secondary, { persistence: inMemoryPersistence });
  const secondaryDb = getFirestore(secondary);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;
    await setDoc(doc(secondaryDb, "users", uid), {
      uid,
      displayName: email.split("@")[0] || "User",
      email,
      photoURL: null,
      role,
      language: "en",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return uid;
  } finally {
    await deleteApp(secondary);
  }
}

export function inviteErrorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "auth/email-already-in-use") return "An account with this email already exists.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Password is too weak.";
  if (code === "auth/operation-not-allowed") return "Email/password accounts are disabled.";
  if (code === "auth/too-many-requests") return "Too many attempts. Try again later.";
  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "You do not have permission to add this member.";
  }
  return "Could not create member.";
}
