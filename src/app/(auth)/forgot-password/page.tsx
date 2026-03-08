"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UtensilsCrossed, Mail, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

export default function ForgotPasswordPage() {
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;

        const result = await forgotPassword(email);

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
                                {t("auth.sendResetLink")}
                            </h2>
                            <p className="text-muted-foreground mb-8">
                                {t("auth.emailSent")}
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
                                <h2 className="text-2xl font-semibold text-foreground">{t("auth.forgotPassword")}</h2>
                                <p className="text-muted-foreground mt-2 text-sm">
                                    {t("auth.enterEmail")}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {error && (
                                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">{t("settings.email")}</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="you@example.com"
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
                                            {t("auth.sendResetLink")}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </>
                                    )}
                                </Button>

                                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                    {t("auth.backToLogin")}
                                </Link>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
