"use client";

import { BellIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const Notifications = () => {
  const isMobile = useIsMobile();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon-sm" variant="ghost" className="relative">
          <BellIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align={isMobile ? "center" : "end"} className="ms-4 w-80 p-0">
        <DropdownMenuLabel className="bg-background dark:bg-muted sticky top-0 z-10 p-0">
          <div className="border-b px-6 py-4">
            <div className="font-medium">Notifications</div>
          </div>
        </DropdownMenuLabel>
        <div className="text-muted-foreground px-6 py-10 text-center text-sm">
          You are all caught up.
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
