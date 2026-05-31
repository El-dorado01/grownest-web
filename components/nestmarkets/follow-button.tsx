"use client";

import { useState } from "react";
import { mutate as globalMutate } from "swr";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nestMarketsApi } from "@/lib/nestmarkets-api";

export function FollowButton({
  storeId, initialFollowing, onToggled, className,
}: { storeId: string; initialFollowing: boolean; onToggled?: (following: boolean) => void; className?: string }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    const next = !following;
    setFollowing(next);
    setBusy(true);
    const r = await nestMarketsApi.followStore(storeId);
    setBusy(false);
    if (r.error || !r.data?.success) {
      setFollowing(!next);
      return toast.error(r.error || "Could not update follow");
    }
    const actual = r.data.followed;
    setFollowing(actual);
    onToggled?.(actual);
    globalMutate(["nestmarket-followed"]);
    globalMutate(["nestmarket-store", storeId]);
  };

  return (
    <Button onClick={toggle} disabled={busy} variant={following ? "outline" : "default"} className={className}>
      <Heart className={cn("size-4", following && "fill-primary text-primary")} />
      {following ? "Following" : "Follow"}
    </Button>
  );
}
