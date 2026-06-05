"use client";

import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { MarketReview } from "@/types/nestmarkets";

export function StoreReviews({
  reviews, isLoading, page, pages, onPage,
}: {
  reviews: MarketReview[]; isLoading: boolean; page: number; pages: number; onPage: (p: number) => void;
}) {
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>;
  if (reviews.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">No reviews yet</p>;
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-muted overflow-hidden shrink-0">
              {r.buyer.profilePhoto && <img src={r.buyer.profilePhoto} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{r.buyer.fullName ?? "GrowNest user"}</p>
              {r.createdAt && <p className="text-[11px] text-muted-foreground">{format(new Date(r.createdAt), "d MMM yyyy")}</p>}
            </div>
            <span className="ml-auto flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              <Star className="size-3 fill-primary text-primary" />{r.rating}
            </span>
          </div>
          {r.review && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{r.review}</p>}
        </div>
      ))}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft className="size-4" /></Button>
          <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
          <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => onPage(page + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      )}
    </div>
  );
}
