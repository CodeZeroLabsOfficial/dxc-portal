import { generateMeta } from "@/lib/utils";
import { ProfilePage } from "./components/profile-page";

export async function generateMetadata() {
  return generateMeta({
    title: "Profile",
    description: "View and update your DXC Portal profile.",
    canonical: "/profile"
  });
}

export default function Page() {
  return <ProfilePage />;
}
