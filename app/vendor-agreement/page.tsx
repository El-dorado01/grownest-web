import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Vendor & Merchant Agreement | GrowNest' };

export default function VendorAgreementPage() {
  return <LegalDocument doc={legalDocs['vendor-agreement']} />;
}
