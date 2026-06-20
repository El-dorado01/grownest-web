// app/affiliate-portal/page.tsx
import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Affiliate Program | GrowNest Africa' };

const STEPS = [
  { icon: Users, title: 'Share your link', description: 'Get a unique referral link and code to share with your audience on any platform — Instagram, WhatsApp, TikTok, Facebook, anywhere.' },
  { icon: TrendingUp, title: 'Friends sign up & deposit', description: 'When someone signs up using your link and makes their first savings deposit, you earn a commission.' },
  { icon: Wallet, title: 'Earn monthly', description: 'Your commissions are credited to your GrowNest NestPurse wallet every month. Withdraw anytime to your bank account.' },
];

export default function AffiliateLandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 to-green-800 text-white px-4 py-20 text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">Earn with GrowNest</h1>
        <p className="text-green-100 text-lg md:text-xl max-w-xl mx-auto mb-8">
          Share GrowNest with your audience and earn monthly commission for every person who joins and saves.
        </p>
        <Button asChild size="lg" className="bg-white text-green-700 hover:bg-green-50 min-h-[52px] text-base font-semibold px-8">
          <Link href="/login">
            Get Started <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </Link>
        </Button>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => (
            <div key={step.title} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <step.icon className="w-7 h-7 text-green-700" aria-hidden="true" />
              </div>
              <p className="text-xs font-bold text-green-600 uppercase tracking-widest">Step {i + 1}</p>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Requirements */}
      <section className="bg-gray-50 px-4 py-14">
        <div className="max-w-2xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Who can join?</h2>
          {[
            { q: 'Do I need a GrowNest account?', a: 'Yes — you must already have a verified GrowNest account with an active NestPurse wallet. Log in with your existing GrowNest email and password.' },
            { q: 'What social media do I need?', a: "At least one active channel — Instagram, Facebook, X (Twitter), WhatsApp Channel, WhatsApp Status, YouTube, or TikTok. You'll upload screenshots to verify your reach." },
            { q: 'When do I get paid?', a: 'Commissions are paid monthly into your NestPurse wallet. From there, you can withdraw to your bank account anytime.' },
            { q: 'Is there a minimum deposit for referrals?', a: 'Yes — your referred user must make a minimum qualifying first deposit. The exact amount is shown in your dashboard once approved.' },
          ].map(({ q, a }) => (
            <div key={q} className="rounded-xl bg-white border p-5">
              <p className="font-semibold text-gray-900 mb-1">{q}</p>
              <p className="text-gray-600 text-sm leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to start earning?</h2>
        <p className="text-gray-600 mb-8">Log in with your GrowNest account to apply. Approval within 48 hours.</p>
        <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white min-h-[52px] text-base font-semibold px-10">
          <Link href="/login">Log in to Apply</Link>
        </Button>
      </section>
    </main>
  );
}
