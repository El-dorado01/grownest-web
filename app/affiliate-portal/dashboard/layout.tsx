// app/affiliate-portal/dashboard/layout.tsx
// Auth + affiliate guard:
//   No token → /login?redirect=/dashboard
//   Token but no affiliate → /apply  (new user, needs to apply first)
//   Token + affiliate → render dashboard
'use client';
import { useEffect, useState } from 'react';
import { getAuthToken } from '@/lib/api';
import { affiliateApi } from '@/lib/affiliate-api';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAuthToken();

    // Gate 1: no token → login
    if (!token) {
      window.location.replace('/login?redirect=/dashboard');
      return;
    }

    // Gate 2: token exists but no affiliate → apply
    affiliateApi.getMe()
      .then((res) => {
        if (!res.data?.affiliate) {
          window.location.replace('/apply');
        } else {
          setChecking(false); // affiliate found — show dashboard
        }
      })
      .catch(() => {
        // Network error or 404 — treat as no affiliate
        window.location.replace('/apply');
      });
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AffiliateSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground font-medium">Affiliate Portal</span>
        </header>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
