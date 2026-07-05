"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, Wallet } from "lucide-react";
import type { CampaignMembership } from "@/types/campaign";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

const MEMBER_STATUS_STYLE: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EXITED: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  KICKED: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function MyCampaignCard({ membership: m }: { membership: CampaignMembership }) {
  const campaign = m.campaign;
  const grace = m.status === "ACTIVE" && !!m.gracePeriodStartedAt;
  const isGoods = campaign?.payoutType === "GOODS";

  const now = new Date();
  const progressPct = campaign
    ? Math.min(100, Math.max(0, Math.round(
        ((now.getTime() - new Date(campaign.startDate).getTime()) /
          (new Date(campaign.endDate).getTime() - new Date(campaign.startDate).getTime())) * 100,
      )))
    : 0;

  return (
    <Link
      href={`/savings/campaigns/${m.campaignId}`}
      className="group relative flex overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
    >
      {/* Thumbnail */}
      <div className="relative h-auto w-28 shrink-0 overflow-hidden bg-gradient-to-br from-primary/25 to-primary/5 sm:w-36">
        {campaign?.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={campaign.coverImage}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute left-2 top-2">
          <Badge className="gap-1 border border-white/30 bg-black/40 text-[10px] text-white backdrop-blur">
            {isGoods ? <Package className="h-3 w-3" /> : <Wallet className="h-3 w-3" />}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{campaign?.title ?? "Campaign"}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Saved <span className="font-medium text-foreground">{fmt(m.savedAmount)}</span>
            </p>
          </div>
          <Badge className={`shrink-0 text-[10px] ${MEMBER_STATUS_STYLE[m.status] ?? ""}`}>{m.status}</Badge>
        </div>

        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {grace ? (
          <p className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3 shrink-0" /> Grace period active — top up now
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">{progressPct}% through campaign</p>
        )}
      </div>
    </Link>
  );
}
