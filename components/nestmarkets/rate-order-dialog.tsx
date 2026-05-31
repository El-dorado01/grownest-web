"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function RateOrderDialog({
  orderId, open, onOpenChange, onRated,
}: { orderId: string; open: boolean; onOpenChange: (o: boolean) => void; onRated: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (rating < 1) return toast.error("Pick a star rating");
    setBusy(true);
    const r = await nestMarketsApi.rateOrder(orderId, rating, review.trim() || undefined);
    setBusy(false);
    if (r.error || !r.data?.success) return toast.error(r.error || r.data?.message || "Could not submit rating");
    toast.success("Thanks for your review!");
    onOpenChange(false);
    onRated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Rate your order</DialogTitle></DialogHeader>
        <div className="flex justify-center gap-1 py-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)}>
              <Star className={cn("size-8", (hover || rating) >= n ? "fill-primary text-primary" : "text-muted-foreground")} />
            </button>
          ))}
        </div>
        <Textarea value={review} onChange={(e) => setReview(e.target.value)} maxLength={500} placeholder="Share details about your experience (optional)" />
        <Button onClick={submit} disabled={busy} className="w-full">Submit rating</Button>
      </DialogContent>
    </Dialog>
  );
}
