import { Metadata } from "next";
import { generateMeta } from "@/lib/utils";

import { SidebarNav } from "./components/sidebar-nav";
import { PageHeader } from "@/components/shared/page-header";

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    title: "Settings",
    description: "Manage your account settings and preferences.",
    canonical: "/settings"
  });
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl space-y-4 lg:space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account settings and preferences."
      />
      <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        <aside className="lg:w-64">
          <SidebarNav />
        </aside>
        <div className="flex-1 lg:max-w-2xl">{children}</div>
      </div>
    </div>
  );
}
