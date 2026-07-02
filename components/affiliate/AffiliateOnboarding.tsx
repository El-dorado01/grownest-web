'use client';
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2, Copy, Check, ArrowRight, Share2,
  Link2, TrendingUp, Wallet, Users, Sparkles,
} from 'lucide-react';
import { FaWhatsapp, FaTwitter } from 'react-icons/fa';
import { toast } from 'sonner';
import type { Affiliate } from '@/types/affiliate';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

function formatCommission(affiliate: Affiliate): string {
  const c = affiliate.campaign;
  if (!c) return 'N/A';
  return c.commissionType === 'FIXED'
    ? fmt(c.commissionValue)
    : `${c.commissionValue}%`;
}

// ─── Step dots ────────────────────────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? 'w-6 h-2 bg-primary'
              : i < current
              ? 'w-2 h-2 bg-primary/40'
              : 'w-2 h-2 bg-muted-foreground/25'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────
function StepWelcome({ firstName, affiliate }: { firstName: string; affiliate: Affiliate }) {
  return (
    <div className="flex flex-col items-center text-center gap-5 py-2">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-9 h-9 text-primary" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-md">
          <CheckCircle2 className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800 px-3 py-1 text-xs font-semibold">
          Affiliate Approved
        </Badge>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome, {firstName}! 🎉
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          You&apos;re now an official GrowNest affiliate. Start sharing your link and
          earn commissions every time someone you refer makes their first deposit.
        </p>
      </div>

      <div className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-left">
        <p className="text-xs text-muted-foreground mb-0.5">Your affiliate code</p>
        <p className="text-lg font-mono font-bold tracking-widest text-primary">
          {affiliate.affiliateCode}
        </p>
      </div>
    </div>
  );
}

// ─── Step 2: Campaign ─────────────────────────────────────────────────────────
function StepCampaign({ affiliate }: { affiliate: Affiliate }) {
  const campaign = affiliate.campaign;

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-foreground">Your Campaign</h2>
        <p className="text-sm text-muted-foreground">
          Here&apos;s what you&apos;re enrolled in and what you&apos;ll earn.
        </p>
      </div>

      {campaign ? (
        <>
          <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <p className="text-xs text-muted-foreground mb-0.5">Campaign</p>
            <p className="font-semibold text-foreground">{campaign.name}</p>
            {campaign.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{campaign.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
              <TrendingUp className="w-4 h-4 text-primary mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-0.5">Commission</p>
              <p className="font-bold text-foreground text-sm">{formatCommission(affiliate)}</p>
              <p className="text-[10px] text-muted-foreground">per referral</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
              <Wallet className="w-4 h-4 text-amber-500 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-0.5">Min deposit</p>
              <p className="font-bold text-foreground text-sm">{fmt(campaign.minDepositAmount)}</p>
              <p className="text-[10px] text-muted-foreground">to qualify</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-3 text-center">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
              <p className="text-xs text-muted-foreground mb-0.5">Hold period</p>
              <p className="font-bold text-foreground text-sm">{campaign.holdDays}d</p>
              <p className="text-[10px] text-muted-foreground">before payout</p>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">No campaign assigned yet. Check back soon!</p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: How it works ─────────────────────────────────────────────────────
function StepHowItWorks({ affiliate }: { affiliate: Affiliate }) {
  const minDeposit = affiliate.campaign ? fmt(affiliate.campaign.minDepositAmount) : '—';
  const commission = formatCommission(affiliate);
  const holdDays   = affiliate.campaign?.holdDays ?? 30;

  const steps = [
    {
      icon: Share2,
      color: 'bg-primary/10 text-primary',
      title: 'Share your link',
      desc: 'Send your unique referral link to friends, family, or your audience.',
    },
    {
      icon: Users,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      title: 'They sign up',
      desc: 'Your referral creates a GrowNest account using your link.',
    },
    {
      icon: Wallet,
      color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
      title: `First deposit (${minDeposit}+)`,
      desc: `They make their first deposit of at least ${minDeposit} to qualify.`,
    },
    {
      icon: TrendingUp,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      title: `You earn ${commission}`,
      desc: `Commission is credited after the ${holdDays}-day hold period.`,
    },
  ];

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-foreground">How it works</h2>
        <p className="text-sm text-muted-foreground">Four simple steps to earn with GrowNest.</p>
      </div>

      <div className="space-y-3">
        {steps.map(({ icon: Icon, color, title, desc }, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="relative shrink-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              {i < steps.length - 1 && (
                <div className="absolute left-1/2 top-full w-px h-3 -translate-x-1/2 bg-border" />
              )}
            </div>
            <div className="pt-1 space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">Step {i + 1}</span>
              </div>
              <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Referral link ────────────────────────────────────────────────────
function StepReferralLink({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const waText = `Join GrowNest and start saving smarter! 🌱 Sign up here: ${referralLink}`;
  const xText  = `Earning monthly with GrowNest's affiliate program 💰\nSign up: ${referralLink}\n#GrowNest #Savings`;

  return (
    <div className="flex flex-col gap-5 py-2">
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-foreground">Your referral link</h2>
        <p className="text-sm text-muted-foreground">
          This is the link you&apos;ll share. Anyone who signs up through it is your referral.
        </p>
      </div>

      {/* Link display + copy */}
      <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
        <div className="flex items-start gap-2.5">
          <Link2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm font-mono text-foreground break-all leading-relaxed flex-1">
            {referralLink}
          </p>
        </div>
        <Button onClick={handleCopy} size="sm" className="w-full gap-2" variant="outline">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>

      {/* Quick share */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium">Quick share</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank')}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <FaWhatsapp size={17} color="#25D366" />
            WhatsApp
          </button>
          <button
            onClick={() => window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(xText)}`, '_blank')}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/40 py-3 text-sm font-medium hover:bg-muted transition-colors"
          >
            <FaTwitter size={17} color="#e5e7eb" />
            X (Twitter)
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const TOTAL_STEPS = 4;

interface AffiliateOnboardingProps {
  affiliate: Affiliate;
  firstName: string;
  referralLink: string;
  onDismiss: () => void;
}

export function AffiliateOnboarding({ affiliate, firstName, referralLink, onDismiss }: AffiliateOnboardingProps) {
  const [step, setStep] = useState(0);

  const dismiss = () => {
    localStorage.setItem(`onboarded_${affiliate.affiliateCode}`, '1');
    onDismiss();
  };

  const isLast = step === TOTAL_STEPS - 1;

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className="max-w-sm w-full rounded-2xl p-0 overflow-hidden [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Step dots header */}
        <div className="px-6 pt-6 pb-0">
          <StepDots total={TOTAL_STEPS} current={step} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[340px]">
          {step === 0 && <StepWelcome firstName={firstName} affiliate={affiliate} />}
          {step === 1 && <StepCampaign affiliate={affiliate} />}
          {step === 2 && <StepHowItWorks affiliate={affiliate} />}
          {step === 3 && <StepReferralLink referralLink={referralLink} />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 space-y-2">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setStep(s => s - 1)}
              >
                Back
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={isLast ? dismiss : () => setStep(s => s + 1)}
            >
              {isLast ? (
                "Let's go!"
              ) : (
                <>
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </div>

          <button
            onClick={dismiss}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Skip tutorial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
