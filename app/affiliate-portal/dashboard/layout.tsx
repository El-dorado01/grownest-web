// app/affiliate-portal/dashboard/layout.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    if (!getAuthToken()) router.replace('/login');
  }, [router]);
  return <>{children}</>;
}
