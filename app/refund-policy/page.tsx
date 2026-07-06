import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Refund & Cancellation Policy | GrowNest' };

export default function RefundPolicyPage() {
  return <LegalDocument doc={legalDocs['refund-policy']} />;
}
