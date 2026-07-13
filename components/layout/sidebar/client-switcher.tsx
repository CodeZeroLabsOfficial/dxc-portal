"use client";

import { useState } from "react";
import { ChevronsUpDown, Building2Icon } from "lucide-react";
import { PlusIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Logo from "@/components/layout/logo";
import { useActiveClient } from "@/hooks/use-active-client";
import { useAuth } from "@/hooks/use-auth";

export function ClientSwitcher() {
  const { isMobile } = useSidebar();
  const { userProfile } = useAuth();
  const { clients, activeClient, setActiveClientId, createClient, loading } = useActiveClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [saving, setSaving] = useState(false);

  const isOrgAdmin = userProfile?.role === "admin";

  async function handleCreate() {
    if (!clientName.trim()) return;
    setSaving(true);
    try {
      await createClient(clientName.trim());
      toast.success("Client created");
      setClientName("");
      setCreateOpen(false);
    } catch (error) {
      console.error(error);
      toast.error("Unable to create client");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0!">
                <Logo />
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="text-foreground truncate font-semibold">DXC Portal</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {loading ? "Loading..." : (activeClient?.name ?? "Select a client")}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="mt-4 w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}>
              <DropdownMenuLabel>Clients</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {clients.length === 0 ? (
                <div className="text-muted-foreground px-2 py-3 text-sm">
                  No clients yet. {isOrgAdmin ? "Create one to get started." : "Ask an admin for access."}
                </div>
              ) : (
                clients.map((client) => (
                  <DropdownMenuItem
                    key={client.id}
                    className="flex items-center gap-3"
                    onClick={() => {
                      void setActiveClientId(client.id);
                    }}>
                    <div className="flex size-8 items-center justify-center rounded-md border">
                      <Building2Icon className="text-muted-foreground size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{client.name}</span>
                      <span
                        className={
                          client.status === "active"
                            ? "text-xs text-green-700"
                            : "text-muted-foreground text-xs"
                        }>
                        {client.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              {isOrgAdmin ? (
                <>
                  <DropdownMenuSeparator />
                  <Button size="sm" className="w-full" onClick={() => setCreateOpen(true)}>
                    <PlusIcon />
                    New Client
                  </Button>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New client</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="client-name">Client name</Label>
            <Input
              id="client-name"
              value={clientName}
              onChange={(event) => setClientName(event.target.value)}
              placeholder="Acme Corp"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleCreate()} disabled={saving || !clientName.trim()}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
