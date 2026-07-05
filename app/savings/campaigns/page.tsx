// app/savings/campaigns/page.tsx
"use client";

import * as React from "react";
import useSWR from "swr";
import { DashboardHeader } from "@/components/dashboard-header";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Wallet, Sparkles, TrendingUp, Search } from "lucide-react";
import { campaignApi } from "@/lib/campaign-api";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { MyCampaignCard } from "@/components/campaigns/MyCampaignCard";
import { cn } from "@/lib/utils";
import type { NestEggCampaign, CampaignMembership } from "@/types/campaign";

const fmtN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", notation: "compact", maximumFractionDigits: 1 }).format(n);

type Filter = "all" | "active" | "upcoming" | "cash" | "goods";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "cash", label: "Cash" },
  { key: "goods", label: "Goods" },
];

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <Skeleton className="h-5 w-1/2 rounded-md" />
        <div className="mt-auto flex items-center justify-between pt-2">
          <Skeleton className="h-3 w-20 rounded-md" />
          <Skeleton className="h-3 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function MyCampaignSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-auto w-28 rounded-none sm:w-36" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-4 w-2/3 rounded-md" />
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-1/3 rounded-md" />
      </div>
    </div>
  );
}

export default function CampaignsBrowsePage() {
  const { data: res, isLoading } = useSWR("campaigns-list", () => campaignApi.list());
  const { data: mineRes, isLoading: mineLoading } = useSWR("campaigns-mine", () => campaignApi.mine());
  const [filter, setFilter] = React.useState<Filter>("all");

  const campaigns: NestEggCampaign[] = res?.data?.data ?? [];
  const myCampaigns: CampaignMembership[] = mineRes?.data?.data ?? [];
  const activeMine = myCampaigns.filter((m) => m.status === "ACTIVE" || m.status === "COMPLETED");

  const filtered = campaigns.filter((c) => {
    const now = new Date();
    if (filter === "active") return c.status === "ACTIVE" && new Date(c.startDate) <= now;
    if (filter === "upcoming") return new Date(c.startDate) > now;
    if (filter === "cash") return c.payoutType === "CASH";
    if (filter === "goods") return c.payoutType === "GOODS";
    return true;
  });

  // Aggregate stats for the hero banner
  const now = new Date();
  const activeCount = campaigns.filter((c) => c.status === "ACTIVE" && new Date(c.startDate) <= now).length;
  const totalPot = campaigns.reduce((sum, c) => sum + (c.totalPot ?? 0), 0);
  const totalMembers = campaigns.reduce((sum, c) => sum + c.memberCount, 0);
  const myTotalSaved = activeMine.reduce((sum, m) => sum + m.savedAmount, 0);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Campaigns</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 xl:p-8">
          {/* Hero */}
          <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/25 via-primary/10 to-background p-6 md:p-10">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
              aria-hidden
            />
            <div className="relative flex flex-col gap-6 2xl:flex-row 2xl:items-end 2xl:justify-between">
              <div className="min-w-0 max-w-xl space-y-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> Nest Egg Campaigns
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Save together, earn more.
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  Join a community campaign, commit to a savings rhythm, and walk away with interest, rewards,
                  or goods — all backed by your NestPurse.
                </p>
              </div>

              {/* Stat tiles */}
              <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 2xl:w-auto">
                {[
                  { icon: TrendingUp, label: "Active campaigns", value: isLoading ? null : String(activeCount) },
                  { icon: Wallet, label: "Total pot", value: isLoading ? null : fmtN(totalPot) },
                  { icon: Users, label: "Members joined", value: isLoading ? null : String(totalMembers) },
                  { icon: Sparkles, label: "You've saved", value: mineLoading ? null : fmtN(myTotalSaved) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col gap-1.5 rounded-2xl border border-white/40 bg-background/70 p-3.5 shadow-sm backdrop-blur-sm dark:border-white/10"
                  >
                    <s.icon className="h-4 w-4 text-primary" />
                    {s.value === null ? (
                      <Skeleton className="h-5 w-14 rounded-md" />
                    ) : (
                      <span className="text-lg font-bold leading-none text-foreground">{s.value}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* My campaigns */}
          {(mineLoading || activeMine.length > 0) && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">My campaigns</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mineLoading
                  ? Array.from({ length: 2 }).map((_, i) => <MyCampaignSkeleton key={i} />)
                  : activeMine.map((m) => <MyCampaignCard key={m.id} membership={m} />)}
              </div>
            </div>
          )}

          {/* Discover section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-foreground">Discover campaigns</h2>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      filter === f.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
                <Search className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No campaigns match this filter. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((c) => (
                  <CampaignCard key={c.id} campaign={c} />
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
