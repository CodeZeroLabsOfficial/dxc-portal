"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import type { Client, ClientMemberRole, OrgRole, UserProfile } from "@/types";
import { PageContent } from "@/components/shared/page-content";
import { PageHeader } from "@/components/shared/page-header";
import { SectionHeader } from "@/components/shared/section-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";

type MembershipDetail = {
  clientId: string;
  clientName: string;
  userId: string;
  role: ClientMemberRole;
};

export default function TeamMembersPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const { clients } = useActiveClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [membershipDetails, setMembershipDetails] = useState<MembershipDetail[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedClientRole, setSelectedClientRole] = useState<ClientMemberRole>("staff");
  const [saving, setSaving] = useState(false);

  const isOrgAdmin = userProfile?.role === "admin";

  useEffect(() => {
    if (!authLoading && userProfile && !isOrgAdmin) {
      router.replace("/settings");
    }
  }, [authLoading, userProfile, isOrgAdmin, router]);

  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        setUsers(
          snap.docs.map((item) => {
            const data = item.data();
            return {
              uid: item.id,
              displayName: data.displayName ?? "User",
              email: data.email ?? "",
              photoURL: data.photoURL ?? null,
              role: (data.role as OrgRole) ?? "staff",
              activeClientId: data.activeClientId ?? null
            };
          })
        );
      } catch (error) {
        console.error(error);
        toast.error("Unable to load team members");
      } finally {
        setLoading(false);
      }
    }
    if (isOrgAdmin) {
      void loadUsers();
    }
  }, [isOrgAdmin]);

  async function openMemberships(user: UserProfile) {
    setSelectedUser(user);
    setSelectedClientId(clients[0]?.id ?? "");
    setSelectedClientRole("staff");
    const rows: MembershipDetail[] = [];
    for (const client of clients) {
      const memberSnap = await getDoc(doc(db, "clients", client.id, "members", user.uid));
      if (memberSnap.exists()) {
        rows.push({
          clientId: client.id,
          clientName: client.name,
          userId: user.uid,
          role: (memberSnap.data().role as ClientMemberRole) ?? "staff"
        });
      }
    }
    setMembershipDetails(rows);
  }

  async function updateOrgRole(uid: string, role: OrgRole) {
    try {
      await updateDoc(doc(db, "users", uid), {
        role,
        updatedAt: serverTimestamp()
      });
      setUsers((prev) => prev.map((user) => (user.uid === uid ? { ...user, role } : user)));
      toast.success("Org role updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update role");
    }
  }

  async function addMembership() {
    if (!selectedUser || !selectedClientId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "clients", selectedClientId, "members", selectedUser.uid), {
        role: selectedClientRole,
        createdBy: userProfile?.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      const client = clients.find((item) => item.id === selectedClientId);
      setMembershipDetails((prev) => {
        const without = prev.filter((item) => item.clientId !== selectedClientId);
        return [
          ...without,
          {
            clientId: selectedClientId,
            clientName: client?.name ?? selectedClientId,
            userId: selectedUser.uid,
            role: selectedClientRole
          }
        ];
      });
      toast.success("Membership saved");
    } catch (error) {
      console.error(error);
      toast.error("Unable to save membership");
    } finally {
      setSaving(false);
    }
  }

  async function removeMembership(clientId: string) {
    if (!selectedUser) return;
    try {
      await deleteDoc(doc(db, "clients", clientId, "members", selectedUser.uid));
      setMembershipDetails((prev) => prev.filter((item) => item.clientId !== clientId));
      toast.success("Membership removed");
    } catch (error) {
      console.error(error);
      toast.error("Unable to remove membership");
    }
  }

  const columns = useMemo<ColumnDef<UserProfile>[]>(
    () => [
      {
        accessorKey: "displayName",
        header: "Name"
      },
      {
        accessorKey: "email",
        header: "Email"
      },
      {
        accessorKey: "role",
        header: "Org role",
        cell: ({ row }) => (
          <Select
            value={row.original.role}
            onValueChange={(value) => void updateOrgRole(row.original.uid, value as OrgRole)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">admin</SelectItem>
              <SelectItem value="manager">manager</SelectItem>
              <SelectItem value="staff">staff</SelectItem>
            </SelectContent>
          </Select>
        )
      },
      {
        id: "badge",
        header: "Badge",
        cell: ({ row }) => <StatusBadge kind="org-role" value={row.original.role} />
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => void openMemberships(row.original)}>
            Memberships
          </Button>
        )
      }
    ],
    [clients]
  );

  if (authLoading || !isOrgAdmin) {
    return (
      <PageContent>
        <PageHeader title="Team members" description="Org admins only." />
        <Card>
          <CardContent className="text-muted-foreground py-8 text-sm">
            {authLoading ? "Loading..." : "You do not have access to this page."}
          </CardContent>
        </Card>
      </PageContent>
    );
  }

  return (
    <PageContent>
      <PageHeader
        title="Team members"
        description="Manage org roles and per-client membership."
      />
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading team members...</p>
          ) : (
            <DataTable columns={columns} data={users} />
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{selectedUser?.displayName ?? "Memberships"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 px-4">
            <div>
              <SectionHeader title="Current memberships" />
              <div className="mt-3 space-y-2">
                {membershipDetails.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No client memberships yet.</p>
                ) : (
                  membershipDetails.map((item) => (
                    <div
                      key={item.clientId}
                      className="flex items-center justify-between rounded-md border p-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{item.clientName}</p>
                        <StatusBadge kind="client-role" value={item.role} />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void removeMembership(item.clientId)}>
                        Remove
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <SectionHeader title="Add or update membership" />
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client: Client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client role</Label>
                <Select
                  value={selectedClientRole}
                  onValueChange={(value) => setSelectedClientRole(value as ClientMemberRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">admin</SelectItem>
                    <SelectItem value="manager">manager</SelectItem>
                    <SelectItem value="staff">staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button
              onClick={() => void addMembership()}
              disabled={saving || !selectedClientId || !selectedUser}>
              <Plus />
              {saving ? "Saving..." : "Save membership"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </PageContent>
  );
}
