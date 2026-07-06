// components/legal/LegalDocument.tsx
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { LegalDoc } from '@/lib/legal-content';

export function LegalDocument({ doc }: { doc: LegalDoc }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to GrowNest
        </Link>

        <h1 className="text-2xl font-bold text-foreground md:text-3xl">{doc.title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Version {doc.version} &middot; Effective {doc.effectiveDate} &middot; Last updated {doc.lastUpdated}
        </p>

        {doc.intro && (
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-muted-foreground">
            {doc.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        )}

        <div className="mt-8 space-y-8">
          {doc.sections.map((section, i) => (
            <section key={i}>
              {section.heading && (
                <h2 className="mb-2 text-base font-semibold text-foreground">{section.heading}</h2>
              )}
              {section.paragraphs?.map((p, j) => (
                <p key={j} className="mb-3 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {section.list.map((item, k) => (
                    <li key={k}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
