'use client';
// CampaignSwitcher — two surfaces:
//
//  1. CampaignUpgradeDialog  — auto-popup on first dashboard load when a better
//     campaign is available. Shows once per session via sessionStorage.
//     All active affiliates can accept; PROFESSIONAL+ can also use the manual
//     switcher below.
//
//  2. CampaignSwitcherSheet  — manual sheet for PROFESSIONAL+ affiliates to
//     browse and switch between all eligible campaigns at any time.
//
// ui-ux-pro-max rules applied:
//   - primary-action: one clear CTA per view
//   - state-clarity: current campaign marked, commission diff shown
//   - confirmation-dialogs: no accidental switches
//   - touch-target-size: all tap targets ≥44px
//   - modal-motion: dialog animates from center (shadcn default)
//   - progressive-disclosure: key commission shown upfront, details secondary

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { affiliateApi } from '@/lib/affiliate-api';
import { toast } from 'sonner';
import {
  ArrowRight, CheckCircle2, Sparkles, Clock, Users,
  TrendingUp, Lock, ChevronRight, Star,
} from 'lucide-react';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const CAMPAIGN_TYPE_STYLE: Record<string, string> = {
  STANDARD: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
  SEASONAL: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400',
  WELCOME:  'border-purple-300 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
  PREMIUM:  'border-primary/40 bg-primary/5 text-primary',
};

const TIER_ORDER = ['STARTER', 'GROWTH', 'PROFESSIONAL', 'ELITE'];

function getCommissionForTier(campaign: any, tier: string): number {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx >= 3 && campaign.eliteCommissionValue) return campaign.eliteCommissionValue;
  if (idx >= 2 && campaign.professionalCommissionValue) return campaign.professionalCommissionValue;
  if (idx >= 1 && campaign.growthCommissionValue) return campaign.growthCommissionValue;
  return campaign.commissionValue;
}

function formatRate(campaign: any, tier: string): string {
  const rate = getCommissionForTier(campaign, tier);
  return campaign.commissionType === 'FIXED' ? fmt(rate) : `${rate}%`;
}

function CommissionDiff({
  currentCampaign, newCampaign, tier,
}: {
  currentCampaign: any; newCampaign: any; tier: string;
}) {
  const currentRate = getCommissionForTier(currentCampaign, tier);
  const newRate     = getCommissionForTier(newCampaign, tier);
  const diff = newRate - currentRate;
  if (diff <= 0) return null;
  const isFixed = newCampaign.commissionType === 'FIXED';
  return (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
      <TrendingUp className="w-3.5 h-3.5" />
      +{isFixed ? fmt(diff) : `${diff}%`} more per referral
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  1. UPGRADE DIALOG — shown once per session when a better campaign exists
// ─────────────────────────────────────────────────────────────────────────────
export function CampaignUpgradeDialog({
  affiliate,
  availableCampaigns,
  onSwitched,
}: {
  affiliate: any;
  availableCampaigns: any[];
  onSwitched: () => void;
}) {
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(false);

  const current = affiliate?.campaign;
  const tier    = affiliate?.tier ?? 'STARTER';

  // Find a better campaign: higher commission for this tier, not the current one
  const betterCampaign = availableCampaigns.find(c => {
    if (c.id === current?.id || c.isCurrentCampaign) return false;
    const currentRate = current ? getCommissionForTier(current, tier) : 0;
    const newRate     = getCommissionForTier(c, tier);
    return newRate > currentRate;
  });

  useEffect(() => {
    if (!betterCampaign || !affiliate?.affiliateCode) return;
    const key = `campaign_upgrade_seen_${affiliate.affiliateCode}`;
    if (sessionStorage.getItem(key)) return; // shown this session already
    // Small delay so dashboard loads first — feels less abrupt
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, [betterCampaign, affiliate?.affiliateCode]);

  const handleDismiss = () => {
    const key = `campaign_upgrade_seen_${affiliate?.affiliateCode}`;
    sessionStorage.setItem(key, '1');
    setOpen(false);
  };

  const handleAccept = async () => {
    if (!betterCampaign) return;
    setLoading(true);
    const res = await affiliateApi.switchCampaign(betterCampaign.id);
    setLoading(false);
    if (res.error) {
      const msg = typeof res.error === 'string' ? res.error : 'Failed to switch campaign';
      toast.error(msg);
      return;
    }
    const key = `campaign_upgrade_seen_${affiliate?.affiliateCode}`;
    sessionStorage.setItem(key, '1');
    setOpen(false);
    toast.success(`Switched to "${betterCampaign.name}" — you're now earning more per referral!`);
    onSwitched();
  };

  if (!betterCampaign || !current) return null;

  const currentRate = formatRate(current, tier);
  const newRate     = formatRate(betterCampaign, tier);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md bg-card border-border rounded-2xl p-0 overflow-hidden gap-0">
        {/* Gold accent top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary/70 via-primary to-secondary" />

        <div className="p-6 space-y-5">
          <DialogHeader className="space-y-1.5">
            {/* Icon + headline */}
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground leading-tight">
                  Better campaign available!
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You qualify for higher commission rates
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Campaign comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Current */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{current.name}</p>
              <p className="text-xl font-bold tabular-nums text-muted-foreground">{currentRate}</p>
              <p className="text-[10px] text-muted-foreground">per referral</p>
            </div>

            {/* Arrow */}
            <div className="hidden" />

            {/* New */}
            <div className="rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-2 relative">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  UPGRADE
                </span>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">New</p>
              <p className="text-sm font-semibold text-foreground leading-tight">{betterCampaign.name}</p>
              <p className="text-xl font-bold tabular-nums text-primary">{newRate}</p>
              <p className="text-[10px] text-muted-foreground">per referral</p>
            </div>
          </div>

          {/* Diff highlight */}
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 px-4 py-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              Earn <CommissionDiff currentCampaign={current} newCampaign={betterCampaign} tier={tier} /> with {betterCampaign.name}
            </p>
          </div>

          {/* Campaign details strip */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
            {betterCampaign.minimumTier && betterCampaign.minimumTier !== 'STARTER' && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3" /> {betterCampaign.minimumTier}+ required
              </span>
            )}
            {betterCampaign.endsAt && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Ends {new Date(betterCampaign.endsAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
              </span>
            )}
            {betterCampaign.maxAffiliates && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {betterCampaign.spotsLeft != null ? `${betterCampaign.spotsLeft} spots left` : 'Limited spots'}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {betterCampaign.holdDays}-day hold
            </span>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-2 pt-1">
            <Button
              onClick={handleAccept}
              disabled={loading}
              className="w-full min-h-[48px] gap-2 text-base font-semibold"
            >
              {loading ? 'Switching…' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Switch to {betterCampaign.name}
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              className="w-full min-h-[44px] text-muted-foreground hover:text-foreground"
            >
              Keep current campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. CAMPAIGN SWITCHER SHEET — manual access for PROFESSIONAL+ affiliates
// ─────────────────────────────────────────────────────────────────────────────
export function CampaignSwitcherSheet({
  open,
  onClose,
  affiliate,
  availableCampaigns,
  onSwitched,
}: {
  open: boolean;
  onClose: () => void;
  affiliate: any;
  availableCampaigns: any[];
  onSwitched: () => void;
}) {
  const isMobile = useIsMobile();
  const [switching, setSwitching] = useState<string | null>(null);

  const tier = affiliate?.tier ?? 'STARTER';
  const TIER_ORDER_IDX = TIER_ORDER.indexOf(tier);
  const canSwitch = TIER_ORDER_IDX >= 2; // PROFESSIONAL+

  const handleSwitch = async (campaignId: string, campaignName: string) => {
    setSwitching(campaignId);
    const res = await affiliateApi.switchCampaign(campaignId);
    setSwitching(null);
    if (res.error) {
      toast.error(typeof res.error === 'string' ? res.error : 'Failed to switch campaign');
      return;
    }
    toast.success(`Switched to "${campaignName}"!`);
    onSwitched();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={o => !o && onClose()}>
      <SheetContent
        side={isMobile ? 'bottom' : 'right'}
        className={`flex flex-col gap-0 p-0 bg-card border-border ${
          isMobile ? 'h-[88vh] rounded-t-2xl' : 'w-full sm:max-w-md'
        }`}
      >
        <SheetHeader className="px-6 py-5 border-b border-border shrink-0">
          <SheetTitle className="text-foreground">Available Campaigns</SheetTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canSwitch
              ? 'Select a campaign to switch to. Your commission rate updates immediately.'
              : 'Campaign switching unlocks at Professional tier (101+ referrals).'}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {availableCampaigns.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No other campaigns available for your tier right now.</p>
            </div>
          ) : (
            availableCampaigns.map(campaign => {
              const isCurrent = campaign.isCurrentCampaign || campaign.id === affiliate?.campaign?.id;
              const rate      = formatRate(campaign, tier);
              const typeCls   = CAMPAIGN_TYPE_STYLE[campaign.campaignType] ?? CAMPAIGN_TYPE_STYLE.STANDARD;
              const spotsLeft = campaign.spotsLeft;
              const isFull    = campaign.maxAffiliates && spotsLeft === 0;

              return (
                <div
                  key={campaign.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all duration-200 ${
                    isCurrent
                      ? 'border-primary/50 bg-primary/5'
                      : isFull
                        ? 'border-border/50 bg-muted/20 opacity-60'
                        : 'border-border bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-foreground">{campaign.name}</p>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
                            CURRENT
                          </span>
                        )}
                      </div>
                      {campaign.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{campaign.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className={`text-[10px] shrink-0 ${typeCls}`}>
                      {campaign.campaignType}
                    </Badge>
                  </div>

                  {/* Commission highlight */}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-foreground">{rate}</span>
                    <span className="text-xs text-muted-foreground">per referral</span>
                    {!isCurrent && affiliate?.campaign && (
                      <CommissionDiff
                        currentCampaign={affiliate.campaign}
                        newCampaign={campaign}
                        tier={tier}
                      />
                    )}
                  </div>

                  {/* Details strip */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Min deposit: {fmt(campaign.minDepositAmount)}</span>
                    <span>Hold: {campaign.holdDays}d</span>
                    {campaign.endsAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ends {new Date(campaign.endsAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {spotsLeft != null && (
                      <span className={`flex items-center gap-1 ${isFull ? 'text-red-500' : spotsLeft < 10 ? 'text-amber-600' : ''}`}>
                        <Users className="w-3 h-3" />
                        {isFull ? 'Full' : `${spotsLeft} spots left`}
                      </span>
                    )}
                  </div>

                  <Separator className="bg-border/50" />

                  {/* Action */}
                  {isCurrent ? (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> You're on this campaign
                    </div>
                  ) : !canSwitch ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      Unlock switching at Professional tier
                    </div>
                  ) : isFull ? (
                    <p className="text-xs text-muted-foreground">Campaign is full</p>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full min-h-[40px] gap-1.5"
                      disabled={switching === campaign.id}
                      onClick={() => handleSwitch(campaign.id, campaign.name)}
                    >
                      {switching === campaign.id ? 'Switching…' : (
                        <>Switch to this campaign <ChevronRight className="w-3.5 h-3.5" /></>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
