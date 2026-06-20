// app/affiliate-portal/dashboard/layout.tsx
// Redirects unauthenticated users to login with ?redirect=/dashboard
// so LoginForm sends them back here after a successful sign-in.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getAuthToken()) router.replace('/login?redirect=/dashboard');
  }, [router]);
  return <>{children}</>;
}
