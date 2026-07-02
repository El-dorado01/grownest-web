"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Package, Wallet } from "lucide-react";
import type { NestEggCampaign } from "@/types/campaign";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const freqLabel: Record<string, string> = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly" };

function statusChip(c: NestEggCampaign): { label: string; className: string } | null {
  const now = new Date();
  const start = new Date(c.startDate);
  const end = new Date(c.endDate);
  const full = c.maxMembers != null && c.memberCount >= c.maxMembers;
  if (full) return { label: "Full", className: "bg-muted text-muted-foreground" };
  if (start > now) return { label: "Upcoming", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
  const days = (end.getTime() - now.getTime()) / 86400000;
  if (days <= 7 && days > 0) return { label: "Ending soon", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" };
  return { label: "Active", className: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" };
}

export function CampaignCard({ campaign }: { campaign: NestEggCampaign }) {
  const chip = statusChip(campaign);
  const isGoods = campaign.payoutType === "GOODS";
  const slots =
    campaign.maxMembers != null
      ? `${campaign.memberCount}/${campaign.maxMembers} slots`
      : "Open";

  return (
    <Link
      href={`/savings/campaigns/${campaign.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-md"
    >
      {/* Cover */}
      <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
        {campaign.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={campaign.coverImage} alt={campaign.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="text-[10px] font-medium backdrop-blur">
            {campaign.category}
          </Badge>
        </div>
        <div className="absolute right-3 top-3">
          <Badge className="gap-1 text-[10px] font-medium backdrop-blur bg-background/80 text-foreground border border-border">
            {isGoods ? <Package className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
            {isGoods ? "Goods" : "Cash"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-foreground line-clamp-2">{campaign.title}</h3>
          {chip && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${chip.className}`}>
              {chip.label}
            </span>
          )}
        </div>

        <p className="text-lg font-bold text-primary">
          {fmt(campaign.contributionAmount)}
          <span className="text-xs font-normal text-muted-foreground"> / {freqLabel[campaign.frequency]}</span>
        </p>

        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(campaign.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })} –{" "}
            {new Date(campaign.endDate).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {slots}
          </span>
        </div>
      </div>
    </Link>
  );
}
