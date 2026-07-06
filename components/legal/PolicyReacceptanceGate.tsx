"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { legalApi, type PolicyStatusResponse } from "@/lib/legal-api";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";

const POLICY_LABELS: Record<string, { label: string; href: string }> = {
  TERMS: { label: "Terms & Conditions", href: "https://dashboard.grownest.africa/terms" },
  PRIVACY: { label: "Privacy Policy", href: "https://dashboard.grownest.africa/privacy" },
  COOKIES: { label: "Cookie Policy", href: "https://dashboard.grownest.africa/cookies" },
  REFUND_POLICY: { label: "Refund & Cancellation Policy", href: "https://dashboard.grownest.africa/refund-policy" },
  AFFILIATE_TERMS: { label: "Affiliate Programme Terms", href: "https://dashboard.grownest.africa/affiliate-terms" },
  VENDOR_AGREEMENT: { label: "Vendor & Merchant Agreement", href: "https://dashboard.grownest.africa/vendor-agreement" },
};

/**
 * Blocks the app with a full-screen overlay whenever the signed-in user's
 * latest accepted policy version is behind the currently-published version
 * (see BE policyVersions.ts). Mounted once at the root layout.
 */
export function PolicyReacceptanceGate() {
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<PolicyStatusResponse | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus(null);
      return;
    }
    let cancelled = false;
    legalApi.getStatus().then((res) => {
      if (!cancelled && res.data) setStatus(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!status?.needsReacceptance || status.outstanding.length === 0) return null;

  const handleAccept = async () => {
    setAccepting(true);
    const res = await legalApi.acceptBatch(status.outstanding.map((o) => o.policyType));
    setAccepting(false);
    if (res.error) {
      toast.error(res.error || "Couldn't save your acceptance. Please try again.");
      return;
    }
    setStatus(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-foreground">We&apos;ve updated our policies</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Please review and accept the following before continuing to use GrowNest.
        </p>

        <div className="mt-4 space-y-2">
          {status.outstanding.map((o) => {
            const meta = POLICY_LABELS[o.policyType];
            if (!meta) return null;
            return (
              <Link
                key={o.policyType}
                href={meta.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted/50 transition-colors"
              >
                <FileText className="h-4 w-4 shrink-0 text-primary" />
                {meta.label}
                <span className="ml-auto text-xs text-muted-foreground">v{o.currentVersion}</span>
              </Link>
            );
          })}
        </div>

        <Button onClick={handleAccept} disabled={accepting} className="mt-5 w-full gap-2">
          {accepting && <Loader2 className="h-4 w-4 animate-spin" />}
          {accepting ? "Saving…" : "I Accept"}
        </Button>
      </div>
    </div>
  );
}
