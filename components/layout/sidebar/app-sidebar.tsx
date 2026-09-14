"use client";

import * as React from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useIsTablet } from "@/hooks/use-mobile";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar
} from "@/components/ui/sidebar";
import { useThemeConfig } from "@/components/active-theme";
import { SidebarCollapsible, SidebarVariant } from "@/lib/themes";
import { NavMain } from "@/components/layout/sidebar/nav-main";
import { NavUser } from "@/components/layout/sidebar/nav-user";
import { ClientSwitcher } from "@/components/layout/sidebar/client-switcher";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { setOpen, setOpenMobile, isMobile } = useSidebar();
  const { theme } = useThemeConfig();
  const isTablet = useIsTablet();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const prevIsTablet = React.useRef(isTablet);
  useEffect(() => {
    if (prevIsTablet.current !== isTablet) {
      prevIsTablet.current = isTablet;
      setOpen(!isTablet);
    }
  }, [isTablet, setOpen]);

  return (
    <Sidebar
      collapsible={theme.sidebarCollapsible as SidebarCollapsible}
      variant={theme.sidebarVariant as SidebarVariant}
      {...props}>
      <SidebarHeader>
        <ClientSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]]:scroll-fade">
          <NavMain />
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
