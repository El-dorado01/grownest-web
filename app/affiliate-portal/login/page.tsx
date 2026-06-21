// app/affiliate-portal/login/page.tsx
// Affiliate portal login — reuses the main LoginForm (Google OAuth, 2FA, forgot password).
// All entry points to this page include ?redirect=/dashboard so LoginForm always
// sends users to the dashboard after a successful login, not the landing page.
import { LoginForm } from "@/components/login-form";
import Image from "next/image";
import Link from "next/link";

export const metadata = { title: "Sign In | GrowNest Affiliate" };

export default function AffiliateLoginPage() {
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

      {/* Full LoginForm — Google OAuth, 2FA, forgot password all wired in.
          ?redirect=/dashboard is set by all entry links so LoginForm routes
          users to the dashboard (not the landing page) after login. */}
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
