
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { authApi } from "@/lib/auth-api";
import { setAuthToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AffiliateVerify2FAPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[calc(100vh-57px)] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <Verify2FAContent />
    </Suspense>
  );
}

function Verify2FAContent() {
  const { requires2FA, pendingUserId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Honour ?redirect= if present, otherwise default to /dashboard
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [isResending, setIsResending] = useState(false);

  // If no pending 2FA state, send back to login
  useEffect(() => {
    if (!requires2FA && !pendingUserId) {
      router.replace("/login");
    }
  }, [requires2FA, pendingUserId, router]);

  // Countdown for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !isSubmitting) {
      handleVerify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const handleVerify = async () => {
    if (!code || code.length < 6 || !pendingUserId) return;

    setIsSubmitting(true);
    try {
      // Call API directly so we control the post-verify redirect.
      // The auth context's verify2FA() hardcodes window.location.href = "/"
      // which would send the affiliate back to the landing page.
      const { data, error } = await authApi.verify2FA({
        userId: pendingUserId,
        code,
      });

      if (error || !data) {
        toast.error(error || "Invalid verification code. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Mirror what auth context does after verify — set token + user in storage
      localStorage.removeItem("temp_token");
      if (data.token) setAuthToken(data.token);
      localStorage.setItem(
        "user",
        JSON.stringify({ userId: data.userId, role: data.role })
      );

      toast.success("Verified! Taking you to your dashboard...");

      // Full page navigation so AuthProvider re-initialises with the new token.
      // Uses redirectTo so ?redirect= params are honoured (e.g. /apply, /dashboard).
      window.location.href = redirectTo;
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingUserId || countdown > 0) return;
    setIsResending(true);
    try {
      const result = await authApi.resend2FALogin({ userId: pendingUserId });
      if (result.data) {
        setCountdown(60);
        toast.success(result.data.message || "Verification code resent!");
      } else {
        toast.error(result.error || "Failed to resend code.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsResending(false);
    }
  };

  if (!requires2FA && !pendingUserId) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-4 py-10 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Image
            src="/logo.png"
            alt="GrowNest"
            width={110}
            height={36}
            className="w-auto mx-auto mb-4"
          />
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl text-foreground">
              Two-Factor Verification
            </CardTitle>
            <CardDescription className="text-muted-foreground leading-relaxed">
              A verification code has been sent to your registered contact
              method. Enter it below to access your affiliate dashboard.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="otp-code"
                className="text-sm font-medium text-foreground"
              >
                Verification Code
              </label>
              <Input
                id="otp-code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="000000"
                className="text-center text-2xl tracking-[0.4em] h-14 font-mono"
                autoFocus
                disabled={isSubmitting}
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the 6-digit code from your email or phone
              </p>
            </div>

            <Button
              onClick={handleVerify}
              className="w-full h-11"
              disabled={isSubmitting || code.length < 6}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>

            <div className="text-center pt-2 border-t border-border space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full h-10"
                onClick={handleResend}
                disabled={countdown > 0 || isResending}
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resending...
                  </>
                ) : countdown > 0 ? (
                  `Resend Code (${countdown}s)`
                ) : (
                  "Resend Code"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </button>
      </div>
    </div>
  );
}
