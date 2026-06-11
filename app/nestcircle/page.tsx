"use client"

import * as React from "react"
import Image from "next/image"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useNestCircle } from "@/hooks/use-nestcircle"
import {
  Users2,
  Share2,
  Zap,
  Gift,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { RedeemPanel } from "@/components/nestcircle/redeem-panel"
import { InvitePanel } from "@/components/nestcircle/invite-panel"
import { ReferralHistoryPanel } from "@/components/nestcircle/referral-history-panel"



function NestCirclePage() {
  const { circleData, isLoading, error, mutate } = useNestCircle()
  const [copied, setCopied] = React.useState(false)
  const [redeemOpen, setRedeemOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [isRetrying, setIsRetrying] = React.useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await mutate()
    } catch {
      // ignore
    } finally {
      setIsRetrying(false)
    }
  }

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
      case "DATA_REDEMPTION": return { label: "Data Redeemed", color: "text-rose-600", sign: "-" }
      case "CABLETV_REDEMPTION": return { label: "Cable TV Redeemed", color: "text-rose-600", sign: "-" }
      case "ELECTRICITY_REDEMPTION": return { label: "Electricity Redeemed", color: "text-rose-600", sign: "-" }
      default: return { label: reason, color: "text-muted-foreground", sign: "+" }
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
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
        </DashboardHeader>

        <main className="flex flex-col gap-3 p-3 md:p-5 mx-auto w-full max-w-4xl">
          {/* Page title */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">NestCircle</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Invite friends, earn points, redeem for airtime, data, cable TV &amp; electricity.
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
              <Button
                variant="outline"
                disabled={isRetrying}
                onClick={handleRetry}
                className="font-bold h-10 rounded-xl"
              >
                {isRetrying ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-muted-foreground" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {isRetrying ? "Retrying..." : "Retry"}
              </Button>
            </div>
          )}

          {circleData && (
            <>
              {/* Hero Section with unDraw Illustration */}
              <div className="flex flex-col items-center text-center py-6 px-4">
                <div className="relative w-64 h-64 md:w-72 md:h-72 mb-6 transition-transform hover:scale-102 duration-300">
                  <Image
                    src="/undraw_referral_ihsd.svg"
                    alt="Referral Program"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
                  Grow Your Nest Circle
                </h2>
                <p className="text-muted-foreground text-xs md:text-sm mt-2 max-w-md leading-relaxed">
                  Share the love! We&apos;ll give you and your friend <strong>500 points each</strong> when they verify their email & phone number.
                </p>
              </div>

              {/* Points Balance & Redeem Quick Bar */}
              <div className="max-w-md mx-auto w-full mb-3">
                <Card className="bg-card/50 backdrop-blur-md border border-border/80 shadow-xs relative overflow-hidden">
                  {/* Subtle glow orb */}
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 blur-xl pointer-events-none" />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Your Points Balance</p>
                      <p className="text-2xl font-black text-primary mt-0.5">
                        {circleData.pointsBalance.toLocaleString()} pts
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        ≈ ₦{circleData.pointsValueNaira.toLocaleString()} Redemption Value
                      </p>
                    </div>

                    {circleData.pointsBalance >= circleData.minRedemptionPoints ? (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        onClick={() => setRedeemOpen(true)}
                      >
                        Redeem
                      </Button>
                    ) : (
                      <div className="text-right">
                        <span className="inline-block text-[10px] bg-muted border border-border/40 text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                          {circleData.minRedemptionPoints - circleData.pointsBalance} pts to redeem
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Core Action Buttons */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto w-full mb-6">
                <Button
                  size="lg"
                  onClick={() => setInviteOpen(true)}
                  className="w-full font-bold h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" /> Invite
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setHistoryOpen(true)}
                  className="w-full font-bold h-12 rounded-xl border border-border bg-card hover:bg-muted/50 gap-2 cursor-pointer"
                >
                  <Users2 className="w-4 h-4" /> Referral History
                </Button>
              </div>

              {/* How It Works Card */}
              <Card className="border-border/60 max-w-md mx-auto w-full">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-[15px]">How NestCircle Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 px-4 pb-4">
                  {[
                    {
                      icon: <Share2 className="w-4 h-4 text-primary" />,
                      title: "Share your code",
                      desc: "Send your unique referral link to friends and family.",
                    },
                    {
                      icon: <Users2 className="w-4 h-4 text-primary" />,
                      title: "Friend joins & verifies",
                      desc: "They sign up and verify their email + phone number.",
                    },
                    {
                      icon: <Gift className="w-4 h-4 text-primary" />,
                      title: "Both earn 500 points",
                      desc: "You get 500 pts, they get 500 pts as a welcome bonus.",
                    },
                    {
                      icon: <Zap className="w-4 h-4 text-primary" />,
                      title: "Redeem for bills & airtime",
                      desc: "Use points for airtime, data, cable TV or electricity (2 pts = ₦1). No expiry.",
                    },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{step.title}</p>
                        <p className="text-sm text-muted-foreground leading-normal">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
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

        {/* Invite Dialog/Drawer */}
        {circleData && (
          <InvitePanel
            referralCode={circleData.referralCode}
            referralLink={circleData.referralLink}
            copied={copied}
            onCopy={handleCopy}
            onShare={handleShare}
            open={inviteOpen}
            onOpenChange={setInviteOpen}
          />
        )}

        {/* Referral History Dialog/Drawer */}
        {circleData && (
          <ReferralHistoryPanel
            circleData={circleData}
            getTransactionLabel={getTransactionLabel}
            open={historyOpen}
            onOpenChange={setHistoryOpen}
          />
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return <NestCirclePage />
}
