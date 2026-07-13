import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Projects",
    description: "Track projects for the active client.",
    canonical: "/projects"
  });
}

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
