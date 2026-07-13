"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar";
import {
  CalendarIcon,
  ClipboardCheckIcon,
  FolderDotIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useAuth } from "@/hooks/use-auth";

type NavGroup = {
  title: string;
  items: NavItem[];
};

type NavItem = {
  title: string;
  href: string;
  icon?: LucideIcon;
  preferenceKey?: "showProjects" | "showServiceRequests" | "showCalendar";
};

export const navItems: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboardIcon },
      {
        title: "Projects",
        href: "/projects",
        icon: FolderDotIcon,
        preferenceKey: "showProjects"
      },
      {
        title: "Service Requests",
        href: "/service-requests",
        icon: ClipboardCheckIcon,
        preferenceKey: "showServiceRequests"
      },
      {
        title: "Calendar",
        href: "/calendar",
        icon: CalendarIcon,
        preferenceKey: "showCalendar"
      }
    ]
  },
  {
    title: "Account",
    items: [
      { title: "Profile", href: "/profile", icon: UserIcon },
      { title: "Settings", href: "/settings", icon: SettingsIcon }
    ]
  }
];

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavMain() {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { userProfile } = useAuth();
  const display = userProfile?.preferences?.display;

  const groups = useMemo(
    () =>
      navItems
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => {
            if (!item.preferenceKey) return true;
            return display?.[item.preferenceKey] ?? true;
          })
        }))
        .filter((group) => group.items.length > 0),
    [display]
  );

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.title}>
          <SidebarGroupLabel>{group.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={isActive(pathname, item.href)}
                    asChild>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
