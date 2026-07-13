"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import type { Client, ClientMemberRole } from "@/types";

type ActiveClientContextValue = {
  clients: Client[];
  activeClient: Client | null;
  loading: boolean;
  setActiveClientId: (clientId: string) => Promise<void>;
  createClient: (name: string) => Promise<string>;
  refreshClients: () => Promise<void>;
};

const ActiveClientContext = createContext<ActiveClientContextValue | undefined>(undefined);

function mapClient(id: string, data: Record<string, unknown>): Client {
  return {
    id,
    name: String(data.name ?? "Untitled"),
    status: (data.status as Client["status"]) ?? "active",
    logoURL: (data.logoURL as string | null) ?? null,
    color: (data.color as string | null) ?? null,
    createdBy: String(data.createdBy ?? ""),
    createdAt: null,
    updatedAt: null
  };
}

export function ActiveClientProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const isOrgAdmin = userProfile?.role === "admin";

  const refreshClients = useCallback(async () => {
    if (!user || !userProfile) {
      setClients([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "clients"));
      if (isOrgAdmin) {
        setClients(snap.docs.map((item) => mapClient(item.id, item.data())));
      } else {
        const accessible: Client[] = [];
        for (const clientDoc of snap.docs) {
          const memberSnap = await getDoc(doc(db, "clients", clientDoc.id, "members", user.uid));
          if (memberSnap.exists()) {
            accessible.push(mapClient(clientDoc.id, clientDoc.data()));
          }
        }
        setClients(accessible);
      }
    } catch (error) {
      console.error("Failed to load clients", error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [user, userProfile, isOrgAdmin]);

  useEffect(() => {
    void refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    if (!user || !isOrgAdmin) return;
    const unsubscribe = onSnapshot(collection(db, "clients"), (snap) => {
      setClients(snap.docs.map((item) => mapClient(item.id, item.data())));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, isOrgAdmin]);

  const activeClient = useMemo(() => {
    if (!clients.length) return null;
    const preferred = userProfile?.activeClientId;
    return clients.find((client) => client.id === preferred) ?? clients[0] ?? null;
  }, [clients, userProfile?.activeClientId]);

  const setActiveClientId = useCallback(
    async (clientId: string) => {
      if (!user) return;
      await updateDoc(doc(db, "users", user.uid), {
        activeClientId: clientId,
        updatedAt: serverTimestamp()
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("activeClientId", clientId);
      }
      await refreshProfile();
    },
    [user, refreshProfile]
  );

  const createClient = useCallback(
    async (name: string) => {
      if (!user || userProfile?.role !== "admin") {
        throw new Error("Only org admins can create clients");
      }
      const clientRef = doc(collection(db, "clients"));
      await setDoc(clientRef, {
        name,
        status: "active",
        logoURL: null,
        color: null,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      const memberRole: ClientMemberRole = "admin";
      await setDoc(doc(db, "clients", clientRef.id, "members", user.uid), {
        role: memberRole,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await updateDoc(doc(db, "users", user.uid), {
        activeClientId: clientRef.id,
        updatedAt: serverTimestamp()
      });
      await refreshProfile();
      await refreshClients();
      return clientRef.id;
    },
    [user, userProfile?.role, refreshProfile, refreshClients]
  );

  const value = useMemo(
    () => ({
      clients,
      activeClient,
      loading,
      setActiveClientId,
      createClient,
      refreshClients
    }),
    [clients, activeClient, loading, setActiveClientId, createClient, refreshClients]
  );

  return (
    <ActiveClientContext.Provider value={value}>{children}</ActiveClientContext.Provider>
  );
}

export function useActiveClient() {
  const context = useContext(ActiveClientContext);
  if (!context) {
    throw new Error("useActiveClient must be used within ActiveClientProvider");
  }
  return context;
}
