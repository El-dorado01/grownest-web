// app/affiliate-portal/page.tsx
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  Users,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  BadgeCheck,
  Smartphone,
  CalendarCheck,
  Sparkles,
  Share2,
  UserPlus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { AffiliateNavbar } from "@/components/affiliate/AffiliateNavbar"
import { AffiliateFooter } from "@/components/affiliate/AffiliateFooter"
import { HeroCTA, BottomCTA } from "@/components/affiliate/AffiliateLandingCTA"

export const metadata = { title: "Affiliate Program | GrowNest Africa" }

const STEPS = [
  {
    icon: Share2,
    step: "01",
    title: "Share your link",
    description:
      "Get a unique referral link and code to share with your audience on Instagram, WhatsApp, TikTok, Facebook, or anywhere else.",
  },
  {
    icon: UserPlus,
    step: "02",
    title: "Friends sign up & subscribe",
    description:
      "When someone joins using your link and pays toward a NestBasket plan (not just funding their wallet), you unlock your commission.",
  },
  {
    icon: Wallet,
    step: "03",
    title: "Earn every month",
    description:
      "Commissions hit your NestPurse wallet monthly. Withdraw anytime straight to your bank account.",
  },
]

const REQUIREMENTS = [
  {
    icon: BadgeCheck,
    title: "GrowNest account",
    body: "You need a verified GrowNest account with an active NestPurse wallet. Log in with your existing credentials.",
  },
  {
    icon: Smartphone,
    title: "Active social presence",
    body: "At least one active channel, such as Instagram, Facebook, X, WhatsApp, YouTube, or TikTok.",
  },
  {
    icon: Users,
    title: "Genuine audience",
    body: "You'll upload screenshots to verify your reach. Authentic engagement is what counts, not just follower numbers.",
  },
  {
    icon: CheckCircle2,
    title: "Honest promotion",
    body: "Share GrowNest truthfully. We review your content to make sure it aligns with our brand guidelines.",
  },
]

const TIPS = [
  {
    icon: TrendingUp,
    label: "Show GrowNest's power",
    body: "Share your own savings journey and demonstrate how GrowNest helps people grow their wealth.",
  },
  {
    icon: Sparkles,
    label: "Compare with others",
    body: "Highlight what sets GrowNest apart, interest rates, ease of use, and Africa-first design.",
  },
  {
    icon: CalendarCheck,
    label: "Success stories",
    body: "Real testimonials and case studies land better than generic content. Share what you know.",
  },
]

const FAQS = [
  {
    q: "Do I need a GrowNest account to apply?",
    a: "Yes. You must already have a verified GrowNest account with an active NestPurse wallet. Log in with your existing GrowNest email and password.",
  },
  {
    q: "What social media platforms qualify?",
    a: "At least one active channel, such as Instagram, Facebook, X (Twitter), WhatsApp Channel, WhatsApp Status, YouTube, or TikTok. You'll upload screenshots to verify your reach.",
  },
  {
    q: "When do I get paid?",
    a: "Commissions are paid monthly into your NestPurse wallet. From there, you can withdraw to your bank account anytime.",
  },
  {
    q: "Is there a minimum amount for referrals?",
    a: "Yes. Your referred user must pay a minimum qualifying amount toward a NestBasket plan. The exact amount is shown in your dashboard once approved.",
  },
  {
    q: "Does it count if my referral just funds their wallet?",
    a: "No. Funding the NestPurse wallet on its own does not qualify a referral. The money has to actually go toward a NestBasket plan (subscribing, a flexible payment, or auto-pay) before your commission is created.",
  },
  {
    q: "What if my referral spreads payments across more than one NestBasket?",
    a: "Check your dashboard for each referral’s exact status. It shows exactly how close they are to qualifying.",
  },
  {
    q: "How long does approval take?",
    a: "Applications are typically reviewed and approved within 48 hours of submission.",
  },
]

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
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-28 md:grid-cols-2 md:py-36">
          {/* Copy */}
          <div className="space-y-6">
            <Badge className="border-white/25 bg-white/15 text-xs font-semibold tracking-widest text-white uppercase backdrop-blur-sm hover:bg-white/20">
              GrowNest Affiliate Program
            </Badge>
            <h1 className="text-4xl leading-tight font-bold drop-shadow-lg md:text-5xl lg:text-6xl">
              Earn while you&nbsp;
              <span className="relative">
                <span className="relative z-10">inspire</span>
                <span className="absolute right-0 bottom-1 left-0 z-0 h-3 rounded-sm bg-white/25" />
              </span>
            </h1>
            <p className="max-w-lg text-lg leading-relaxed text-white/90 drop-shadow md:text-xl">
              Share GrowNest with your audience and earn monthly commission for
              every person who joins and saves.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <HeroCTA />
              <Button
                asChild
                size="lg"
                variant="outline"
                className="min-h-13 border-white/40 bg-white/10 px-8 text-white backdrop-blur-sm hover:bg-white/15 hover:text-white"
              >
                <Link href="/login?redirect=/portal">Get Started</Link>
              </Button>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="hidden items-center justify-end gap-4 md:flex">
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-center shadow-xl backdrop-blur-md">
                <p className="text-3xl font-bold text-white">48h</p>
                <p className="mt-1 text-xs font-medium text-white/70">
                  Approval time
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-center shadow-xl backdrop-blur-md">
                <p className="text-3xl font-bold text-white">Free</p>
                <p className="mt-1 text-xs font-medium text-white/70">
                  To join
                </p>
              </div>
            </div>
            <div className="mt-10 space-y-4">
              <div className="rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-center shadow-xl backdrop-blur-md">
                <p className="text-3xl font-bold text-white">Monthly</p>
                <p className="mt-1 text-xs font-medium text-white/70">
                  Payouts
                </p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/15 px-6 py-5 text-center shadow-xl backdrop-blur-md">
                <p className="text-3xl font-bold text-white">Any bank</p>
                <p className="mt-1 text-xs font-medium text-white/70">
                  Withdrawal
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 text-center md:grid-cols-4">
          {[
            { value: "48h", label: "Approval time" },
            { value: "Monthly", label: "Commission payouts" },
            { value: "Any bank", label: "Withdrawal target" },
            { value: "Free", label: "To join" },
          ].map(({ value, label }) => (
            <div key={label} className="space-y-1">
              <p className="text-2xl font-bold text-primary md:text-3xl">
                {value}
              </p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mb-14 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-xs text-primary"
          >
            Simple process
          </Badge>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            Three steps. That&apos;s all it takes to start earning with
            GrowNest.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, step, title, description }) => (
            <div
              key={step}
              className="group relative space-y-4 rounded-2xl border border-border bg-card p-7 transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent transition-colors group-hover:bg-primary/20">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-4xl font-black text-border transition-colors select-none group-hover:text-primary/20">
                  {step}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Requirements grid ── */}
      <section className="border-y border-border bg-muted/40 px-4 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          {/* Illustration */}
          <div className="flex justify-center">
            <Image
              src="/undraw_wallet_diag.svg"
              alt="Wallet illustration"
              width={420}
              // fill
              height={320}
              unoptimized
              className="w-full max-w-sm object-contain drop-shadow-lg md:max-w-md"
            />
          </div>

          {/* Cards */}
          <div className="space-y-5">
            <div>
              <Badge
                variant="outline"
                className="mb-4 border-primary/30 text-xs text-primary"
              >
                Eligibility
              </Badge>
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">
                Who can join?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Here&apos;s what you need to become a GrowNest affiliate.
              </p>
            </div>
            {REQUIREMENTS.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tips from the team ── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="space-y-5">
            <Badge
              variant="outline"
              className="border-primary/30 text-xs text-primary"
            >
              Pro tips
            </Badge>
            <h2 className="text-3xl leading-tight font-bold text-foreground md:text-4xl">
              Want to stand out?
              <br />
              <span className="text-primary">Tips from our team</span>
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              The top-earning affiliates don&apos;t just drop links, they tell
              stories. Here&apos;s what works best.
            </p>
            <Button asChild size="lg" className="mt-2">
              <Link href="/affiliate-portal/apply">
                Start your application <ArrowRight className="ml-2 h-4 w-4" />
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
              <div
                key={label}
                className="flex gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key dates ── */}
      <section className="border-y border-primary/20 bg-linear-to-r from-primary/10 to-secondary/10 px-4 py-14">
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Badge
              variant="outline"
              className="mb-3 border-primary/30 text-xs text-primary"
            >
              Key information
            </Badge>
            <h2 className="text-2xl font-bold text-foreground">
              What to expect
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s a timeline once you submit your application.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 md:col-span-2">
            {[
              { icon: Clock, label: "Apply", detail: "Takes ~5 minutes" },
              {
                icon: BadgeCheck,
                label: "Get approved",
                detail: "Within 48 hours",
              },
              {
                icon: Wallet,
                label: "Start earning",
                detail: "Monthly payouts",
              },
            ].map(({ icon: Icon, label, detail }) => (
              <div
                key={label}
                className="space-y-2 rounded-2xl border border-border bg-card p-5 text-center"
              >
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs font-medium text-primary">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="mx-auto max-w-3xl px-4 py-20">
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-primary/30 text-xs text-primary"
          >
            Got questions?
          </Badge>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            FAQs
          </h2>
        </div>

        <Accordion type="single" collapsible className="space-y-3">
          {FAQS.map(({ q, a }, i) => (
            <AccordionItem
              key={q}
              value={`item-${i}`}
              className="rounded-2xl border border-border bg-card px-6 transition-colors data-[state=open]:border-primary/40"
            >
              <AccordionTrigger className="py-5 text-sm font-semibold text-foreground hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bg-linear-to-br from-secondary via-primary/90 to-primary px-4 py-20 text-center text-white">
        <div className="mx-auto max-w-2xl space-y-6">
          <Image
            src="/undraw_gifts_4gy3.svg"
            alt=""
            width={120}
            height={120}
            unoptimized
            className="mx-auto opacity-90"
          />
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to start earning?
          </h2>
          <p className="text-lg text-white/80">
            Log in with your GrowNest account and apply. Approval within 48
            hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <BottomCTA />
          </div>
        </div>
      </section>

      <AffiliateFooter />
    </div>
  )
}
