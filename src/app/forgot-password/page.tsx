"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);

        try {
            await api.post("/users/forgot-password", { email });
            setIsSubmitted(true);
            toast.success("Password reset request sent.");
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to send password reset email.";
            toast.error(typeof message === "string" ? message : message.join(" "));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white flex items-center justify-center">
            <div className="w-full max-w-md">
                <Card className="border-neutral-800 bg-neutral-900 text-white shadow-2xl rounded-3xl p-2 sm:p-4">
                    <CardHeader className="space-y-2">
                        <div className="w-12 h-12 bg-blue-600/20 text-blue-500 rounded-2xl flex items-center justify-center mb-2">
                            <Mail className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-2xl font-semibold tracking-tight">Forgot Password?</CardTitle>
                        <CardDescription className="text-neutral-400 text-sm">
                            Enter your registered email address and we&apos;ll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-2">
                        {isSubmitted ? (
                            <div className="space-y-6 text-center py-4">
                                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-white">Check your email</h3>
                                    <p className="text-sm text-neutral-400 leading-relaxed">
                                        If an account exists for <strong className="text-white">{email}</strong>, we have sent a password reset link to your inbox via ZeptoMail.
                                    </p>
                                </div>
                                <div className="pt-4 space-y-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsSubmitted(false)}
                                        className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                                    >
                                        Try another email
                                    </Button>
                                    <Link href="/login" className="inline-flex items-center text-xs text-neutral-400 hover:text-white transition-colors">
                                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-neutral-300">Email address</Label>
                                    <div className="relative">
                                        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="your-name@example.com"
                                            autoComplete="email"
                                            className="pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    className="h-11 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-md transition-all"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Sending Reset Link..." : "Send Reset Link"}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link href="/login" className="inline-flex items-center text-xs text-neutral-400 hover:text-white transition-colors">
                                        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to sign in
                                    </Link>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
