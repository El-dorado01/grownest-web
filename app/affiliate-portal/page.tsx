// app/affiliate-portal/page.tsx
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Users, TrendingUp, Wallet, CheckCircle2, Clock, BadgeCheck, Smartphone, CalendarCheck, Sparkles, Share2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AffiliateNavbar } from '@/components/affiliate/AffiliateNavbar';
import { AffiliateFooter } from '@/components/affiliate/AffiliateFooter';
import { HeroCTA, BottomCTA } from '@/components/affiliate/AffiliateLandingCTA';

export const metadata = { title: 'Affiliate Program | GrowNest Africa' };

const STEPS = [
  {
    icon: Share2,
    step: '01',
    title: 'Share your link',
    description: 'Get a unique referral link and code to share with your audience — Instagram, WhatsApp, TikTok, Facebook, anywhere.',
  },
  {
    icon: UserPlus,
    step: '02',
    title: 'Friends sign up & save',
    description: 'When someone joins using your link and makes their first savings deposit, you unlock your commission.',
  },
  {
    icon: Wallet,
    step: '03',
    title: 'Earn every month',
    description: 'Commissions hit your NestPurse wallet monthly. Withdraw anytime straight to your bank account.',
  },
];

const REQUIREMENTS = [
  {
    icon: BadgeCheck,
    title: 'GrowNest account',
    body: 'You need a verified GrowNest account with an active NestPurse wallet. Log in with your existing credentials.',
  },
  {
    icon: Smartphone,
    title: 'Active social presence',
    body: 'At least one active channel — Instagram, Facebook, X, WhatsApp, YouTube, or TikTok.',
  },
  {
    icon: Users,
    title: 'Genuine audience',
    body: "You'll upload screenshots to verify your reach. Authentic engagement is what counts — not just follower numbers.",
  },
  {
    icon: CheckCircle2,
    title: 'Honest promotion',
    body: 'Share GrowNest truthfully. We review your content to make sure it aligns with our brand guidelines.',
  },
];

const TIPS = [
  { icon: TrendingUp, label: "Show GrowNest's power", body: 'Share your own savings journey and demonstrate how GrowNest helps people grow their wealth.' },
  { icon: Sparkles, label: 'Compare with others', body: "Highlight what sets GrowNest apart — interest rates, ease of use, and Africa-first design." },
  { icon: CalendarCheck, label: 'Success stories', body: 'Real testimonials and case studies land better than generic content. Share what you know.' },
];

const FAQS = [
  { q: 'Do I need a GrowNest account to apply?', a: 'Yes — you must already have a verified GrowNest account with an active NestPurse wallet. Log in with your existing GrowNest email and password.' },
  { q: 'What social media platforms qualify?', a: 'At least one active channel — Instagram, Facebook, X (Twitter), WhatsApp Channel, WhatsApp Status, YouTube, or TikTok. You\'ll upload screenshots to verify your reach.' },
  { q: 'When do I get paid?', a: 'Commissions are paid monthly into your NestPurse wallet. From there, you can withdraw to your bank account anytime.' },
  { q: 'Is there a minimum deposit for referrals?', a: 'Yes — your referred user must make a minimum qualifying first deposit. The exact amount is shown in your dashboard once approved.' },
  { q: 'How long does approval take?', a: 'Applications are typically reviewed and approved within 48 hours of submission.' },
];

export default function AffiliateLandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <AffiliateNavbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden text-white">
        {/* Background photo */}
        <Image
          src="/bg-image-4.jpeg"
          alt=""
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-secondary/60 via-primary/35 to-secondary/20" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />

        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-36 grid md:grid-cols-2 gap-12 items-center">
          {/* Copy */}
          <div className="space-y-6">
            <Badge className="bg-white/15 text-white border-white/25 hover:bg-white/20 text-xs font-semibold tracking-widest uppercase backdrop-blur-sm">
              GrowNest Affiliate Program
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight drop-shadow-lg">
              Earn while you&nbsp;
              <span className="relative">
                <span className="relative z-10">inspire</span>
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-white/25 rounded-sm z-0" />
              </span>
            </h1>
            <p className="text-white/90 text-lg md:text-xl max-w-lg leading-relaxed drop-shadow">
              Share GrowNest with your audience and earn monthly commission for every person who joins and saves.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <HeroCTA />
              <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/15 hover:text-white min-h-13 px-8 bg-white/10 backdrop-blur-sm">
                <Link href="/login?redirect=/portal">
                  Get Started
                </Link>
              </Button>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="hidden md:flex justify-end items-center gap-4">
            <div className="space-y-4">
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 text-center shadow-xl">
                <p className="text-3xl font-bold text-white">48h</p>
                <p className="text-xs text-white/70 font-medium mt-1">Approval time</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 text-center shadow-xl">
                <p className="text-3xl font-bold text-white">Free</p>
                <p className="text-xs text-white/70 font-medium mt-1">To join</p>
              </div>
            </div>
            <div className="space-y-4 mt-10">
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 text-center shadow-xl">
                <p className="text-3xl font-bold text-white">Monthly</p>
                <p className="text-xs text-white/70 font-medium mt-1">Payouts</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-5 text-center shadow-xl">
                <p className="text-3xl font-bold text-white">Any bank</p>
                <p className="text-xs text-white/70 font-medium mt-1">Withdrawal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '48h', label: 'Approval time' },
            { value: 'Monthly', label: 'Commission payouts' },
            { value: 'Any bank', label: 'Withdrawal target' },
            { value: 'Free', label: 'To join' },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-2xl md:text-3xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <Badge variant="outline" className="border-primary/30 text-primary text-xs mb-4">Simple process</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">How it works</h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Three steps. That's all it takes to start earning with GrowNest.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, step, title, description }) => (
            <div key={step} className="relative bg-card border border-border rounded-2xl p-7 space-y-4 hover:border-primary/40 hover:shadow-md transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-4xl font-black text-border group-hover:text-primary/20 transition-colors select-none">{step}</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Requirements grid ── */}
      <section className="bg-muted/40 border-y border-border px-4 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          {/* Illustration */}
          <div className="flex justify-center">
            <Image
              src="/undraw_wallet_diag.svg"
              alt="Wallet illustration"
              width={420}
              // fill
              height={320}
              unoptimized
              className="w-full max-w-sm md:max-w-md drop-shadow-lg object-contain"
            />
          </div>

          {/* Cards */}
          <div className="space-y-5">
            <div>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs mb-4">Eligibility</Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Who can join?</h2>
              <p className="text-muted-foreground mt-3">Here's what you need to become a GrowNest affiliate.</p>
            </div>
            {REQUIREMENTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-card border border-border rounded-2xl p-5 flex gap-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-accent shrink-0 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tips from the team ── */}
      <section className="px-4 py-20 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">Pro tips</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
              Want to stand out?<br />
              <span className="text-primary">Tips from our team</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The top-earning affiliates don't just drop links — they tell stories. Here's what works best.
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href="/affiliate-portal/apply">
                Start your application <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <div className="pt-4">
              <Image
                src="/undraw_stripe-payments_jxnn.svg"
                alt="Payments illustration"
                width={360}
                height={260}
                unoptimized
                className="w-full max-w-xs drop-shadow-md"
              />
            </div>
          </div>

          <div className="space-y-4">
            {TIPS.map(({ icon: Icon, label, body }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 flex gap-4 hover:border-primary/40 hover:shadow-sm transition-all duration-200">
                <div className="w-10 h-10 rounded-lg bg-accent shrink-0 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground text-sm">{label}</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key dates ── */}
      <section className="bg-linear-to-r from-primary/10 to-secondary/10 border-y border-primary/20 px-4 py-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1">
            <Badge variant="outline" className="border-primary/30 text-primary text-xs mb-3">Key information</Badge>
            <h2 className="text-2xl font-bold text-foreground">What to expect</h2>
            <p className="text-muted-foreground text-sm mt-2">Here's a timeline once you submit your application.</p>
          </div>
          <div className="md:col-span-2 grid sm:grid-cols-3 gap-4">
            {[
              { icon: Clock, label: 'Apply', detail: 'Takes ~5 minutes' },
              { icon: BadgeCheck, label: 'Get approved', detail: 'Within 48 hours' },
              { icon: Wallet, label: 'Start earning', detail: 'Monthly payouts' },
            ].map(({ icon: Icon, label, detail }) => (
              <div key={label} className="bg-card border border-border rounded-2xl p-5 text-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-primary text-xs font-medium">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="px-4 py-20 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="border-primary/30 text-primary text-xs mb-4">Got questions?</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">FAQs</h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <AccordionItem
              key={q}
              value={`item-${i}`}
              className="border border-border rounded-2xl px-6 bg-card data-[state=open]:border-primary/40 transition-colors"
            >
              <AccordionTrigger className="font-semibold text-foreground text-sm hover:no-underline py-5">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="px-4 py-20 bg-linear-to-br from-secondary via-primary/90 to-primary text-white text-center">
        <div className="max-w-2xl mx-auto space-y-6">
          <Image src="/undraw_gifts_4gy3.svg" alt="" width={120} height={120} unoptimized className="mx-auto opacity-90" />
          <h2 className="text-3xl md:text-4xl font-bold">Ready to start earning?</h2>
          <p className="text-white/80 text-lg">
            Log in with your GrowNest account and apply. Approval within 48 hours.
          </p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <BottomCTA />
          </div>
        </div>
      </section>

      <AffiliateFooter />
    </div>
  );
}
