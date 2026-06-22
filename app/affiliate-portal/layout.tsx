// app/affiliate-portal/layout.tsx
// Root layout for ALL affiliate portal pages — public landing, login, apply, etc.
// No sidebar here — sidebar lives in dashboard/layout.tsx (dashboard pages only).
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'GrowNest Affiliate Portal', template: '%s | GrowNest Affiliate' },
  description: 'Share GrowNest and earn monthly commission.',
};

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
