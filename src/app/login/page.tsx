"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AxiosError } from "axios";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { getSafePortalRedirect } from "@/lib/role-routing";

function getErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(" ");
    }

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to sign in. Please check your details and try again.";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextUrl = searchParams.get("next");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await login({ email, password });
      toast.success("Signed in successfully.");
      router.replace(getSafePortalRedirect(response.user.role, nextUrl));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="owner@easyblinds.local"
            autoComplete="email"
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="pl-10 pr-10"
            minLength={8}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="h-12 w-full bg-neutral-900 text-white hover:bg-neutral-800" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign in to portal"}
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-4xl border border-white/10 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-10 flex h-14 w-14 items-center justify-center bg-amber-600 text-2xl font-light">
                EB
              </div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
                Easy Blinds
              </p>
              <h1 className="mt-6 text-5xl font-light leading-tight">
                Secure access for every operations portal.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-neutral-300">
                Sign in once to manage owner dashboards, field activity, sales management, fitting workflows, and workshop jobs through the connected backend API.
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              JWT sessions are stored locally and attached automatically to protected API requests.
            </p>
          </section>

          <section className="bg-neutral-50 p-6 text-neutral-900 sm:p-10 lg:p-12">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-3xl font-light tracking-tight">Welcome back</CardTitle>
                <CardDescription>
                  Use your Easy Blinds account credentials to continue.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Suspense fallback={null}>
                  <LoginForm />
                </Suspense>
                {/* <p className="mt-6 text-center text-sm text-neutral-500">
                  Need an account?{" "}
                  <Link href="/register" className="font-medium text-neutral-900 underline-offset-4 hover:underline">
                    Register a portal user
                  </Link>
                </p> */}
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}
