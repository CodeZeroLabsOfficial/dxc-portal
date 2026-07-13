import { generateMeta } from "@/lib/utils";

export async function generateMetadata() {
  return generateMeta({
    title: "Calendar",
    description: "Annual leave and staff movements.",
    canonical: "/calendar"
  });
}

export { default } from "./components/event-calendar-app";
