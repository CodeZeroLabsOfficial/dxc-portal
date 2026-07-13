import { generateMeta } from "@/lib/utils";
import { ForgotPasswordForm } from "./forgot-password-form";

export async function generateMetadata() {
  return generateMeta({
    title: "Forgot password",
    description: "Reset your DXC Portal password.",
    canonical: "/forgot-password"
  });
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
