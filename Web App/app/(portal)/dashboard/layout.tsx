import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Dashboard",
    description: "Client overview and recent activity.",
    canonical: "/dashboard"
  });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
