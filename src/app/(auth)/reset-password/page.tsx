"use client";

import { useState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const code = searchParams.get("code");
        if (code) {
            router.replace(`/auth/callback?code=${code}&next=/reset-password`);
        }
    }, [searchParams, router]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        const result = await resetPassword(password);

        if (result?.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            {/* Background decorations */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full gradient-emerald opacity-10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full gradient-emerald opacity-5 blur-3xl" />
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8">
                    <div className="p-3 rounded-2xl gradient-emerald">
                        <UtensilsCrossed className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">MenuPlus</h1>
                </div>

                {/* Card */}
                <div className="glass-card rounded-3xl p-8">
                    {success ? (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">
                                {t("auth.passwordChanged")}
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                {t("auth.passwordChanged")}
                            </p>
                            <Link href="/login">
                                <Button className="w-full h-12 rounded-xl gradient-emerald text-white font-medium">
                                    {t("auth.backToLogin")}
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h2 className="text-2xl font-semibold text-foreground">{t("auth.resetPassword")}</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium">{t("auth.newPassword")}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-sm font-medium">{t("auth.confirmPassword")}</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-12 rounded-xl bg-secondary/50 border-border/50 focus:border-primary"
                                            required
                                        />
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-12 rounded-xl gradient-emerald text-white font-medium text-base hover:opacity-90 transition-opacity"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {t("auth.resetPassword")}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
