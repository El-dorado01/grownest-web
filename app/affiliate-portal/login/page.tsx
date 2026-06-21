// app/affiliate-portal/login/page.tsx
// Affiliate portal login — reuses the main LoginForm (Google OAuth, 2FA, forgot password).
//
// LoginForm reads ?redirect= from the URL after login.
// We ensure ?redirect=/dashboard is always present so:
//   - No-2FA users → /dashboard after login
//   - 2FA users    → /login/verify (auth context) → /dashboard after verify
//
// If a ?redirect= param already exists (e.g. from the dashboard layout guard),
// we keep it as-is.
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export default function AffiliateLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Ensure there is always a ?redirect= so LoginForm knows where to send the
  // user after a successful login. Default to /dashboard so new users land on
  // the dashboard (where they can see Apply or their stats).
  useEffect(() => {
    if (!searchParams.get("redirect")) {
      // Replace current history entry so the Back button still works cleanly
      router.replace("/login?redirect=/dashboard");
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-4 py-10 bg-background">
      {/* Brand header */}
      <div className="text-center mb-8">
        <Link href="/">
          <Image
            src="/logo.png"
            alt="GrowNest"
            width={110}
            height={36}
            className="w-auto mx-auto mb-4"
          />
        </Link>
        <p className="text-sm text-muted-foreground">
          Sign in to access your affiliate dashboard
        </p>
      </div>

      {/* Full LoginForm — Google OAuth, 2FA, forgot password all wired in */}
      <LoginForm />

      <p className="text-center text-xs text-muted-foreground mt-6">
        {"Don't have a GrowNest account? "}
        <a
          href="https://play.google.com/store/apps/details?id=grownest.com.grownest"
          className="text-primary hover:underline"
        >
          Sign up on the app first
        </a>
      </p>
    </div>
  );
}
