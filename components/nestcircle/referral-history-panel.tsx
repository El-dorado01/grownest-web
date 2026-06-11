"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Users2, Coins, CheckCircle2, Clock, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { NestCircleData, CircleMember, PointTransaction } from "@/lib/nestcircle-api"

interface ReferralHistoryPanelProps {
  circleData: NestCircleData
  getTransactionLabel: (reason: string) => { label: string; color: string; sign: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReferralHistoryPanel({
  circleData,
  getTransactionLabel,
  open,
  onOpenChange,
}: ReferralHistoryPanelProps) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = React.useState<"circle" | "ledger">("circle")

  const content = (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 py-2 text-left">
      {/* Stats Quick Cards */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        <div className="bg-muted/40 border border-border/80 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Circle Size</p>
          <p className="text-lg font-bold text-foreground mt-0.5">{circleData.stats.totalReferrals}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{circleData.stats.rewardedReferrals} rewarded</p>
        </div>
        <div className="bg-muted/40 border border-border/80 rounded-xl p-3 text-center">
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Total Earned</p>
          <p className="text-lg font-bold text-primary mt-0.5">{circleData.stats.totalPointsEarned.toLocaleString()} pts</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">≈ ₦{circleData.stats.totalValueNaira.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs selector */}
      <div className="flex border-b border-border/60 shrink-0">
        <button
          className={cn(
            "flex-1 pb-2.5 font-bold text-xs border-b-2 text-center transition-all cursor-pointer",
            activeTab === "circle"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("circle")}
        >
          Your Circle ({circleData.circle.length})
        </button>
        <button
          className={cn(
            "flex-1 pb-2.5 font-bold text-xs border-b-2 text-center transition-all cursor-pointer",
            activeTab === "ledger"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("ledger")}
        >
          Points Activity ({circleData.recentPointTransactions.length})
        </button>
      </div>

      {/* Scrollable List Container */}
      <div className="flex-1 overflow-y-auto max-h-[300px] pr-1">
        {activeTab === "circle" ? (
          circleData.circle.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-1.5">
              <Users2 className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs">Your circle is empty. Invite friends to get started!</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {circleData.circle.map((member: CircleMember) => (
                <div key={member.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground leading-tight">{member.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Joined {new Date(member.joinedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  {member.rewardPaid ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-normal text-[10px] px-2 py-0">
                      <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> +{member.rewardPoints} pts
                    </Badge>
                  ) : member.isFullyVerified ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-normal text-[10px] px-2 py-0">
                      <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" /> Processing
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground font-normal text-[10px] px-2 py-0">
                      <Clock className="w-2.5 h-2.5 mr-1" /> Pending
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          circleData.recentPointTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-1.5">
              <Coins className="w-8 h-8 text-muted-foreground/30 mx-auto" />
              <p className="text-xs">No recent points activity found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {circleData.recentPointTransactions.map((tx: PointTransaction) => {
                const { label, color, sign } = getTransactionLabel(tx.reason)
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div>
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <p className={cn("font-bold text-xs", color)}>
                      {sign}{Math.abs(tx.points)} pts
                    </p>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>Referral History</DrawerTitle>
            <DrawerDescription>Track your referral rewards and activity ledger.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md h-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>Referral History</DialogTitle>
          <DialogDescription>Track your referral rewards and activity ledger.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
