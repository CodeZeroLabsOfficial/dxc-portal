"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FilterTab } from "../types";
import { EnumRequestStage, stageNamed } from "../enum";

type StatusTabsProps = {
  onTabChange: (tab: FilterTab) => void;
  activeTab: FilterTab;
};

export default function StatusTabs({ onTabChange, activeTab }: StatusTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as FilterTab)}>
      <TabsList className="flex h-auto flex-wrap">
        <TabsTrigger value="all">All</TabsTrigger>
        {Object.values(EnumRequestStage).map((stage) => (
          <TabsTrigger key={stage} value={stage}>
            {stageNamed[stage]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
