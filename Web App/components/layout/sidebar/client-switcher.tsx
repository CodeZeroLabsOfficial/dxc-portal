"use client";

import { ChevronsUpDown, Building2Icon } from "lucide-react";
import { PlusIcon } from "@radix-ui/react-icons";

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
import { Button } from "@/components/ui/button";
import Logo from "@/components/layout/logo";

type ClientOption = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

const PLACEHOLDER_CLIENTS: ClientOption[] = [];

export function ClientSwitcher() {
  const { isMobile } = useSidebar();
  const activeClient = PLACEHOLDER_CLIENTS[0];

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="hover:text-foreground h-10 group-data-[collapsible=icon]:px-0!">
              <Logo />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="text-foreground truncate font-semibold">DXC Portal</span>
                <span className="text-muted-foreground truncate text-xs">
                  {activeClient?.name ?? "Select a client"}
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
            {PLACEHOLDER_CLIENTS.length === 0 ? (
              <div className="text-muted-foreground px-2 py-3 text-sm">
                No clients yet. Create one to get started.
              </div>
            ) : (
              PLACEHOLDER_CLIENTS.map((client) => (
                <DropdownMenuItem key={client.id} className="flex items-center gap-3">
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
            <DropdownMenuSeparator />
            <Button size="sm" className="w-full">
              <PlusIcon />
              New Client
            </Button>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
