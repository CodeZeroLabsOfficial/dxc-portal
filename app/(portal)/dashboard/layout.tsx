import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Project Dashboard",
    description: "Track projects, deadlines, and team efficiency.",
    canonical: "/dashboard"
  });
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
