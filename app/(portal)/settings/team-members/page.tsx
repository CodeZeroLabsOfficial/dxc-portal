"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { ChevronDownIcon, MoreHorizontalIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { MultiSelectField } from "@/components/multi-select-field";
import { useAuth } from "@/hooks/use-auth";
import { useActiveClient } from "@/hooks/use-active-client";
import { db } from "@/lib/firebase";
import {
  type ClientGrant,
  createInvitedMember,
  grantLabel,
  inviteErrorMessage,
  loadClientGrants,
  syncClientMemberships
} from "@/lib/team-members";
import { mapUserProfile } from "@/lib/user-profile";
import { generateAvatarFallback } from "@/lib/utils";
import {
  ORG_ROLES,
  orgRoleDescription,
  orgRoleTitle,
  type OrgRole,
  type UserProfile
} from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from "@/components/ui/sheet";

const DEFAULT_INVITE_ROLE: OrgRole = "manager";

export default function TeamMembersPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const { clients } = useActiveClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [grantsByUser, setGrantsByUser] = useState<Map<string, ClientGrant[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleOpenFor, setRoleOpenFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UserProfile | null>(null);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [inviteRole, setInviteRole] = useState<OrgRole>(DEFAULT_INVITE_ROLE);
  const [inviteAllClients, setInviteAllClients] = useState(true);
  const [inviteClientIds, setInviteClientIds] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<OrgRole>("admin");
  const [editAllClients, setEditAllClients] = useState(true);
  const [editClientIds, setEditClientIds] = useState<string[]>([]);

  const isOrgAdmin = userProfile?.role === "admin";
  const clientOptions = useMemo(
    () => clients.map((client) => ({ value: client.id, label: client.name })),
    [clients]
  );

  useEffect(() => {
    if (!authLoading && userProfile && !isOrgAdmin) {
      router.replace("/settings");
    }
  }, [authLoading, userProfile, isOrgAdmin, router]);

  async function refreshMembers() {
    const snap = await getDocs(collection(db, "users"));
    setUsers(snap.docs.map((item) => mapUserProfile(item.id, item.data())));
    setGrantsByUser(await loadClientGrants(clients));
  }

  useEffect(() => {
    if (!isOrgAdmin) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "users"));
        if (cancelled) return;
        setUsers(snap.docs.map((item) => mapUserProfile(item.id, item.data())));
        setGrantsByUser(await loadClientGrants(clients));
      } catch (error) {
        console.error(error);
        toast.error("Unable to load team members");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [isOrgAdmin, clients]);

  function resetInvite() {
    setInviteRole(DEFAULT_INVITE_ROLE);
    setInviteAllClients(true);
    setInviteClientIds([]);
  }

  function openEdit(user: UserProfile) {
    setRoleOpenFor(null);
    setEditing(user);
    setEditRole(user.role);
    const grants = grantsByUser.get(user.uid) ?? [];
    const allAssigned = clients.length > 0 && grants.length >= clients.length;
    setEditAllClients(user.role === "admin" || allAssigned);
    setEditClientIds(grants.map((grant) => grant.clientId));
  }

  function requestDelete(user: UserProfile) {
    setRoleOpenFor(null);
    setPendingDelete(user);
  }

  async function confirmDelete(event: React.MouseEvent) {
    event.preventDefault();
    if (!pendingDelete) return;
    const user = pendingDelete;
    setBusy(true);
    try {
      await Promise.all(
        clients.map((client) => deleteDoc(doc(db, "clients", client.id, "members", user.uid)))
      );
      await deleteDoc(doc(db, "users", user.uid));
      setUsers((prev) => prev.filter((item) => item.uid !== user.uid));
      setGrantsByUser((prev) => {
        const next = new Map(prev);
        next.delete(user.uid);
        return next;
      });
      setPendingDelete(null);
      toast.success("Member deleted.");
    } catch (error) {
      console.error(error);
      toast.error("Could not delete member.");
    } finally {
      setBusy(false);
    }
  }

  async function persistAccess(
    user: UserProfile,
    role: OrgRole,
    allClients: boolean,
    clientIds: string[]
  ) {
    if (!userProfile) return;
    if (!allClients && clientIds.length === 0) {
      toast.error("Allocate at least one client, or choose All clients.");
      throw new Error("missing-clients");
    }
    await updateDoc(doc(db, "users", user.uid), {
      role,
      updatedAt: serverTimestamp()
    });
    await syncClientMemberships({
      userId: user.uid,
      createdBy: userProfile.uid,
      clients,
      selectedClientIds: clientIds,
      allClients,
      role
    });
    setUsers((prev) => prev.map((item) => (item.uid === user.uid ? { ...item, role } : item)));
    setGrantsByUser(await loadClientGrants(clients));
  }

  async function onChangeRole(user: UserProfile, role: OrgRole) {
    if (user.uid === userProfile?.uid) return;
    setBusy(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role,
        updatedAt: serverTimestamp()
      });
      setUsers((prev) => prev.map((item) => (item.uid === user.uid ? { ...item, role } : item)));
      setRoleOpenFor(null);
      toast.success("Role updated.");
    } catch (error) {
      console.error(error);
      toast.error("Could not update role.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await persistAccess(
        editing,
        editing.uid === userProfile?.uid ? editing.role : editRole,
        editAllClients,
        editClientIds
      );
      setEditing(null);
      toast.success("Access updated.");
    } catch (error) {
      if (error instanceof Error && error.message === "missing-clients") return;
      console.error(error);
      toast.error("Could not update member.");
    } finally {
      setSaving(false);
    }
  }

  async function onAddMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userProfile) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");
    if (!inviteAllClients && inviteClientIds.length === 0) {
      toast.error("Allocate at least one client, or choose All clients.");
      return;
    }

    setSaving(true);
    try {
      const uid = await createInvitedMember({ email, password, role: inviteRole });
      await syncClientMemberships({
        userId: uid,
        createdBy: userProfile.uid,
        clients,
        selectedClientIds: inviteClientIds,
        allClients: inviteAllClients,
        role: inviteRole
      });
      formEl.reset();
      resetInvite();
      setAddOpen(false);
      await refreshMembers();
      toast.success("Member created.");
    } catch (error) {
      console.error(error);
      toast.error(inviteErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !isOrgAdmin) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-8 text-sm">
          {authLoading ? "Loading…" : "You do not have access to this page."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Manage your team members and their permissions.</CardDescription>
          <CardAction>
            <Button
              size="sm"
              onClick={() => {
                resetInvite();
                setAddOpen(true);
              }}>
              <PlusIcon /> Invite Member
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground py-10 text-center">Loading…</p>
          ) : (
            <div className="divide-y">
              {users.map((user) => {
                const isSelf = user.uid === userProfile?.uid;
                const grants = grantsByUser.get(user.uid) ?? [];
                return (
                  <div key={user.uid} className="flex min-w-0 items-center justify-between gap-4 py-4">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={user.photoURL ?? undefined} />
                        <AvatarFallback>
                          {generateAvatarFallback(user.displayName || user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">
                          {user.displayName || orgRoleTitle[user.role]}
                          {isSelf ? <span className="text-muted-foreground"> (you)</span> : null}
                        </p>
                        <p className="text-muted-foreground truncate text-sm">{user.email}</p>
                        <p className="text-muted-foreground truncate text-xs">
                          {grantLabel(user, grants, clients.length)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Popover
                        open={roleOpenFor === user.uid}
                        onOpenChange={(isOpen) => setRoleOpenFor(isOpen ? user.uid : null)}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSelf || busy}
                            className="w-32 justify-between font-normal">
                            {orgRoleTitle[user.role]}
                            <ChevronDownIcon className="text-muted-foreground size-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                {ORG_ROLES.map((option) => (
                                  <CommandItem
                                    key={option}
                                    value={option}
                                    data-checked={option === user.role}
                                    onSelect={() => void onChangeRole(user, option)}
                                    className="items-start px-4 py-2">
                                    <div>
                                      <p>{orgRoleTitle[option]}</p>
                                      <p className="text-muted-foreground text-sm">
                                        {orgRoleDescription[option]}
                                      </p>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontalIcon className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(user)}>
                            Edit access
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            disabled={isSelf || busy}
                            onClick={() => requestDelete(user)}>
                            {isSelf ? "Cannot delete yourself" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPendingDelete(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {pendingDelete?.displayName || pendingDelete?.email || "this member"}
              &apos;s profile and client access. They will no longer appear on the team.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy}
              onClick={(event) => void confirmDelete(event)}>
              {busy ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet
        open={addOpen}
        onOpenChange={(open) => {
          setAddOpen(open);
          if (!open) resetInvite();
        }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Invite Member</SheetTitle>
            <SheetDescription>
              Set a role and allocate clients when creating the account.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onAddMember} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="member-email">Email</Label>
                <Input id="member-email" name="email" type="email" autoComplete="email" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-password">Password</Label>
                <Input
                  id="member-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              <OrgRoleField id="invite-role" value={inviteRole} onChange={setInviteRole} />
              <ClientGrantFields
                allClients={inviteAllClients}
                onAllClientsChange={setInviteAllClients}
                clientIds={inviteClientIds}
                onClientIdsChange={setInviteClientIds}
                options={clientOptions}
              />
            </div>
            <SheetFooter className="mt-auto flex-row items-center justify-between gap-2 px-4 sm:justify-between">
              <span />
              <Button type="submit" disabled={saving}>
                {saving ? "Creating…" : "Create member"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <Sheet open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Edit access</SheetTitle>
            <SheetDescription>
              {editing?.displayName || editing?.email || "Team member"}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={onSaveEdit} className="flex min-h-0 flex-1 flex-col">
            <div className="space-y-4 px-4">
              <OrgRoleField
                id="edit-role"
                value={editRole}
                onChange={setEditRole}
                disabled={editing?.uid === userProfile?.uid}
              />
              <ClientGrantFields
                allClients={editAllClients}
                onAllClientsChange={setEditAllClients}
                clientIds={editClientIds}
                onClientIdsChange={setEditClientIds}
                options={clientOptions}
              />
            </div>
            <SheetFooter className="mt-auto flex-row items-center justify-between gap-2 px-4 sm:justify-between">
              <span />
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function OrgRoleField({
  id,
  value,
  onChange,
  disabled
}: {
  id: string;
  value: OrgRole;
  onChange: (role: OrgRole) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Role</Label>
      <Select value={value} onValueChange={(next) => onChange(next as OrgRole)} disabled={disabled}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORG_ROLES.map((role) => (
            <SelectItem key={role} value={role}>
              {orgRoleTitle[role]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-muted-foreground text-xs">{orgRoleDescription[value]}</p>
    </div>
  );
}

function ClientGrantFields({
  allClients,
  onAllClientsChange,
  clientIds,
  onClientIdsChange,
  options
}: {
  allClients: boolean;
  onAllClientsChange: (value: boolean) => void;
  clientIds: string[];
  onClientIdsChange: (ids: string[]) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-3">
      <Label>Clients</Label>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={allClients}
          onCheckedChange={(checked) => onAllClientsChange(checked === true)}
        />
        All clients
      </label>
      {allClients ? (
        <p className="text-muted-foreground text-xs">Includes every current client.</p>
      ) : (
        <MultiSelectField
          options={options}
          selected={clientIds}
          onSelectedChange={onClientIdsChange}
          placeholder="Select clients"
          emptyMessage="No clients."
        />
      )}
    </div>
  );
}
