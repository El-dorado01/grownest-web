"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { campaignApi } from "@/lib/campaign-api";
import type { NestEggCampaign } from "@/types/campaign";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
const freqLabel: Record<string, string> = { DAILY: "daily", WEEKLY: "weekly", MONTHLY: "monthly" };

const SEEN_PREFIX = "campaign_announced_";

/**
 * Announces the most recently published campaign the user hasn't joined
 * and hasn't already been shown. Shown at most once per campaign, ever.
 */
export function NewCampaignAnnouncement() {
  const router = useRouter();
  const [campaign, setCampaign] = useState<NestEggCampaign | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await campaignApi.list();
      if (cancelled || res.error || !res.data) return;

      const candidates = res.data.data
        .filter((c) => !c.myMembership)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const next = candidates[0];
      if (!next) return;

      const seenKey = `${SEEN_PREFIX}${next.id}`;
      if (localStorage.getItem(seenKey)) return;
      localStorage.setItem(seenKey, "1");

      setCampaign(next);
      setOpen(true);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      confetti({ particleCount: 100, spread: 65, origin: { y: 0.4 }, colors: ["#cca751", "#b89543", "#8a6d2f"] });
    }, 250);
    return () => clearTimeout(timer);
  }, [open]);

  if (!campaign) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 [&>button]:hidden">
        <div className="relative h-40 w-full bg-gradient-to-br from-primary/30 to-primary/10">
          {campaign.coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={campaign.coverImage} alt={campaign.title} className="h-full w-full object-cover" />
          )}
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
            NEW CAMPAIGN
          </span>
          <button
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/45 text-white transition-colors hover:bg-black/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h2 className="text-lg font-bold text-foreground">{campaign.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              Join this campaign and save {fmt(campaign.contributionAmount)} {freqLabel[campaign.frequency]} —{" "}
              {campaign.payoutType === "GOODS"
                ? `win ${campaign.goodsDescription ?? "rewards"}`
                : `earn ${campaign.interestRate}% interest`}{" "}
              at the end.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Maybe later
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setOpen(false);
                router.push(`/savings/campaigns/${campaign.id}`);
              }}
            >
              View Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
