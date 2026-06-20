// app/affiliate-portal/apply/success/page.tsx
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AffiliateApplySuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border p-8 max-w-md w-full text-center space-y-4">
        <CheckCircle className="w-14 h-14 text-primary mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
        <p className="text-gray-600">
          Thank you for applying to the GrowNest Affiliate Program. Our team will review your application
          and get back to you within 48 hours.
        </p>
        <Button asChild className="w-full min-h-[44px]">
          <Link href="/">Back to GrowNest</Link>
        </Button>
      </div>
    </div>
  );
}
