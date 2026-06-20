// app/affiliate-portal/login/page.tsx
// Reuses the existing LoginForm component (Google OAuth, 2FA, forgot password all included).
// LoginForm reads ?redirect= from the URL — the dashboard layout sets ?redirect=/dashboard
// so after login the user lands on their affiliate dashboard automatically.
import { LoginForm } from '@/components/login-form';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Sign In | GrowNest Affiliate' };

export default function AffiliateLoginPage() {
  return (
    <div className="min-h-[calc(100vh-57px)] flex flex-col items-center justify-center px-4 py-10 bg-background">
      {/* Brand context */}
      <div className="text-center mb-8">
        <Link href="/">
          <Image src="/logo.png" alt="GrowNest" width={110} height={36} className="w-auto mx-auto mb-4" />
        </Link>
        <p className="text-sm text-muted-foreground">
          Sign in to access your affiliate dashboard
        </p>
      </div>

      {/* Reuse the full LoginForm — Google OAuth, 2FA, forgot password all included */}
      <LoginForm />

      <p className="text-center text-xs text-muted-foreground mt-6">
        {"Don't have a GrowNest account? "}
        <a href="https://grownest.africa/signup" className="text-primary hover:underline">
          Sign up on the app first
        </a>
      </p>
    </div>
  );
}
