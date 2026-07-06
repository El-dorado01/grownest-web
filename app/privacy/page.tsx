import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Privacy Policy | GrowNest' };

export default function PrivacyPage() {
  return <LegalDocument doc={legalDocs.privacy} />;
}
