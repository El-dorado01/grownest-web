"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DrawerClose,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNestCircle } from "@/hooks/use-nestcircle"
import { useProfile } from "@/hooks/use-profile"
import { nestCircleApi } from "@/lib/nestcircle-api"
import {
  Users2,
  Copy,
  Share2,
  CheckCircle2,
  Clock,
  Loader2,
  Zap,
  Gift,
  TrendingUp,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Coins,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"]

function RedeemPanel({
  pointsBalance,
  minPoints,
  minNaira,
  onSuccess,
  open,
  onOpenChange,
}: {
  pointsBalance: number
  minPoints: number
  minNaira: number
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const { profile } = useProfile()
  const [phoneNumber, setPhoneNumber] = React.useState(profile?.phone || "")
  const [network, setNetwork] = React.useState("")
  const [pointsToRedeem, setPointsToRedeem] = React.useState(minPoints)
  const [loading, setLoading] = React.useState(false)

  const nairaValue = pointsToRedeem / 2
  const isValid =
    phoneNumber.length >= 10 &&
    network &&
    pointsToRedeem >= minPoints &&
    pointsToRedeem <= pointsBalance

  const handleRedeem = async () => {
    if (!isValid) return
    setLoading(true)
    const { error } = await nestCircleApi.redeemPoints({
      phoneNumber,
      network,
      pointsToRedeem,
    })
    setLoading(false)
    if (error) {
      toast.error(error)
      return
    }
    toast.success(`₦${nairaValue} airtime sent to ${phoneNumber}!`)
    onOpenChange(false)
    onSuccess()
  }

  const content = (
    <div className="space-y-5 px-1">
      <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Your balance</p>
          <p className="text-2xl font-bold text-primary">{pointsBalance.toLocaleString()} pts</p>
          <p className="text-xs text-muted-foreground">≈ ₦{(pointsBalance / 2).toLocaleString()}</p>
        </div>
        <Coins className="w-10 h-10 text-primary/40" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="redeem-points">Points to redeem</Label>
        <Input
          id="redeem-points"
          type="number"
          min={minPoints}
          max={pointsBalance}
          step={minPoints}
          value={pointsToRedeem}
          onChange={(e) => setPointsToRedeem(Number(e.target.value))}
        />
        <p className="text-xs text-muted-foreground">
          Min {minPoints} pts (₦{minNaira}) · You&apos;ll receive ₦{nairaValue.toLocaleString()} airtime
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="redeem-phone">Phone number</Label>
        <Input
          id="redeem-phone"
          placeholder="e.g. 08012345678"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Network</Label>
        <Select value={network} onValueChange={setNetwork}>
          <SelectTrigger id="redeem-network">
            <SelectValue placeholder="Select network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        disabled={!isValid || loading}
        onClick={handleRedeem}
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Redeeming...</>
        ) : (
          <><Zap className="w-4 h-4 mr-2" /> Redeem {pointsToRedeem} pts for ₦{nairaValue} Airtime</>
        )}
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-left pb-4">
            <DrawerTitle>Redeem Points</DrawerTitle>
            <DrawerDescription>Convert your NestCircle points to airtime</DrawerDescription>
          </DrawerHeader>
          {content}
          <DrawerClose asChild>
            <Button variant="ghost" className="w-full mt-3">Cancel</Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Redeem Points</DialogTitle>
          <DialogDescription>Convert your NestCircle points to airtime</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

function NestCirclePage() {
  const { circleData, isLoading, error, mutate } = useNestCircle()
  const [copied, setCopied] = React.useState(false)
  const [redeemOpen, setRedeemOpen] = React.useState(false)

  const handleCopy = () => {
    if (!circleData?.referralLink) return
    navigator.clipboard.writeText(circleData.referralLink)
    setCopied(true)
    toast.success("Referral link copied!")
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    if (!circleData) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on GrowNest!",
          text: `I'm building my savings on GrowNest. Join using my link and we both earn 500 points!`,
          url: circleData.referralLink,
        })
      } catch {}
    } else {
      handleCopy()
    }
  }

  const getTransactionLabel = (reason: string) => {
    switch (reason) {
      case "FEATHER_ACTION": return { label: "Feather Action", color: "text-emerald-600", sign: "+" }
      case "MILESTONE": return { label: "Milestone Bonus", color: "text-amber-600", sign: "+" }
      case "REFERRAL": return { label: "Referral Reward", color: "text-primary", sign: "+" }
      case "REFERRAL_BONUS": return { label: "Welcome Bonus", color: "text-violet-600", sign: "+" }
      case "AIRTIME_REDEMPTION": return { label: "Airtime Redeemed", color: "text-rose-600", sign: "-" }
      default: return { label: reason, color: "text-muted-foreground", sign: "+" }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>NestCircle</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full">
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NestCircle</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Invite friends, earn points, redeem as airtime — no limits.
            </p>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {error && !isLoading && (
            <div className="text-center py-12 space-y-3">
              <p className="text-muted-foreground">Failed to load your NestCircle data.</p>
              <Button variant="outline" onClick={() => mutate()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
            </div>
          )}

          {circleData && (
            <>
              {/* Referral Code Card */}
              <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground shadow-lg">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4" />

                <div className="relative">
                  <p className="text-sm font-medium opacity-80 mb-1">Your referral code</p>
                  <p className="text-4xl font-bold tracking-widest font-mono mb-4">
                    {circleData.referralCode}
                  </p>
                  <p className="text-xs opacity-70 mb-4 break-all">{circleData.referralLink}</p>
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={handleCopy}
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
                      {copied ? "Copied!" : "Copy Link"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={handleShare}
                    >
                      <Share2 className="w-4 h-4 mr-1.5" /> Share
                    </Button>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: <Users2 className="w-5 h-5 text-primary" />,
                    label: "Circle Size",
                    value: circleData.stats.totalReferrals,
                    sub: `${circleData.stats.rewardedReferrals} rewarded`,
                  },
                  {
                    icon: <Coins className="w-5 h-5 text-amber-500" />,
                    label: "Points Balance",
                    value: `${circleData.pointsBalance.toLocaleString()} pts`,
                    sub: `≈ ₦${circleData.pointsValueNaira.toLocaleString()}`,
                  },
                  {
                    icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
                    label: "Total Earned",
                    value: `${circleData.stats.totalPointsEarned.toLocaleString()} pts`,
                    sub: `₦${circleData.stats.totalValueNaira.toLocaleString()} value`,
                  },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border/60">
                    <CardContent className="p-3 flex flex-col gap-1.5">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        {stat.icon}
                      </div>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                      <p className="font-bold text-sm leading-tight">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Redeem Button */}
              {circleData.pointsBalance >= circleData.minRedemptionPoints ? (
                <Button
                  className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30"
                  size="lg"
                  onClick={() => setRedeemOpen(true)}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Redeem {circleData.pointsBalance} pts for ₦{circleData.pointsValueNaira} Airtime
                </Button>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <Zap className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">
                    {circleData.minRedemptionPoints - circleData.pointsBalance} more points needed to redeem
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Minimum: {circleData.minRedemptionPoints} pts = ₦{circleData.minRedemptionNaira} airtime
                  </p>
                </div>
              )}

              {/* How It Works */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">How NestCircle Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    {
                      icon: <Share2 className="w-4 h-4 text-primary" />,
                      title: "Share your code",
                      desc: "Send your unique referral link to friends and family.",
                    },
                    {
                      icon: <Users2 className="w-4 h-4 text-violet-500" />,
                      title: "Friend joins & verifies",
                      desc: "They sign up and verify their email + phone number.",
                    },
                    {
                      icon: <Gift className="w-4 h-4 text-emerald-500" />,
                      title: "Both earn 500 points",
                      desc: "You get 500 pts, they get 500 pts as a welcome bonus.",
                    },
                    {
                      icon: <Smartphone className="w-4 h-4 text-amber-500" />,
                      title: "Redeem as airtime",
                      desc: "Convert points to airtime (2 pts = ₦1). No expiry, no cap.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Circle Members */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Your Circle</CardTitle>
                    <Badge variant="secondary" className="font-normal">
                      {circleData.stats.totalReferrals} member{circleData.stats.totalReferrals !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {circleData.circle.length === 0 ? (
                    <div className="text-center py-8 space-y-2">
                      <Users2 className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                      <p className="text-sm text-muted-foreground">Your circle is empty — share your link to get started!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {circleData.circle.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-sm font-bold text-primary">
                                {member.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member.name.split(" ")[0]}</p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joinedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            </div>
                          </div>
                          {member.rewardPaid ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 dark:text-emerald-400 font-normal">
                              <CheckCircle2 className="w-3 h-3 mr-1" /> +{member.rewardPoints} pts
                            </Badge>
                          ) : member.isFullyVerified ? (
                            <Badge className="bg-primary/10 text-primary border-primary/20 font-normal">
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processing
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground font-normal">
                              <Clock className="w-3 h-3 mr-1" /> Pending
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Point Transactions */}
              {circleData.recentPointTransactions.length > 0 && (
                <Card className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Recent Points Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {circleData.recentPointTransactions.map((tx) => {
                        const { label, color, sign } = getTransactionLabel(tx.reason)
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0"
                          >
                            <div>
                              <p className="text-sm font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(tx.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <p className={cn("font-bold text-sm", color)}>
                              {sign}{Math.abs(tx.points)} pts
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>

        {/* Redeem Dialog/Drawer */}
        {circleData && (
          <RedeemPanel
            pointsBalance={circleData.pointsBalance}
            minPoints={circleData.minRedemptionPoints}
            minNaira={circleData.minRedemptionNaira}
            onSuccess={() => mutate()}
            open={redeemOpen}
            onOpenChange={setRedeemOpen}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return <NestCirclePage />
}
