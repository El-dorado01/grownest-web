// app/savings/campaigns/[id]/page.tsx
"use client";

import * as React from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { DashboardHeader } from "@/components/dashboard-header";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Wallet, Package, TrendingUp, Clock, ShieldAlert, CalendarDays,
  Users, ArrowRight, Check, Loader2, AlertTriangle, MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { campaignApi } from "@/lib/campaign-api";
import { api } from "@/lib/api";
import type { NestEggCampaign } from "@/types/campaign";
import type { DeliveryProfile, DeliveryProfilesResponse } from "@/types/nestbaskets";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const freqLabel: Record<string, string> = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly" };

// ─── Join modal ──────────────────────────────────────────────────────────────
function JoinCampaignModal({
  open, onClose, campaign, onJoined,
}: { open: boolean; onClose: () => void; campaign: NestEggCampaign; onJoined: () => void }) {
  const isGoods = campaign.payoutType === "GOODS";
  const [step, setStep] = React.useState(0);
  const [selectedProfile, setSelectedProfile] = React.useState<string>("");
  const [joining, setJoining] = React.useState(false);

  const { data: profilesRes, isLoading: profilesLoading } = useSWR(
    open && isGoods ? "delivery-profiles" : null,
    () => api.get<DeliveryProfilesResponse>("/api/nesttrails/delivery-profiles"),
  );
  const profiles: DeliveryProfile[] = profilesRes?.data?.data ?? [];

  React.useEffect(() => {
    if (profiles.length && !selectedProfile) {
      const def = profiles.find((p) => p.isDefault) ?? profiles[0];
      setSelectedProfile(def.id);
    }
  }, [profiles, selectedProfile]);

  const firstDebit = new Date(
    new Date(campaign.startDate) > new Date() ? campaign.startDate : Date.now(),
  ).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  const doJoin = async () => {
    setJoining(true);
    const res = await campaignApi.join(campaign.id, isGoods ? selectedProfile : undefined);
    setJoining(false);
    if (res.error) { toast.error(res.error || "Failed to join"); return; }
    toast.success(`You've joined ${campaign.title}!`);
    onJoined();
    onClose();
  };

  const RulesSummary = (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        You&apos;re committing to save{" "}
        <span className="font-semibold text-foreground">
          {fmt(campaign.contributionAmount)} {freqLabel[campaign.frequency]}
        </span>{" "}
        until {new Date(campaign.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.
      </p>
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
        <div className="flex justify-between"><span className="text-muted-foreground">First debit</span><span className="font-medium">{firstDebit}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Interest at end</span><span className="font-medium">{campaign.interestRate}%</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Early exit penalty</span><span className="font-medium">{campaign.penaltyRate}%</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Payout</span><span className="font-medium">{isGoods ? campaign.goodsDescription ?? "Goods" : "Cash to NestPurse"}</span></div>
      </div>
      <p className="text-xs text-muted-foreground">
        Contributions are auto-debited from your NestPurse. Keep it topped up to avoid removal.
      </p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !joining && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isGoods && step === 1 ? "Choose delivery address" : `Join ${campaign.title}`}</DialogTitle>
        </DialogHeader>

        {(!isGoods || step === 0) && RulesSummary}

        {isGoods && step === 1 && (
          <div className="space-y-2">
            {profilesLoading ? (
              <Skeleton className="h-20 w-full rounded-xl" />
            ) : profiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No saved addresses. Add one in your delivery settings first.
              </div>
            ) : (
              profiles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProfile(p.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    selectedProfile === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  }`}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">{p.fullName}</p>
                    <p className="text-xs text-muted-foreground">{p.address}, {p.city}, {p.state}</p>
                  </div>
                  {selectedProfile === p.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                </button>
              ))
            )}
          </div>
        )}

        <DialogFooter>
          {isGoods ? (
            step === 0 ? (
              <Button className="w-full gap-1.5" onClick={() => setStep(1)}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <div className="flex w-full gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)} disabled={joining}>Back</Button>
                <Button className="flex-1 gap-1.5" onClick={doJoin} disabled={joining || !selectedProfile}>
                  {joining && <Loader2 className="h-4 w-4 animate-spin" />} Confirm & Join
                </Button>
              </div>
            )
          ) : (
            <Button className="w-full gap-1.5" onClick={doJoin} disabled={joining}>
              {joining && <Loader2 className="h-4 w-4 animate-spin" />} Join Campaign
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Leave dialog ────────────────────────────────────────────────────────────
function LeaveDialog({
  open, onClose, campaign, onLeft,
}: { open: boolean; onClose: () => void; campaign: NestEggCampaign; onLeft: () => void }) {
  const saved = campaign.myMembership?.savedAmount ?? 0;
  const penalty = Math.round((saved * campaign.penaltyRate) / 100);
  const net = saved - penalty;
  const [leaving, setLeaving] = React.useState(false);

  const doLeave = async () => {
    setLeaving(true);
    const res = await campaignApi.leave(campaign.id);
    setLeaving(false);
    if (res.error) { toast.error(res.error || "Failed to leave"); return; }
    toast.success(`${fmt(net)} sent to your NestPurse`);
    onLeft();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !leaving && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Leave {campaign.title}?</DialogTitle>
        </DialogHeader>
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm space-y-1.5">
          <div className="flex justify-between"><span className="text-muted-foreground">Saved so far</span><span className="font-medium">{fmt(saved)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Penalty ({campaign.penaltyRate}%)</span><span className="font-medium text-rose-600">-{fmt(penalty)}</span></div>
          <div className="flex justify-between border-t border-border pt-1.5"><span className="font-medium">You&apos;ll receive</span><span className="font-bold text-primary">{fmt(net)}</span></div>
        </div>
        <DialogFooter>
          <div className="flex w-full gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={leaving}>Stay</Button>
            <Button variant="destructive" className="flex-1 gap-1.5" onClick={doLeave} disabled={leaving}>
              {leaving && <Loader2 className="h-4 w-4 animate-spin" />} Leave Campaign
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Rule row ────────────────────────────────────────────────────────────────
function RuleRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex flex-1 items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium text-foreground">{value}</span>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: res, isLoading, mutate } = useSWR(`campaign-${id}`, () => campaignApi.get(id));
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  const campaign = res?.data?.data;
  const membership = campaign?.myMembership;
  const joined = membership && membership.status === "ACTIVE";

  const now = new Date();
  // Join deadline is inclusive through the END of that calendar day.
  const joinDeadlineEnd = campaign
    ? (() => { const d = new Date(campaign.joinDeadline); d.setHours(23, 59, 59, 999); return d; })()
    : null;
  const canJoin =
    campaign &&
    !joined &&
    ["DRAFT", "ACTIVE"].includes(campaign.status) &&
    joinDeadlineEnd! >= now &&
    !(campaign.maxMembers != null && campaign.memberCount >= campaign.maxMembers);

  const full = campaign?.maxMembers != null && campaign.memberCount >= campaign.maxMembers;
  const deadlinePassed = joinDeadlineEnd != null && joinDeadlineEnd < now;

  // Time progress
  const progressPct = campaign
    ? Math.min(100, Math.max(0, Math.round(
        ((now.getTime() - new Date(campaign.startDate).getTime()) /
          (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime())) * 100,
      )))
    : 0;

  const graceDaysLeft = (() => {
    if (!membership?.gracePeriodStartedAt || !campaign) return null;
    const expiry = new Date(membership.gracePeriodStartedAt);
    expiry.setDate(expiry.getDate() + campaign.gracePeriodDays);
    return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000));
  })();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbLink href="/savings/campaigns">Campaigns</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem><BreadcrumbPage>{campaign?.title ?? "Campaign"}</BreadcrumbPage></BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 md:p-6">
          {isLoading ? (
            <>
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </>
          ) : !campaign ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Campaign not found.</div>
          ) : (
            <>
              {/* Cover */}
              <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5">
                {campaign.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={campaign.coverImage} alt={campaign.title} className="h-full w-full object-cover" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">{campaign.category}</Badge>
                    <Badge className="gap-1 border border-white/30 bg-white/20 text-[10px] text-white backdrop-blur">
                      {campaign.payoutType === "GOODS" ? <Package className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
                      {campaign.payoutType === "GOODS" ? "Goods" : "Cash"}
                    </Badge>
                  </div>
                  <h1 className="mt-1.5 text-xl font-bold text-white drop-shadow">{campaign.title}</h1>
                </div>
              </div>

              {campaign.description && (
                <p className="text-sm leading-relaxed text-muted-foreground">{campaign.description}</p>
              )}

              {/* Grace warning */}
              {joined && graceDaysLeft !== null && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      Top up your NestPurse — {graceDaysLeft} day{graceDaysLeft === 1 ? "" : "s"} left
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Your last contribution failed. Top up before the grace period ends or you&apos;ll be removed.
                    </p>
                  </div>
                </div>
              )}

              {/* My progress */}
              {joined && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">Your savings</p>
                  <p className="mt-0.5 text-3xl font-bold text-foreground">{fmt(membership!.savedAmount)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Next: {fmt(campaign.contributionAmount)} on{" "}
                    {new Date(membership!.nextContributionDate).toLocaleDateString("en-NG", { day: "numeric", month: "long" })}
                  </p>
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all" style={{ width: `${progressPct}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                    <span>Started</span><span>{progressPct}% through</span><span>Ends</span>
                  </div>
                  <button
                    onClick={() => setLeaveOpen(true)}
                    className="mt-4 w-full text-center text-xs text-muted-foreground transition-colors hover:text-rose-600"
                  >
                    Leave campaign
                  </button>
                </div>
              )}

              {/* Rules */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="mb-1 text-sm font-semibold text-foreground">Campaign rules</h2>
                <div className="divide-y divide-border">
                  <RuleRow icon={Wallet} label="Contribution" value={`${fmt(campaign.contributionAmount)} ${freqLabel[campaign.frequency]}`} />
                  <RuleRow icon={CalendarDays} label="Duration" value={`${new Date(campaign.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} – ${new Date(campaign.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "2-digit" })}`} />
                  <RuleRow icon={TrendingUp} label="Interest at end" value={`${campaign.interestRate}%`} />
                  <RuleRow icon={ShieldAlert} label="Early exit penalty" value={`${campaign.penaltyRate}%`} />
                  <RuleRow icon={Clock} label="Grace period" value={`${campaign.gracePeriodDays} days`} />
                  <RuleRow icon={campaign.payoutType === "GOODS" ? Package : Wallet} label="Payout" value={campaign.payoutType === "GOODS" ? campaign.goodsDescription ?? "Goods" : "Cash to NestPurse"} />
                  <RuleRow icon={Users} label="Members" value={campaign.maxMembers != null ? `${campaign.memberCount}/${campaign.maxMembers}` : `${campaign.memberCount} joined`} />
                  {campaign.totalPot != null && (
                    <RuleRow icon={TrendingUp} label="Total pot" value={fmt(campaign.totalPot)} />
                  )}
                </div>
              </div>

              {/* CTA */}
              {!joined && (
                <div className="sticky bottom-4">
                  {canJoin ? (
                    <Button size="lg" className="w-full" onClick={() => setJoinOpen(true)}>Join Campaign</Button>
                  ) : full ? (
                    <Button size="lg" className="w-full" disabled>Campaign Full</Button>
                  ) : deadlinePassed ? (
                    <Button size="lg" className="w-full" disabled>Join Deadline Passed</Button>
                  ) : (
                    <Button size="lg" className="w-full" disabled>Not Available</Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </SidebarInset>

      {campaign && (
        <>
          <JoinCampaignModal open={joinOpen} onClose={() => setJoinOpen(false)} campaign={campaign} onJoined={() => mutate()} />
          <LeaveDialog open={leaveOpen} onClose={() => setLeaveOpen(false)} campaign={campaign}
            onLeft={() => { mutate(); router.push("/savings/campaigns"); }} />
        </>
      )}
    </SidebarProvider>
  );
}
