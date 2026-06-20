// app/affiliate-portal/layout.tsx
import type { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: { default: 'GrowNest Affiliate Portal', template: '%s | GrowNest Affiliate' },
  description: 'Share GrowNest and earn monthly commission.',
};

export default function AffiliatePortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <Image src="/d_icon.png" alt="GrowNest" width={32} height={32} className="rounded" />
        <span className="text-sm font-semibold text-muted-foreground">Affiliate Portal</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
