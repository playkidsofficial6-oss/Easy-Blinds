"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { UserRole } from "@/lib/auth";

const roleOptions: Array<{ label: string; value: UserRole; redirect: string }> = [
  { label: "Owner", value: "owner", redirect: "/owner" },
  { label: "Sales Manager", value: "sales_manager", redirect: "/sales-manager" },
  { label: "Salesman", value: "salesman", redirect: "/salesman" },
  { label: "Field Team", value: "field", redirect: "/field" },
  { label: "Fitter", value: "fitter", redirect: "/fitter" },
  { label: "Stitching Workshop", value: "stitching", redirect: "/stitching" },
  { label: "General User", value: "user", redirect: "/owner" },
];

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

  return "Unable to register the account. Please check the form and try again.";
}

function getPasswordError(password: string, confirmPassword: string) {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }

  if (password !== confirmPassword) {
    return "Password and confirmation password do not match.";
  }

  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("sales_manager");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedRole = useMemo(
    () => roleOptions.find((option) => option.value === role) ?? roleOptions[0],
    [role],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const passwordError = getPasswordError(password, confirmPassword);

    if (cleanName.length < 2) {
      toast.error("Please enter the user's full name.");
      return;
    }

    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        name: cleanName,
        email: cleanEmail,
        password,
        role,
      });
      const target =
        roleOptions.find((option) => option.value === response.user.role)?.redirect ?? selectedRole.redirect;

      toast.success("Account created successfully.");
      router.replace(target);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
          <section className="bg-neutral-50 p-6 text-neutral-900 sm:p-10 lg:p-12">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-3xl font-light tracking-tight">Create portal access</CardTitle>
                <CardDescription>
                  Register a real Easy Blinds user through the backend API. The account will be saved in MongoDB and signed in immediately.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Meera Nair"
                        autoComplete="name"
                        className="pl-10"
                        minLength={2}
                        maxLength={100}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="meera@example.com"
                        autoComplete="email"
                        className="pl-10"
                        maxLength={254}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Portal role</Label>
                    <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                      <SelectTrigger id="role" className="h-11 w-full bg-white">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        placeholder="At least 8 characters with a number"
                        autoComplete="new-password"
                        className="pl-10 pr-10"
                        minLength={8}
                        maxLength={72}
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
                    <p className="text-xs text-neutral-500">
                      Passwords must contain at least one letter and one number.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <div className="relative">
                      <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        className="pl-10 pr-10"
                        minLength={8}
                        maxLength={72}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="h-12 w-full bg-neutral-900 text-white hover:bg-neutral-800" disabled={isSubmitting}>
                    {isSubmitting ? "Creating account..." : `Create ${selectedRole.label} account`}
                  </Button>
                </form>

                <p className="mt-6 text-center text-sm text-neutral-500">
                  Already have an account?{" "}
                  <Link href="/login" className="font-medium text-neutral-900 underline-offset-4 hover:underline">
                    Sign in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="hidden bg-neutral-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-10 flex h-14 w-14 items-center justify-center bg-amber-600 text-2xl font-light">
                EB
              </div>
              <p className="text-sm font-medium uppercase tracking-[0.35em] text-amber-400">
                Protected Operations
              </p>
              <h1 className="mt-6 text-5xl font-light leading-tight">
                Register every Easy Blinds role from one secure page.
              </h1>
              <p className="mt-6 max-w-md text-base leading-7 text-neutral-300">
                The form posts to the NestJS authentication API, stores the user in MongoDB, receives a JWT, and redirects the user to the correct portal for the selected role.
              </p>
            </div>
            <p className="text-sm text-neutral-500">
              Database credentials stay on the backend. The frontend only uses the configured public API URL.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
