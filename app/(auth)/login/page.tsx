import { generateMeta } from "@/lib/utils";
import { LoginForm } from "./login-form";

export async function generateMetadata() {
  return generateMeta({
    title: "Sign in",
    description: "Sign in to DXC Portal.",
    canonical: "/login"
  });
}

export default function LoginPage() {
  return <LoginForm />;
}
