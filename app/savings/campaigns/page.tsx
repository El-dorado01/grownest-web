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
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { campaignApi } from "@/lib/campaign-api";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { cn } from "@/lib/utils";
import type { NestEggCampaign, CampaignMembership } from "@/types/campaign";

const fmtN = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const MEMBER_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EXITED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  KICKED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

type Filter = "all" | "active" | "upcoming" | "cash" | "goods";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "upcoming", label: "Upcoming" },
  { key: "cash", label: "Cash" },
  { key: "goods", label: "Goods" },
];

export default function CampaignsBrowsePage() {
  const { data: res, isLoading } = useSWR("campaigns-list", () => campaignApi.list());
  const { data: mineRes } = useSWR("campaigns-mine", () => campaignApi.mine());
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

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Savings Campaigns</h1>
            <p className="text-sm text-muted-foreground">
              Join a community campaign, save towards a shared goal, and earn interest or rewards.
            </p>
          </div>

          {/* My campaigns */}
          {activeMine.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">My campaigns</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeMine.map((m) => {
                  const grace = m.status === "ACTIVE" && m.gracePeriodStartedAt;
                  return (
                    <Link
                      key={m.id}
                      href={`/savings/campaigns/${m.campaignId}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-foreground">{m.campaign?.title ?? "Campaign"}</p>
                          {grace && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">Saved {fmtN(m.savedAmount)}</p>
                      </div>
                      <Badge className={`shrink-0 text-[10px] ${MEMBER_STATUS_STYLE[m.status] ?? ""}`}>{m.status}</Badge>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
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

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No campaigns available right now. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
