// app/affiliate-portal/dashboard/layout.tsx
// Auth guard — redirects unauthenticated users to login.
// Uses window.location.replace (full page navigation) so the proxy
// correctly routes /login → /affiliate-portal/login on the affiliate subdomain.
'use client';
import { useEffect } from 'react';
import { getAuthToken } from '@/lib/api';
import { AffiliateSidebar } from '@/components/affiliate/AffiliateSidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!getAuthToken()) {
      window.location.replace('/login?redirect=/dashboard');
    }
  }, []);

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
