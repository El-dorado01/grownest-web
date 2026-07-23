// app/affiliate-portal/portal/page.tsx
'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { affiliateApi } from '@/lib/affiliate-api';
import { AffiliateStatusBadge } from '@/components/affiliate/AffiliateStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip as ReTooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Copy, Check, Share2, ArrowRight, ChevronRight,
  TrendingUp, Users, MousePointerClick, Wallet,
  Zap, Target, Receipt, Sparkles, ExternalLink,
  Calendar, ShieldX, XCircle,
} from 'lucide-react';
import { FaWhatsapp, FaTwitter, FaFacebook, FaInstagram, FaTiktok, FaTelegram } from 'react-icons/fa';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/use-profile';
import { CampaignUpgradeDialog, CampaignSwitcherSheet } from '@/components/affiliate/CampaignSwitcher';
import { AffiliateOnboarding } from '@/components/affiliate/AffiliateOnboarding';
import { affiliatePath } from '@/lib/affiliate-portal-path';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

// ─── Tier config ──────────────────────────────────────────────────────────────
const TIERS = ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ELITE'] as const;
const TIER_THRESHOLDS: Record<string, number> = { STARTER: 0, GROWTH: 21, PROFESSIONAL: 101, ELITE: 500 };
const TIER_STYLE: Record<string, string> = {
  STARTER:      'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
  GROWTH:       'border-blue-400 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  PROFESSIONAL: 'border-purple-400 bg-purple-100 text-purple-700 dark:border-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  ELITE:        'border-primary/60 bg-primary/10 text-primary font-bold',
};


// ─── Share platforms ──────────────────────────────────────────────────────────
const SHARE_PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, iconColor: '#25D366', getUrl: (l: string) => `https://wa.me/?text=${encodeURIComponent(`Join GrowNest and start saving smarter! 🌱 Sign up here: ${l}`)}`, copyOnly: false },
  { id: 'twitter',  label: 'X (Twitter)', icon: FaTwitter,  iconColor: '#e5e7eb', getUrl: (l: string) => `https://x.com/intent/tweet?text=${encodeURIComponent(`Earning monthly with GrowNest's affiliate program 💰\nSign up: ${l}\n#GrowNest #Savings`)}`, copyOnly: false },
  { id: 'facebook', label: 'Facebook',  icon: FaFacebook,  iconColor: '#4f8ef7', getUrl: (l: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(l)}`, copyOnly: false },
  { id: 'telegram', label: 'Telegram',  icon: FaTelegram,  iconColor: '#36AEFF', getUrl: (l: string) => `https://t.me/share/url?url=${encodeURIComponent(l)}&text=${encodeURIComponent('Join GrowNest 🌱')}`, copyOnly: false },
  { id: 'instagram', label: 'Instagram', icon: FaInstagram, iconColor: '#f06292', getUrl: null, copyOnly: true },
  { id: 'tiktok',   label: 'TikTok',    icon: FaTiktok,    iconColor: '#c9c9c9', getUrl: null, copyOnly: true },
];

// ─── Share sheet ──────────────────────────────────────────────────────────────
function ShareSheet({ open, onClose, affiliateCode, referralLink }: { open: boolean; onClose: () => void; affiliateCode: string; referralLink: string }) {
  const isMobile = useIsMobile();
  const [copied,     setCopied]     = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };
  const handleCodeCopy = async () => {
    await navigator.clipboard.writeText(affiliateCode);
    setCodeCopied(true);
    toast.success('Affiliate code copied!');
    setTimeout(() => setCodeCopied(false), 2000);
  };
  return (
    <Sheet open={open} onOpenChange={open => !open && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'left'}
        className={`flex flex-col gap-0 p-0 bg-card border-border transition-all duration-300 ease-out ${isMobile ? 'h-auto max-h-[90vh] rounded-t-2xl' : 'w-full sm:max-w-sm'}`}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">Share your referral link</SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Choose where to share with your audience.</p>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Referral link row */}
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 border border-border px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground mb-0.5">Your referral link</p>
              <p className="text-sm font-mono text-foreground truncate">{referralLink}</p>
            </div>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-3 gap-2">
            {SHARE_PLATFORMS.map(({ id, label, icon: Icon, iconColor, getUrl, copyOnly }) => (
              <button
                key={id}
                onClick={() => {
                  if (getUrl) { window.open(getUrl(referralLink), '_blank'); }
                  else { handleCopy(); toast.info(`Link copied! Paste into your ${label} bio.`); }
                }}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-muted/40 py-4 hover:bg-muted transition-all duration-150 active:scale-95"
              >
                <Icon size={22} style={{ color: iconColor }} />
                <span className="text-sm font-medium text-foreground leading-tight text-center">{label}</span>
                {copyOnly && <span className="text-[9px] text-muted-foreground">Copy link</span>}
              </button>
            ))}
          </div>

          {/* Referral code */}
          <div className="rounded-xl border border-border bg-primary/5 px-4 py-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">Or share your code directly</p>
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-mono font-bold tracking-widest text-primary">{affiliateCode}</p>
              <button
                onClick={handleCodeCopy}
                className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Tier progress bar ────────────────────────────────────────────────────────
function TierProgress({ tier, referrals }: { tier: string; referrals: number }) {
  const idx = TIERS.indexOf(tier as typeof TIERS[number]);
  const isElite = tier === 'ELITE';
  const nextTier = isElite ? null : TIERS[idx + 1];
  const current = TIER_THRESHOLDS[tier];
  const next = nextTier ? TIER_THRESHOLDS[nextTier] : null;
  const pct = isElite ? 100 : Math.min(100, Math.round(((referrals - current) / ((next ?? referrals) - current)) * 100));
  const remaining = next ? Math.max(0, next - referrals) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className={`text-xs px-2 py-0.5 ${TIER_STYLE[tier]}`}>{tier}</Badge>
          <span className="text-muted-foreground">{referrals} referrals</span>
        </div>
        {nextTier && (
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">{remaining} to go</span>
            <Badge variant="outline" className={`text-xs px-2 py-0.5 ${TIER_STYLE[nextTier]}`}>{nextTier}</Badge>
          </div>
        )}
        {isElite && <span className="text-primary font-semibold text-xs">🏆 Maximum tier</span>}
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {!isElite && (
        <p className="text-xs text-muted-foreground">
          Reach <span className="font-semibold text-foreground">{TIER_STYLE[nextTier!] ? nextTier : ''}</span> tier to unlock higher commission rates
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AffiliateDashboardPage() {
  const { data: meData,         isLoading: meLoading,  mutate: mutateMe }   = useSWR('affiliate/me',             () => affiliateApi.getMe());
  const { data: summaryData,    isLoading: summaryLoading }                   = useSWR('affiliate/earnings-summary', () => affiliateApi.getEarningsSummary());
  const { data: referralsData }                                              = useSWR('affiliate/referrals/1',     () => affiliateApi.getReferrals(1));
  const { data: campaignsData, mutate: mutateCampaigns }                    = useSWR('affiliate/campaigns/available', () => affiliateApi.getAvailableCampaigns());

  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [shareOpen,      setShareOpen]      = useState(false);
  const [payoutOpen,     setPayoutOpen]     = useState(false);
  const [switcherOpen,   setSwitcherOpen]   = useState(false);
  const [chartRange,     setChartRange]     = useState<'7' | '30' | '90'>('30');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: dailyData, isLoading: dailyLoading } = useSWR(
    ['affiliate/referrals-daily', chartRange],
    () => affiliateApi.getReferralsDaily(parseInt(chartRange))
  );

  useEffect(() => {
    const a = meData?.data?.affiliate;
    if (!a || a.status !== 'ACTIVE') return;
    if (!localStorage.getItem(`onboarded_${a.affiliateCode}`)) {
      setShowOnboarding(true);
    }
  }, [meData]);

  // Time-based greeting
  const greeting = (() => {
    const h = new Date().getHours();
    if (h >= 5  && h < 12) return 'Good morning';
    if (h >= 12 && h < 17) return 'Good afternoon';
    if (h >= 17 && h < 21) return 'Good evening';
    return 'Hi';
  })();

  // First name from fullName (e.g. "Taiwo Sunday" → "Taiwo")
  const firstName = profile?.fullName?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? 'there';

  const affiliate         = meData?.data?.affiliate;
  const summary           = summaryData?.data;
  const referrals         = referralsData?.data?.referrals ?? [];
  const availableCampaigns = campaignsData?.data?.campaigns ?? [];
  // Only an ACTIVE affiliate gets the live dashboard (share tools, referral
  // link, campaign switching, earnings). PENDING/REJECTED/SUSPENDED all see
  // a status card instead — previously only PENDING was restricted, which
  // meant a rejected or suspended affiliate still saw a fully "live"
  // dashboard with a working share flow.
  const isActive          = affiliate?.status === 'ACTIVE';
  const STATUS_INFO: Record<string, { title: string; desc: string; icon: typeof Calendar; className: string }> = {
    PENDING:   { title: 'Application under review', desc: 'Our team will notify you within 48 hours.', icon: Calendar, className: 'border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 text-amber-900 dark:text-amber-400' },
    REJECTED:  { title: 'Application not approved', desc: 'Your application was not approved this time. You can view details and re-apply from your application page.', icon: XCircle, className: 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 text-red-900 dark:text-red-400' },
    SUSPENDED: { title: 'Account suspended', desc: 'Your affiliate account has been suspended. Please contact support for details.', icon: ShieldX, className: 'border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-900/50 text-red-900 dark:text-red-400' },
  };
  const statusInfo = affiliate?.status ? STATUS_INFO[affiliate.status] : undefined;

  const handleCampaignSwitched = () => {
    void mutateMe();
    void mutateCampaigns();
  };

  const BASE_URL     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://grownest.africa';
  const referralLink = `${BASE_URL}/signup?ref=${affiliate?.affiliateCode ?? ''}`;

  // Derived metrics
  const epc     = (summary?.totalClicks ?? 0) > 0 ? ((summary?.totalEarned ?? 0) / (summary?.totalClicks ?? 1)) : 0;
  const convRate = (summary?.totalClicks ?? 0) > 0 ? (((summary?.totalReferrals ?? 0) / (summary?.totalClicks ?? 1)) * 100) : 0;

  // Chart data (memoised so it doesn't re-generate on every render)
  const chartData = useMemo(() => {
    const series = dailyData?.data?.series ?? [];
    const days = parseInt(chartRange);
    return series.map((s) => ({
      date: format(new Date(s.date), days <= 7 ? 'EEE' : 'MMM d'),
      referrals: s.referrals,
    }));
  }, [dailyData, chartRange]);

  if (meLoading) {
    return (
      <div className="w-full px-4 md:px-6 py-6 space-y-5 animate-pulse">
        {/* Greeting */}
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-64 rounded-lg" />
        </div>

        {/* Profile + tier hero */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="h-1.5 w-full bg-muted" />
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-40 rounded-lg" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-14 rounded-full" />
                </div>
                <Skeleton className="h-4 w-52 rounded" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-28 rounded-lg" />
              </div>
            </div>
            {/* Tier progress */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-56 rounded" />
            </div>
          </div>
        </div>

        {/* Main 75/25 layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
          {/* Left — main content */}
          <div className="lg:col-span-3 space-y-5">
            {/* 4 KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-3 w-20 rounded" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                  </div>
                  <Skeleton className="h-7 w-28 rounded-lg" />
                  <Skeleton className="h-2.5 w-16 rounded" />
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <Skeleton className="h-4 w-36 rounded" />
                <div className="flex gap-1">
                  <Skeleton className="h-7 w-8 rounded" />
                  <Skeleton className="h-7 w-9 rounded" />
                  <Skeleton className="h-7 w-9 rounded" />
                </div>
              </div>
              <div className="px-4 py-4">
                <Skeleton className="h-[180px] w-full rounded-xl" />
                <div className="flex justify-end gap-4 mt-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-16 rounded" />
                </div>
              </div>
            </div>

            {/* Referrals table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <div className="divide-y divide-border">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="h-3.5 w-24 rounded" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-5 w-16 rounded-full" />
                      <Skeleton className="h-4 w-14 rounded" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-3 border-t border-border">
                <Skeleton className="h-4 w-40 rounded mx-auto" />
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Next Steps card */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-24 rounded" />
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-2">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-3.5 w-full rounded" />
                </div>
              ))}
              <Skeleton className="h-8 w-full rounded-lg mt-1" />
            </div>
            {/* Quick Metrics */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-28 rounded" />
              {[1,2,3,4].map(i => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3.5 w-12 rounded" />
                </div>
              ))}
            </div>
            {/* Links */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <Skeleton className="h-4 w-20 rounded" />
              {[1,2].map(i => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-3 w-16 rounded" />
                  <Skeleton className="h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-5">

      {/* ── Onboarding dialog ───────────────────────────────────────────── */}
      {showOnboarding && affiliate && (
        <AffiliateOnboarding
          affiliate={affiliate}
          firstName={firstName}
          referralLink={referralLink}
          onDismiss={() => setShowOnboarding(false)}
        />
      )}

      {/* ── Greeting ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h2 className="text-2xl font-bold text-foreground">
          {greeting}, {firstName}!
        </h2>
        <p className="text-base text-muted-foreground">
          Welcome back to your affiliate dashboard.
        </p>
      </div>

      {/* ── Profile + Tier Hero ─────────────────────────────────────────── */}
      <Card className="bg-card border-border overflow-hidden">
        {/* <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-secondary" /> */}
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-foreground">Affiliate Dashboard</h1>
                {affiliate?.status && <AffiliateStatusBadge status={affiliate.status} />}
              </div>
              <p className="text-sm text-muted-foreground">
                Code:{' '}
                <span className="font-mono font-bold text-foreground tracking-wider">{affiliate?.affiliateCode}</span>
              </p>
            </div>
            {isActive && (
              <div className="flex gap-2 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm" onClick={() => setShareOpen(true)}>
                  <Share2 className="w-3.5 h-3.5" /> Share
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5 h-9 text-sm" onClick={() => setPayoutOpen(true)}>
                  <Receipt className="w-3.5 h-3.5" /> Payout History
                </Button>
              </div>
            )}
          </div>
          {isActive && (
            <TierProgress tier={summary?.tier ?? 'STARTER'} referrals={summary?.totalReferrals ?? 0} />
          )}
        </CardContent>
      </Card>

      {!isActive && statusInfo ? (
        <Card className={statusInfo.className}>
          <CardContent className="p-5 flex items-start gap-3">
            <statusInfo.icon className="w-5 h-5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{statusInfo.title}</p>
              <p className="text-sm mt-1 opacity-90">{statusInfo.desc}</p>
              <Link
                href={affiliatePath('/portal/application')}
                className="text-sm font-medium underline underline-offset-2 mt-2 inline-flex items-center gap-1"
              >
                View application details <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Main 75/25 layout ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* LEFT — main content (3/4) */}
            <div className="lg:col-span-3 space-y-5">

              {/* KPI strip */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Total Earned',      value: fmt(summary?.totalEarned ?? 0), icon: Wallet,   sub: 'all time' },
                  { label: 'Available',         value: fmt(summary?.available ?? 0),   icon: Sparkles, sub: 'next payout', highlight: true },
                  { label: 'Pending commissions', value: fmt(summary?.pending ?? 0),     icon: Target,   sub: 'in hold period' },
                  { label: 'Pending Referrals', value: String(Math.max((summary?.totalReferrals ?? 0) - (summary?.qualifiedReferrals ?? 0), 0)), icon: Users, sub: 'awaiting deposit' },
                  { label: 'Next Payout',       value: summary?.nextPayoutDate ? format(new Date(summary.nextPayoutDate), 'd MMM yyyy') : '—', icon: Receipt, sub: 'monthly' },
                ].map(({ label, value, icon: Icon, sub, highlight }) => (
                  <Card key={label} className={`border-border ${highlight ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                        <Icon className={`w-3.5 h-3.5 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <p className={`text-2xl font-bold tabular-nums ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Trend chart */}
              <Card className="bg-card border-border">
                <CardHeader className="px-5 pt-4 pb-0 flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold text-foreground">Performance Trend</CardTitle>
                  <Tabs value={chartRange} onValueChange={v => setChartRange(v as '7' | '30' | '90')}>
                    <TabsList className="h-7 text-xs">
                      <TabsTrigger value="7"  className="h-5 text-sm px-2">7D</TabsTrigger>
                      <TabsTrigger value="30" className="h-5 text-sm px-2">30D</TabsTrigger>
                      <TabsTrigger value="90" className="h-5 text-sm px-2">90D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="px-2 pt-3 pb-4">
                  {dailyLoading ? (
                    <Skeleton className="h-[180px] w-full rounded-lg" />
                  ) : chartData.every((d) => d.referrals === 0) ? (
                    <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center">
                      <p className="text-sm font-medium text-foreground">No referrals in this range yet</p>
                      <p className="text-xs text-muted-foreground">Share your link to start seeing activity here</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                        <defs>
                          <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor="oklch(0.72 0.16 84)" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="oklch(0.72 0.16 84)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 84 / 20%)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'oklch(0.45 0.02 84)' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: 'oklch(0.45 0.02 84)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <ReTooltip
                          contentStyle={{ background: 'oklch(0.22 0.02 84)', border: '1px solid oklch(0.9 0.01 84 / 20%)', borderRadius: '8px', fontSize: 12 }}
                          labelStyle={{ color: 'oklch(0.98 0.01 84)', fontWeight: 600 }}
                          itemStyle={{ color: 'oklch(0.7 0.02 84)' }}
                        />
                        <Area type="monotone" dataKey="referrals" stroke="oklch(0.72 0.16 84)" strokeWidth={2} fill="url(#refGrad)" name="Referrals" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  <div className="flex items-center gap-4 justify-end mt-1 px-2">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full bg-primary" /><span className="text-xs text-muted-foreground">Referrals</span></div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent referrals */}
              {referrals.length === 0 ? (
                <Card className="border-dashed border-border bg-card">
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">No referrals yet</p>
                      <p className="text-sm text-muted-foreground mt-0.5">Share your link to get your first referral</p>
                    </div>
                    <Button size="sm" onClick={() => setShareOpen(true)} className="gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Share your link
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border">
                  <CardHeader className="px-5 py-4 pb-0 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base font-semibold text-foreground">Recent Referrals</CardTitle>
                    <Link href="/portal/referrals" className="text-xs text-primary hover:underline flex items-center gap-0.5 font-medium">
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-0 mt-3">
                    <div className="divide-y divide-border">
                      {referrals.slice(0, 5).map((r) => (
                        <div key={r.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                              {r.displayName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{r.displayName}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(r.signedUpAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant="outline" className={`text-xs ${
                              r.qualification.status === 'qualified'
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                                : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                            }`}>
                              {r.qualification.label}
                            </Badge>
                            <span className="text-sm font-semibold tabular-nums text-foreground w-16 text-right">
                              {r.commission ? fmt(r.commission.amount) : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-border px-5 py-3">
                      <Link href="/portal/referrals" className="flex items-center justify-center gap-1.5 text-sm text-primary hover:underline font-medium">
                        View all {summary?.totalReferrals ?? 0} referrals <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* RIGHT sidebar (1/4) */}
            <div className="lg:col-span-1 space-y-4">

              {/* Next Steps */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="px-4 pt-4 pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" /> Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {[
                    { num: 1, text: 'Share your referral link on your social channels' },
                    { num: 2, text: 'Track signups in your referrals tab' },
                    { num: 3, text: 'Earn commission once they deposit' },
                  ].map(({ num, text }) => (
                    <div key={num} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{num}</div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
                    </div>
                  ))}
                  <Button size="sm" onClick={() => setShareOpen(true)} className="w-full h-8 text-xs mt-1 gap-1.5">
                    <Share2 className="w-3 h-3" /> Share Now
                  </Button>
                </CardContent>
              </Card>

              {/* Quick metrics */}
              <Card className="bg-card border-border">
                <CardHeader className="px-4 pt-4 pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold text-foreground">Quick Metrics</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {[
                    { label: 'Link Clicks',   value: (summary?.totalClicks ?? 0).toLocaleString(), icon: MousePointerClick },
                    { label: 'Conversions',   value: `${summary?.qualifiedReferrals ?? 0} / ${summary?.totalReferrals ?? 0}`, icon: TrendingUp },
                    { label: 'Click-to-Signup Rate',    value: `${convRate.toFixed(1)}%`, icon: Target },
                    { label: 'EPC',           value: fmt(epc), icon: Zap },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-base font-semibold tabular-nums text-foreground">{value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Referral links */}
              <Card className="bg-card border-border">
                <CardHeader className="px-4 pt-4 pb-2 space-y-0">
                  <CardTitle className="text-base font-semibold text-foreground">Your Links</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-medium tracking-wide">Full link</p>
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/60 border border-border px-3 py-2">
                      <p className="text-sm font-mono text-foreground truncate">{referralLink}</p>
                      <button
                        onClick={() => { navigator.clipboard.writeText(referralLink); toast.success('Link copied!'); }}
                        className="shrink-0 text-primary hover:text-primary/80 transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Campaign */}
              {affiliate?.campaign && (
                <Card className="bg-card border-border">
                  <CardHeader className="px-4 pt-4 pb-2 space-y-0 flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold text-foreground">Active Campaign</CardTitle>
                    {availableCampaigns.length > 1 && (
                      <button
                        onClick={() => setSwitcherOpen(true)}
                        className="text-xs text-primary hover:underline font-medium flex items-center gap-0.5"
                      >
                        Change <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2">
                    <p className="text-sm font-bold text-primary">{affiliate?.campaign?.name}</p>
                    {[
                      { label: 'Your rate',   value: affiliate?.campaign?.commissionType === 'FIXED' ? fmt(affiliate?.campaign?.commissionValue) : `${affiliate?.campaign?.commissionValue}%` },
                      { label: 'Min deposit', value: fmt(affiliate?.campaign?.minDepositAmount) },
                      { label: 'Hold',        value: `${affiliate?.campaign?.holdDays} days` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Commission history footer link */}
          <div className="flex items-center justify-between py-1">
            <p className="text-sm text-muted-foreground">
              {summary?.available ? <><span className="font-semibold text-primary">{fmt(summary.available)}</span> available for next payout</> : 'No commissions available yet'}
            </p>
            <Link href="/portal/commissions" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
              Commission history <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </>
      )}

      {/* Share modal */}
      <ShareSheet open={shareOpen} onClose={() => setShareOpen(false)} affiliateCode={affiliate?.affiliateCode ?? ''} referralLink={referralLink} />

      {/* Payout history sheet */}
      <Sheet open={payoutOpen} onOpenChange={setPayoutOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={`flex flex-col gap-0 p-0 bg-card border-border transition-all duration-300 ease-out ${isMobile ? 'h-auto max-h-[85vh] rounded-t-2xl' : 'w-full sm:max-w-md'}`}
        >
          <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
            <SheetTitle className="text-foreground">Payout History</SheetTitle>
            <p className="text-xs text-muted-foreground">A complete record of all your payouts</p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col items-center justify-center text-center gap-3">
            <Receipt className="w-8 h-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Payout history is shown in your full commission history.
            </p>
            <Link
              href="/portal/commissions"
              className="text-sm text-primary hover:underline font-medium flex items-center gap-1"
              onClick={() => setPayoutOpen(false)}
            >
              View commission history <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Campaign upgrade dialog — auto-shown when a better campaign is available */}
      {affiliate && isActive && (
        <CampaignUpgradeDialog
          affiliate={affiliate}
          availableCampaigns={availableCampaigns}
          onSwitched={handleCampaignSwitched}
        />
      )}

      {/* Campaign switcher sheet — manual, triggered by "Change" in campaign card */}
      {affiliate && isActive && (
        <CampaignSwitcherSheet
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          affiliate={affiliate}
          availableCampaigns={availableCampaigns}
          onSwitched={handleCampaignSwitched}
        />
      )}
    </div>
  );
}
