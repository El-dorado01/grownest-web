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
  ArrowRight,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"

const NETWORKS = ["MTN", "Airtel", "Glo", "9mobile"]

// Smart network provider detection based on Nigerian phone prefixes
function detectNetwork(phone: string): string | null {
  const cleanPhone = phone.replace(/[\s\-\+]/g, "")
  let localPhone = cleanPhone
  if (cleanPhone.startsWith("234")) {
    localPhone = "0" + cleanPhone.slice(3)
  }
  
  if (localPhone.length < 4) return null
  const prefix = localPhone.substring(0, 4)
  
  const mtnPrefixes = ["0803", "0806", "0810", "0813", "0814", "0816", "0903", "0906", "0913", "0916", "0703", "0706", "0704"]
  const gloPrefixes = ["0805", "0807", "0811", "0815", "0905", "0915", "0705"]
  const airtelPrefixes = ["0802", "0808", "0812", "0901", "0902", "0904", "0907", "0912", "0701", "0708"]
  const nineMobilePrefixes = ["0809", "0817", "0818", "0908", "0909"]
  
  if (mtnPrefixes.includes(prefix)) return "MTN"
  if (gloPrefixes.includes(prefix)) return "GLO"
  if (airtelPrefixes.includes(prefix)) return "AIRTEL"
  if (nineMobilePrefixes.includes(prefix)) return "9MOBILE"
  
  return null
}

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
  const { profile, mutate: mutateProfile } = useProfile()

  // Wizard flow states
  const [airtimeStep, setAirtimeStep] = React.useState<number>(1)
  const [isForSelf, setIsForSelf] = React.useState<boolean | null>(null)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [network, setNetwork] = React.useState("MTN")
  const [pointsToRedeem, setPointsToRedeem] = React.useState(minPoints)
  const [pin, setPin] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [airtimeError, setAirtimeError] = React.useState<string | null>(null)
  const [airtimeSuccess, setAirtimeSuccess] = React.useState(false)

  const pinInputRef = React.useRef<HTMLInputElement>(null)

  // Auto focus PIN field on step 3
  React.useEffect(() => {
    if (airtimeStep === 3) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [airtimeStep])

  // Reset form states on open/close
  React.useEffect(() => {
    if (open) {
      setIsForSelf(null)
      setPhoneNumber("")
      setNetwork("MTN")
      setPointsToRedeem(minPoints)
      setPin("")
      setAirtimeStep(1)
      setAirtimeError(null)
      setAirtimeSuccess(false)
    }
  }, [open])

  const nairaValue = pointsToRedeem / 2

  const isStep1Valid = phoneNumber.replace(/[\s\-\+]/g, "").length >= 10 && !!network
  const isStep2Valid = pointsToRedeem >= minPoints && pointsToRedeem <= pointsBalance
  const isStep3Valid = pin.length === 4

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (airtimeStep === 1) {
      if (isStep1Valid) {
        setAirtimeStep(2)
      }
      return
    }
    if (airtimeStep === 2) {
      if (isStep2Valid) {
        setAirtimeStep(3)
      }
      return
    }

    if (!phoneNumber || !pointsToRedeem || !pin) {
      setAirtimeError("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)
    setAirtimeError(null)

    try {
      const res = await nestCircleApi.redeemPoints({
        phoneNumber,
        network,
        pointsToRedeem,
        pin,
      })

      if (res.error) {
        setAirtimeError(res.error || "Failed to redeem points. Please try again.")
        setPin("")
      } else {
        setAirtimeSuccess(true)
        toast.success("Points redeemed successfully!")
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#eab308", "#fbbf24", "#22c55e"],
        })
        onSuccess()
        await mutateProfile()
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "An error occurred."
      setAirtimeError(errMsg)
      setPin("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRedeemForm = () => {
    if (airtimeSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10 fill-emerald-500 text-white dark:fill-transparent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">Redemption Successful!</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              ₦{nairaValue.toLocaleString()} airtime has been sent to {phoneNumber} in exchange for {pointsToRedeem.toLocaleString()} points.
            </p>
          </div>
          <Button 
            className="mt-4 rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs h-10 cursor-pointer"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      )
    }

    return (
      <form onSubmit={handleRedeem} className="flex-1 flex flex-col gap-4 py-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        {airtimeError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive text-center">
            {airtimeError}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between items-center px-1 border-b pb-2 mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            {airtimeStep === 1 && "Step 1: Recipient & Network"}
            {airtimeStep === 2 && "Step 2: Points to Redeem"}
            {airtimeStep === 3 && "Step 3: Secure Transaction PIN"}
          </span>
          <div className="flex gap-1">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 1 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 2 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 3 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
          </div>
        </div>

        {/* STEP 1: RECIPIENT & NETWORK */}
        {airtimeStep === 1 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Recipient Selection (For Self / For Others) */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Recipient</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  key="self"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsForSelf(true)
                    if (profile?.phone) {
                      setPhoneNumber(profile.phone)
                      const detected = detectNetwork(profile.phone)
                      if (detected) setNetwork(detected)
                    } else {
                      setPhoneNumber("")
                    }
                  }}
                  className={cn(
                    "h-10 rounded-xl border font-black text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer",
                    isForSelf === true
                      ? "bg-primary border-primary text-primary-foreground shadow-xs"
                      : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  For Self
                </button>
                <button
                  key="others"
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsForSelf(false)
                    setPhoneNumber("")
                  }}
                  className={cn(
                    "h-10 rounded-xl border font-black text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer",
                    isForSelf === false
                      ? "bg-primary border-primary text-primary-foreground shadow-xs"
                      : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                  )}
                >
                  For Others
                </button>
              </div>
            </div>

            {/* Hidden phone and network fields revealed after choice */}
            {isForSelf !== null && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                {/* Phone Number Input */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      const val = e.target.value
                      setPhoneNumber(val)
                      const detected = detectNetwork(val)
                      if (detected) {
                        setNetwork(detected)
                      }
                    }}
                    placeholder={isForSelf ? "No phone number set in profile" : "e.g. 08012345678"}
                    disabled={isSubmitting || isForSelf}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all",
                      isForSelf && "opacity-75 bg-muted/20 cursor-not-allowed"
                    )}
                  />
                  {isForSelf && !profile?.phone && (
                    <p className="text-xs text-destructive font-bold">
                      No phone number set in your profile. Please choose "For Others" or update your profile.
                    </p>
                  )}
                </div>

                {/* Network Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Network Provider</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "MTN", label: "MTN", color: "bg-yellow-500 hover:bg-yellow-600 text-black border-yellow-500" },
                      { id: "GLO", label: "Glo", color: "bg-green-600 hover:bg-green-700 text-white border-green-600" },
                      { id: "AIRTEL", label: "Airtel", color: "bg-red-600 hover:bg-red-700 text-white border-red-600" },
                      { id: "9MOBILE", label: "9Mobile", color: "bg-teal-800 hover:bg-teal-900 text-white border-teal-850" },
                    ].map((net) => {
                      const isSelected = network === net.id
                      return (
                        <button
                          key={net.id}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setNetwork(net.id)}
                          className={cn(
                            "h-10 rounded-xl border font-black text-xs tracking-wide transition-all shadow-xs flex items-center justify-center cursor-pointer",
                            isSelected 
                              ? `${net.color} scale-105 ring-2 ring-offset-2 ring-primary/50 dark:ring-offset-card` 
                              : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                          )}
                        >
                          {net.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 Footer */}
            <div className="flex gap-2 border-t pt-4 mt-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => onOpenChange(false)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => setAirtimeStep(2)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: POINTS TO REDEEM */}
        {airtimeStep === 2 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Balance Display */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3.5 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Your Balance</p>
                <p className="text-xl font-black text-primary">{pointsBalance.toLocaleString()} pts</p>
                <p className="text-xs text-muted-foreground">≈ ₦{(pointsBalance / 2).toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-primary/40" />
            </div>

            {/* Points Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Points to Redeem</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[100, 200, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitting || val > pointsBalance}
                    onClick={() => setPointsToRedeem(val)}
                    className={cn(
                      "h-8 rounded-lg border font-bold text-xs transition-all flex items-center justify-center cursor-pointer",
                      pointsToRedeem === val
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-card border-muted text-muted-foreground hover:bg-muted/30 disabled:opacity-30 disabled:cursor-not-allowed"
                    )}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={minPoints}
                max={pointsBalance}
                step={100}
                value={pointsToRedeem}
                onChange={(e) => setPointsToRedeem(Number(e.target.value))}
                placeholder={`Min ${minPoints} pts`}
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Rate: 2 points = ₦1 · You&apos;ll receive <strong className="text-foreground">₦{nairaValue.toLocaleString()}</strong> airtime.
              </p>
            </div>

            {/* Step 2 Footer */}
            <div className="flex gap-2 border-t pt-4 mt-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setAirtimeStep(1)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={!isStep2Valid}
                onClick={() => setAirtimeStep(3)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: TRANSACTION PIN */}
        {airtimeStep === 3 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Transaction PIN */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Transaction PIN</label>
              <input
                ref={pinInputRef}
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4-digit PIN"
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold tracking-widest text-center transition-all"
              />
            </div>

            {/* Summary Details */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-muted/50 text-xs font-semibold text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Recipient:</span>
                <span className="font-bold text-foreground">{isForSelf ? "Self" : "Others"} ({phoneNumber})</span>
              </div>
              <div className="flex justify-between">
                <span>Network:</span>
                <span className="font-bold text-foreground">{network}</span>
              </div>
              <div className="flex justify-between">
                <span>Points to Redeem:</span>
                <span className="font-bold text-foreground">{pointsToRedeem.toLocaleString()} pts</span>
              </div>
              <div className="flex justify-between">
                <span>Airtime Value:</span>
                <span className="font-black text-foreground">₦{nairaValue.toLocaleString()}</span>
              </div>
            </div>

            {/* Step 3 Footer */}
            <div className="flex gap-2 border-t pt-4 mt-auto">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setAirtimeStep(2)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isStep3Valid}
                className={cn("flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed")}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redeeming...
                  </>
                ) : (
                  <>
                    Confirm Redemption
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    )
  }

  const title = {
    1: "Redeem Points",
    2: "Select Points",
    3: "Security Verification",
  }[airtimeStep as 1 | 2 | 3] || "Redeem Points"

  const description = {
    1: "Configure recipient details and carrier network provider",
    2: "Select or enter the points you want to redeem for airtime",
    3: "Confirm details and authorize redemption with your transaction PIN",
  }[airtimeStep as 1 | 2 | 3] || "Convert your NestCircle points to airtime"

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="mb-2 px-0 shrink-0">
            <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold">
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className={cn("px-2 py-2 flex-1 min-h-0 overflow-y-auto", !airtimeSuccess && "flex flex-col")}>
            {renderRedeemForm()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] p-0 sm:max-w-[440px] h-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className={cn("p-6 pt-2 flex-1 min-h-0 overflow-y-auto flex flex-col", airtimeSuccess && "justify-center")}>
          {renderRedeemForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InvitePanel({
  referralCode,
  referralLink,
  copied,
  onCopy,
  onShare,
  open,
  onOpenChange,
}: {
  referralCode: string
  referralLink: string
  copied: boolean
  onCopy: () => void
  onShare: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()

  const content = (
    <div className="space-y-5 px-1 py-2">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your unique referral code</p>
        <div className="inline-flex items-center gap-3 bg-muted border border-border rounded-xl px-6 py-3 mt-1.5">
          <p className="text-2xl font-bold tracking-[0.2em] font-mono text-foreground">
            {referralCode}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground">Referral Link</label>
        <div className="bg-muted/50 border border-border rounded-xl p-3 break-all text-xs font-mono text-muted-foreground">
          {referralLink}
        </div>
      </div>

      <div className="flex gap-2.5 w-full pt-2">
        <Button
          className="flex-1 font-bold h-11 rounded-xl cursor-pointer"
          onClick={onCopy}
        >
          {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-primary-foreground" /> : <Copy className="w-4 h-4 mr-1.5" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-bold h-11 rounded-xl cursor-pointer"
          onClick={onShare}
        >
          <Share2 className="w-4 h-4 mr-1.5" /> Share Link
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8 flex flex-col">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>Invite Friends</DrawerTitle>
            <DrawerDescription>Share your link. You and your friend both earn 500 points on verification.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>Share your link. You and your friend both earn 500 points on verification.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}

function ReferralHistoryPanel({
  circleData,
  getTransactionLabel,
  open,
  onOpenChange,
}: {
  circleData: any
  getTransactionLabel: (reason: string) => { label: string; color: string; sign: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = React.useState<"circle" | "ledger">("circle")

  const content = (
    <div className="flex-1 flex flex-col gap-4 overflow-hidden min-h-0 py-2">
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
              {circleData.circle.map((member: any) => (
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
              {circleData.recentPointTransactions.map((tx: any) => {
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

function NestCirclePage() {
  const { circleData, isLoading, error, mutate } = useNestCircle()
  const [copied, setCopied] = React.useState(false)
  const [redeemOpen, setRedeemOpen] = React.useState(false)
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)

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
                  <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/10 blur-xl" />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold">Your Points Balance</p>
                      <p className="text-2xl font-black text-primary mt-0.5">
                        {circleData.pointsBalance.toLocaleString()} pts
                      </p>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        ≈ ₦{circleData.pointsValueNaira.toLocaleString()} Airtime Value
                      </p>
                    </div>

                    {circleData.pointsBalance >= circleData.minRedemptionPoints ? (
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
                        onClick={() => setRedeemOpen(true)}
                      >
                        <Zap className="w-3.5 h-3.5" />
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
                      icon: <Smartphone className="w-4 h-4 text-primary" />,
                      title: "Redeem as airtime",
                      desc: "Convert points to airtime (2 pts = ₦1). No expiry, no cap.",
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
