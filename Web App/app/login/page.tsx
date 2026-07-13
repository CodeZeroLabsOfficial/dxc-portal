"use client";

import { Suspense } from "react";
import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthProvider, useAuth } from "@/components/providers/auth-provider";

function LoginForm() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const next = searchParams.get("next") || "/dashboard";

  if (!loading && user) {
    router.replace(next);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signIn(email, password);
      toast.success("Signed in");
      router.replace(next);
    } catch (error) {
      console.error(error);
      toast.error("Unable to sign in. Check your email and password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">DXC Portal</h1>
          <p className="text-muted-foreground mt-2 text-sm">Sign in to continue</p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || loading}>
            {submitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <Suspense
        fallback={
          <div className="text-muted-foreground flex min-h-svh items-center justify-center text-sm">
            Loading...
          </div>
        }>
        <LoginForm />
      </Suspense>
    </AuthProvider>
  );
}
