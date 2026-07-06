'use client';
import { useEffect, useState, useCallback } from 'react';
import { getAuthToken, setAuthToken } from '@/lib/api';
import { affiliateApi } from '@/lib/affiliate-api';
import { affiliatePath } from '@/lib/affiliate-portal-path';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const runGate = useCallback(() => {
    setLoadError(false);
    setChecking(true);

    // Pick up token handed off from main dashboard via ?__t=
    const params = new URLSearchParams(window.location.search);
    const handoff = params.get('__t');
    if (handoff) {
      setAuthToken(handoff);
      // Remove __t from URL so it's not visible or bookmarked
      params.delete('__t');
      const clean = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
      window.history.replaceState({}, '', clean);
    }

    const token = getAuthToken();

    // Gate 1: no token → login
    if (!token) {
      window.location.replace(`/login?redirect=${encodeURIComponent(affiliatePath('/portal'))}`);
      return;
    }

    // Gate 2: token exists — check affiliate status
    affiliateApi.getMe().then((res) => {
      if (res.status === 404) {
        // Genuinely no affiliate record — send to apply.
        window.location.replace(affiliatePath('/apply'));
        return;
      }
      if (res.error || !res.data?.affiliate) {
        // Any other failure (500, network error, timeout, etc.) — this is
        // NOT the same as "never applied". Show a retry state instead of
        // silently redirecting to the wrong screen.
        setLoadError(true);
        setChecking(false);
        return;
      }
      setChecking(false); // affiliate found — show dashboard
    });
  }, []);

  useEffect(() => {
    runGate();
  }, [runGate]);

  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <p className="font-semibold text-foreground">Couldn&apos;t load your dashboard</p>
          <p className="text-sm text-muted-foreground">
            Something went wrong on our end. This does not mean your application status has changed — please try again.
          </p>
          <Button onClick={runGate} className="mt-1">Retry</Button>
        </div>
      </div>
    );
  }

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
