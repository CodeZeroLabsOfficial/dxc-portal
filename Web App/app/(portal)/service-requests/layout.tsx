import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Service requests",
    description: "Track service requests by stage for the active client.",
    canonical: "/service-requests"
  });
}

export default function ServiceRequestsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
