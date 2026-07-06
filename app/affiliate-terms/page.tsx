import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Affiliate Programme Terms | GrowNest' };

export default function AffiliateTermsPage() {
  return <LegalDocument doc={legalDocs['affiliate-terms']} />;
}
