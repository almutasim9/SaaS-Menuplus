"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { QrCode, ExternalLink, Download, Copy, Check } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { toast } from "sonner";

export function StoreQrButton({ slug }: { slug: string }) {
    const { t } = useTranslation();
    const [storeUrl, setStoreUrl] = useState("");
    const [copied, setCopied] = useState(false);
    const qrRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setStoreUrl(`${window.location.origin}/menu/${slug}`);
    }, [slug]);

    // QR URL includes ?ref=qr for visit source tracking
    const qrUrl = storeUrl ? `${storeUrl}?ref=qr` : "";

    const handleDownloadQR = useCallback(() => {
        const canvas = qrRef.current?.querySelector("canvas");
        if (!canvas) return;

        // Create a larger canvas with padding and branding
        const padding = 40;
        const size = canvas.width + padding * 2;
        const exportCanvas = document.createElement("canvas");
        exportCanvas.width = size;
        exportCanvas.height = size + 30;
        const ctx = exportCanvas.getContext("2d");
        if (!ctx) return;

        // White background
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

        // Draw QR
        ctx.drawImage(canvas, padding, padding);

        // Brand text
        ctx.fillStyle = "#888888";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`menuplus.com/menu/${slug}`, exportCanvas.width / 2, size + 18);

        // Download
        const link = document.createElement("a");
        link.download = `${slug}-qr-code.png`;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();

        toast.success(t("qr.qrDownloaded"));
    }, [slug, t]);

    const handleCopyLink = useCallback(async () => {
        try {
            // Try modern clipboard API first (requires HTTPS)
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(storeUrl);
            } else {
                // Fallback for HTTP (e.g. LAN access)
                const textarea = document.createElement("textarea");
                textarea.value = storeUrl;
                textarea.style.position = "fixed";
                textarea.style.opacity = "0";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
            }
            setCopied(true);
            toast.success(t("qr.linkCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t("qr.copyFailed"));
        }
    }, [storeUrl, t]);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="gradient-emerald text-white rounded-xl gap-2 hover:opacity-90">
                    <QrCode className="w-4 h-4" />
                    {t("qr.shareMenu")}
                </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border/50 rounded-2xl max-w-sm flex flex-col items-center text-center sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-center">{t("qr.storeQr")}</DialogTitle>
                    <DialogDescription className="text-center">
                        {t("qr.scanToVisit")}
                    </DialogDescription>
                </DialogHeader>

                {/* QR Code */}
                <div ref={qrRef} className="bg-white p-4 rounded-2xl my-4 flex items-center justify-center">
                    {qrUrl && <QRCodeCanvas value={qrUrl} size={200} includeMargin />}
                </div>

                {/* URL Preview */}
                <p className="text-xs text-muted-foreground font-mono mb-2 select-all" dir="ltr">
                    {storeUrl}
                </p>

                {/* Action Buttons */}
                <div className="w-full grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        className="rounded-xl gap-2 h-10"
                        onClick={handleDownloadQR}
                    >
                        <Download className="w-4 h-4" />
                        {t("qr.downloadQr")}
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-xl gap-2 h-10"
                        onClick={handleCopyLink}
                    >
                        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                        {copied ? t("common.copied") : t("qr.copyLink")}
                    </Button>
                </div>

                <Button
                    asChild
                    className="w-full gradient-emerald text-white rounded-xl gap-2 mt-2 hover:opacity-90"
                >
                    <a href={`/menu/${slug}`} target="_blank" rel="noopener noreferrer">
                        {t("qr.openStore")} <ExternalLink className="w-4 h-4" />
                    </a>
                </Button>
            </DialogContent>
        </Dialog>
    );
}
