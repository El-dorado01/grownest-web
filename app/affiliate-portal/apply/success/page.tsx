// app/affiliate-portal/apply/success/page.tsx
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AffiliateApplySuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="bg-card text-card-foreground rounded-2xl border border-border p-8 max-w-md w-full text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-foreground">Application Submitted!</h1>
        <p className="text-muted-foreground">
          Thank you for applying to the GrowNest Affiliate Program. Our team will review your application
          and get back to you within 48 hours.
        </p>
        <Button asChild className="w-full min-h-[44px]">
          <Link href="/dashboard/application">View My Application</Link>
        </Button>
      </div>
    </div>
  );
}
