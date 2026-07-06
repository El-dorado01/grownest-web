import type { Metadata } from 'next';
import { legalDocs } from '@/lib/legal-content';
import { LegalDocument } from '@/components/legal/LegalDocument';

export const metadata: Metadata = { title: 'Cookie Policy | GrowNest' };

export default function CookiesPage() {
  return <LegalDocument doc={legalDocs.cookies} />;
}
