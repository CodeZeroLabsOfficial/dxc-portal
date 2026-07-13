import { generateMeta } from "@/lib/utils";
import { RegisterForm } from "./register-form";

export async function generateMetadata() {
  return generateMeta({
    title: "Create account",
    description: "Create a DXC Portal account.",
    canonical: "/register"
  });
}

export default function RegisterPage() {
  return <RegisterForm />;
}
