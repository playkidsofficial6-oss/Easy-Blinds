"use client";

import Link from "next/link";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LockKeyhole, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const isMatch = password && confirmPassword && password === confirmPassword;
    const isMinLength = password.length >= 8;

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token) {
            toast.error("Invalid or missing password reset token.");
            return;
        }

        if (!isMinLength) {
            toast.error("Password must be at least 8 characters long.");
            return;
        }

        if (!isMatch) {
            toast.error("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            await api.post(`/users/reset-password/${encodeURIComponent(token)}`, {
                password,
                confirmPassword,
            });

            setIsSuccess(true);
            toast.success("Password reset successfully!");

            setTimeout(() => {
                router.push("/login");
            }, 1500);
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to reset password. Token may be expired.";
            toast.error(typeof message === "string" ? message : message.join(" "));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!token) {
        return (
            <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-white">Invalid Reset Link</h3>
                    <p className="text-sm text-neutral-400">
                        This password reset link is invalid or missing a token parameter.
                    </p>
                </div>
                <div className="pt-2">
                    <Link href="/forgot-password">
                        <Button className="bg-amber-600 hover:bg-amber-500 text-white">
                            Request new reset link
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Password Reset Complete!</h3>
                    <p className="text-sm text-neutral-400">
                        Your password has been successfully updated. Redirecting to the login page...
                    </p>
                </div>
                <div className="pt-4">
                    <Link href="/login">
                        <Button className="w-full bg-neutral-800 hover:bg-neutral-700 text-white">
                            Go to Login Page Now &rarr;
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Field 1: New Password */}
            <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">New Password</Label>
                <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                        className="pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-amber-500"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword((val) => !val)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Field 2: Confirm Password */}
            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm Password</Label>
                <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your new password"
                        autoComplete="new-password"
                        className="pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-amber-500"
                        minLength={8}
                        required
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword((val) => !val)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && (
                    <p className={`text-xs ${isMatch ? "text-emerald-400" : "text-red-400"} flex items-center gap-1 mt-1`}>
                        {isMatch ? "✓ Passwords match" : "✗ Passwords do not match"}
                    </p>
                )}
            </div>

            <Button
                type="submit"
                className="h-11 w-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-md transition-all mt-2"
                disabled={isSubmitting || !isMatch || !isMinLength}
            >
                {isSubmitting ? "Resetting Password..." : "Reset Password"}
            </Button>

            <div className="text-center pt-2">
                <Link href="/login" className="inline-flex items-center text-xs text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in
                </Link>
            </div>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white flex items-center justify-center">
            <div className="w-full max-w-md">
                <Card className="border-neutral-800 bg-neutral-900 text-white shadow-2xl rounded-3xl p-2 sm:p-4">
                    <CardHeader className="space-y-2">
                        <div className="w-12 h-12 bg-amber-600/20 text-amber-500 rounded-2xl flex items-center justify-center mb-2">
                            <LockKeyhole className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">Set New Password</CardTitle>
                        <CardDescription className="text-neutral-400 text-sm">
                            Please enter your new password below to update your account credentials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        <Suspense fallback={
                            <div className="py-8 text-center text-neutral-400 text-sm">
                                Loading password reset form...
                            </div>
                        }>
                            <ResetPasswordForm />
                        </Suspense>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
