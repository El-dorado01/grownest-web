import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Terms & Conditions | GrowNest' };

export default function TermsPage() {
  return <LegalDocument doc={legalDocs.terms} />;
}
