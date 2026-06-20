"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { nestPurseApi, Provider } from "@/lib/nestpurse-api"
import { normalizeNigerianPhone, detectNigerianNetwork } from "@/lib/phone-utils"
import useSWR from "swr"
import { useProfile } from "@/hooks/use-profile"
import { useNestFeathers } from "@/hooks/use-nestfeathers"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, CheckCircle2, Smartphone, ArrowLeft } from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"

interface AirtimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  colorTheme?: "primary" | "sky"
}


const FALLBACK_PROVIDERS: Provider[] = [
  { 
    id: "MTN", 
    label: "MTN", 
    logo: "https://pomimqfhhlvqtqiotuoy.supabase.co/storage/v1/object/public/network-providers/MTN_Logo.svg",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500" 
  },
  { 
    id: "GLO", 
    label: "Glo", 
    logo: "https://pomimqfhhlvqtqiotuoy.supabase.co/storage/v1/object/public/network-providers/GloLogo.png",
    color: "bg-green-600/10 text-green-600 dark:text-green-400 border-green-600" 
  },
  { 
    id: "AIRTEL", 
    label: "Airtel", 
    logo: "https://pomimqfhhlvqtqiotuoy.supabase.co/storage/v1/object/public/network-providers/Airtel_logo.svg",
    color: "bg-red-600/10 text-red-600 dark:text-red-400 border-red-600" 
  },
  { 
    id: "9MOBILE", 
    label: "9Mobile", 
    logo: "https://pomimqfhhlvqtqiotuoy.supabase.co/storage/v1/object/public/network-providers/9mobile.svg",
    color: "bg-teal-800/10 text-teal-700 dark:text-teal-400 border-teal-800" 
  },
];

export function AirtimeDialog({ open, onOpenChange, colorTheme = "primary" }: AirtimeDialogProps) {
  const isMobile = useIsMobile()
  const { profile, mutate: mutateProfile } = useProfile()
  const { mutate: mutateFeathers } = useNestFeathers()

  const theme = {
    primary: {
      text: "text-primary",
      bg: "bg-primary",
      bgHover: "hover:bg-primary/90",
      border: "border-primary",
      textFlipped: "text-primary-foreground",
      ring: "ring-primary/50",
      focusBorder: "focus:border-primary",
      focusRing: "focus:ring-primary",
    },
    sky: {
      text: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-600 dark:bg-sky-500",
      bgHover: "hover:bg-sky-700 dark:hover:bg-sky-600",
      border: "border-sky-600 dark:border-sky-500",
      textFlipped: "text-white",
      ring: "ring-sky-500/50",
      focusBorder: "focus:border-sky-500",
      focusRing: "focus:ring-sky-500",
    }
  }[colorTheme]

  // Wizard flow states
  const [airtimeStep, setAirtimeStep] = React.useState<number>(1)
  const [isForSelf, setIsForSelf] = React.useState<boolean | null>(null)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [network, setNetwork] = React.useState("MTN")
  const [amount, setAmount] = React.useState("")
  const [pin, setPin] = React.useState("")
  const [usePoints, setUsePoints] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [airtimeError, setAirtimeError] = React.useState<string | null>(null)
  const [airtimeSuccess, setAirtimeSuccess] = React.useState(false)

  const { data: providersRes } = useSWR(
    open ? "airtime-providers" : null,
    () => nestPurseApi.getProviders()
  )
  const providers = providersRes?.data?.providers || []

  // History view states
  const [showHistory, setShowHistory] = React.useState(false)

  const { data: historyRes, isLoading: isLoadingHistory, mutate: mutateHistory } = useSWR(
    (open && showHistory) ? "airtime-history" : null,
    () => nestPurseApi.getAirtimeTransactions({ limit: 50 })
  )
  const history = historyRes?.data?.transactions || []

  const pinInputRef = React.useRef<HTMLInputElement>(null)

  // Points values calculation
  const pointsBalance = profile?.pointsBalance || 0
  const pointsValueNaira = pointsBalance / 2
  const numericAmount = Number(amount) || 0

  let pointsToDeduct = 0
  let walletAmountToDeduct = numericAmount

  if (usePoints) {
    if (pointsValueNaira >= numericAmount) {
      pointsToDeduct = numericAmount * 2
      walletAmountToDeduct = 0
    } else {
      pointsToDeduct = pointsBalance
      walletAmountToDeduct = numericAmount - pointsValueNaira
    }
  }

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
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setIsForSelf(true)
      const phone = normalizeNigerianPhone(profile?.phone || "")
      setPhoneNumber(phone)
      const detected = phone ? detectNigerianNetwork(phone) : null
      setNetwork(detected || "MTN")
      setAmount("")
      setPin("")
      setUsePoints(false)
      setAirtimeStep(1)
      setAirtimeError(null)
      setAirtimeSuccess(false)
      setShowHistory(false)
    }
  }, [open, profile?.phone])
  /* eslint-enable react-hooks/set-state-in-effect */

  const isStep1Valid = normalizeNigerianPhone(phoneNumber).length === 11 && !!network
  const isStep2Valid = Number(amount) >= 100
  const isStep3Valid = pin.length === 4

  const handleBuyAirtime = async (e: React.FormEvent) => {
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
    
    if (!phoneNumber || !amount || !pin) {
      setAirtimeError("Please fill in all fields.")
      return
    }

    setIsSubmitting(true)
    setAirtimeError(null)

    try {
      const cleanPhone = normalizeNigerianPhone(phoneNumber)
      const res = await nestPurseApi.purchaseAirtime({
        phoneNumber: cleanPhone,
        network,
        amount: Number(amount),
        pin,
        usePoints,
      })

      if (res.error) {
        setAirtimeError(res.error || "Failed to purchase airtime. Please try again.")
      } else {
        setAirtimeSuccess(true)
        toast.success("Airtime purchased successfully!")
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#eab308", "#fbbf24", "#22c55e"],
        })
        await Promise.all([mutateProfile(), mutateFeathers(), mutateHistory()])
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } }
      const errMsg = errorResponse?.response?.data?.error || (err instanceof Error ? err.message : "An error occurred.")
      setAirtimeError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderHistory = () => {
    if (isLoadingHistory) {
      return (
        <div className="space-y-3 animate-in fade-in duration-300">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-4 rounded-2xl border border-muted bg-card flex flex-col gap-2.5">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-muted animate-pulse rounded-md" />
                <div className="h-4 w-16 bg-muted animate-pulse rounded-md" />
              </div>
              <div className="flex justify-between items-center">
                <div className="h-3.5 w-32 bg-muted/65 animate-pulse rounded-md" />
                <div className="h-3 w-20 bg-muted/50 animate-pulse rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (history.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center gap-3 animate-in fade-in duration-300">
          <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center text-muted-foreground opacity-60">
            <Smartphone className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">No Payment History</p>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              You haven't purchased any airtime yet. Your transaction history will appear here.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="space-y-3 pr-1 animate-in fade-in duration-300">
        {history.map((tx) => {
          const dateStr = new Date(tx.date).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
          const isSuccess = tx.status.toLowerCase() === "success" || tx.status.toLowerCase() === "completed"
          
          return (
            <div
              key={tx.id}
              className="p-4 rounded-2xl border border-muted bg-card hover:bg-muted/10 transition-colors flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-foreground capitalize">
                    {tx.method} Top-up
                  </span>
                  <span className="text-xxs text-muted-foreground font-semibold">
                    {dateStr}
                  </span>
                </div>
                <span className="text-sm font-black text-foreground">
                  ₦{tx.amount.toLocaleString()}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-xs border-t border-dashed border-muted/50 pt-2 mt-1">
                <span className="text-muted-foreground truncate max-w-[70%]">
                  {tx.narration || `Ref: ${tx.reference}`}
                </span>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                  isSuccess
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "bg-destructive/10 text-destructive dark:bg-destructive/20"
                )}>
                  {tx.status}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderAirtimeForm = () => {
    if (airtimeSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10 fill-emerald-500 text-white dark:fill-transparent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">Top-up Successful!</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {usePoints && pointsToDeduct > 0 ? (
                <>
                  ₦{Number(amount).toLocaleString()} airtime has been sent to {phoneNumber}. Charged {pointsToDeduct.toLocaleString()} points
                  {walletAmountToDeduct > 0 ? ` and ₦${walletAmountToDeduct.toLocaleString()} from your wallet` : ""}.
                </>
              ) : (
                <>
                  ₦{Number(amount).toLocaleString()} airtime has been sent to {phoneNumber}. Your wallet balance has been updated.
                </>
              )}
            </p>
          </div>
          <Button 
            className={cn("mt-4 rounded-full px-8 font-bold text-xs h-10 cursor-pointer", theme.bg, theme.bgHover, theme.textFlipped)}
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </div>
      )
    }

    return (
      <form onSubmit={handleBuyAirtime} className="flex-1 flex flex-col gap-4 py-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        {airtimeError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive text-center">
            {airtimeError}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between items-center px-1 border-b pb-2 mb-1">
          <span className={cn("text-xs font-black uppercase tracking-wider", theme.text)}>
            {airtimeStep === 1 && "Step 1: Recipient & Network"}
            {airtimeStep === 2 && "Step 2: Enter Amount"}
            {airtimeStep === 3 && "Step 3: Secure Transaction PIN"}
          </span>
          <div className="flex gap-1">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 1 ? `${theme.bg} w-4.5` : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 2 ? `${theme.bg} w-4.5` : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", airtimeStep === 3 ? `${theme.bg} w-4.5` : "bg-muted w-1.5")} />
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
                      const normalized = normalizeNigerianPhone(profile.phone)
                      setPhoneNumber(normalized)
                      const detected = detectNigerianNetwork(normalized)
                      if (detected) setNetwork(detected)
                    } else {
                      setPhoneNumber("")
                    }
                  }}
                  className={cn(
                    "h-10 rounded-xl border font-black text-sm transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer",
                    isForSelf === true
                      ? cn(theme.bg, theme.border, theme.textFlipped, "shadow-xs")
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
                      ? cn(theme.bg, theme.border, theme.textFlipped, "shadow-xs")
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
                      const detected = detectNigerianNetwork(val)
                      if (detected) {
                        setNetwork(detected)
                      }
                    }}
                    placeholder={isForSelf ? "No phone number set in profile" : "e.g. 08055441122"}
                    disabled={isSubmitting || isForSelf}
                    className={cn(
                      "w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden text-sm font-semibold transition-all",
                      theme.focusBorder, "focus:ring-1", theme.focusRing,
                      isForSelf && "opacity-75 bg-muted/20 cursor-not-allowed"
                    )}
                  />
                  {isForSelf && !profile?.phone && (
                    <p className="text-xs text-destructive font-bold">
                      No phone number set in your profile. Please choose &quot;For Others&quot; or update your profile.
                    </p>
                  )}
                </div>

                {/* Network Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Network Provider</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(providers.length > 0 ? providers : FALLBACK_PROVIDERS).map((net) => {
                      const isSelected = network === net.id
                      return (
                        <button
                          key={net.id}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setNetwork(net.id)}
                          className={cn(
                            "h-16 rounded-xl border font-black transition-all shadow-xs flex flex-col items-center justify-center gap-1.5 p-2 cursor-pointer",
                            isSelected 
                              ? `${net.color} scale-105 ring-2 ring-offset-2 dark:ring-offset-card ${theme.ring}` 
                              : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                          )}
                        >
                          <img 
                            src={net.logo} 
                            alt={`${net.label} logo`} 
                            className={cn(
                              net.id === "MTN"
                                ? "h-7 w-auto object-contain rounded-full bg-white p-0.5 border border-muted/20"
                                : "h-6 w-auto object-contain"
                            )}
                          />
                          <span className="text-[10px] tracking-wide font-extrabold">{net.label}</span>
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
                className={cn("flex-1 h-10 rounded-full font-bold gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", theme.textFlipped, theme.bg, theme.bgHover)}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: ENTER AMOUNT */}
        {airtimeStep === 2 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Amount Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[100, 200, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAmount(String(val))}
                    className={cn(
                      "h-8 rounded-lg border font-bold text-xs transition-all flex items-center justify-center cursor-pointer",
                      amount === String(val)
                        ? cn(theme.bg, theme.textFlipped, theme.border, "scale-105")
                        : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    ₦{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom Amount (Min ₦100)"
                disabled={isSubmitting}
                className={cn(
                  "w-full h-11 px-4 rounded-xl border bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden text-sm font-semibold transition-all mt-2",
                  amount && Number(amount) < 100
                    ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                    : cn("border-muted", theme.focusBorder, "focus:ring-1", theme.focusRing)
                )}
              />
              {amount && Number(amount) < 100 && (
                <p className="text-[10px] font-bold text-destructive mt-1">
                  Minimum airtime purchase is ₦100
                </p>
              )}
            </div>

            {pointsBalance > 0 && (
              <div className="p-4 rounded-xl border border-muted bg-card flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">Pay with Points</span>
                    <span className="text-[10px] text-muted-foreground">
                      Balance: {pointsBalance.toLocaleString()} pts (≈ ₦{pointsValueNaira.toLocaleString()})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUsePoints(!usePoints)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden",
                      usePoints ? "bg-emerald-500" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                        usePoints ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {usePoints && (
                  <div className="pt-2 border-t border-dashed border-muted text-[11px] space-y-1 text-muted-foreground font-semibold">
                    <div className="flex justify-between">
                      <span>Points Charged:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">-{pointsToDeduct.toLocaleString()} pts (≈ ₦{(pointsToDeduct / 2).toLocaleString()})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wallet Cash Charged:</span>
                      <span className="text-foreground">₦{walletAmountToDeduct.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                className={cn("flex-1 h-10 rounded-full font-bold gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", theme.textFlipped, theme.bg, theme.bgHover)}
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
                className={cn("w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden text-sm font-semibold tracking-widest text-center transition-all", theme.focusBorder, "focus:ring-1", theme.focusRing)}
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
                <span>Total Amount:</span>
                <span className="font-black text-foreground">₦{Number(amount).toLocaleString()}</span>
              </div>
              {usePoints && (
                <>
                  <div className="flex justify-between border-t border-dashed border-muted/80 pt-1 mt-1">
                    <span>Points to Use:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{pointsToDeduct.toLocaleString()} pts (≈ ₦{(pointsToDeduct / 2).toLocaleString()})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Wallet Cash:</span>
                    <span className="font-bold text-foreground">₦{walletAmountToDeduct.toLocaleString()}</span>
                  </div>
                </>
              )}
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
                className={cn("flex-1 h-10 rounded-full font-bold gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", theme.textFlipped, theme.bg, theme.bgHover)}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Purchasing...
                  </>
                ) : (
                  <>
                    Confirm Top-up
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
    1: "Buy Airtime",
    2: "Select Amount",
    3: "Security Verification",
  }[airtimeStep as 1 | 2 | 3] || "Buy Airtime"

  const description = {
    1: "Configure recipient details and carrier network provider",
    2: "Enter or select the top-up amount in Naira",
    3: "Confirm details and authorize top-up with your transaction PIN",
  }[airtimeStep as 1 | 2 | 3] || "Purchase mobile network airtime top-up"

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[75vh] max-h-[95vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="mb-2 px-0 shrink-0">
            <DrawerTitle className="text-xl font-bold relative">
              <div className="flex items-center justify-between w-full min-h-[28px] relative">
                <AnimatePresence>
                  {showHistory && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ type: "spring", stiffness: 80, damping: 16 }}
                      type="button"
                      onClick={() => setShowHistory(false)}
                      className="p-1 -ml-1 rounded-full hover:bg-muted/50 transition-colors cursor-pointer shrink-0 absolute left-0"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </motion.button>
                  )}
                </AnimatePresence>

                <div className="flex items-center flex-1 min-w-0 pl-1">
                  <AnimatePresence mode="wait">
                    {!showHistory && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.5 }}
                        className="text-foreground truncate block font-bold"
                      >
                        {title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 80, damping: 16 }}
                  className={cn(
                    "flex items-center",
                    showHistory ? "absolute left-8" : "absolute right-4"
                  )}
                >
                  <motion.span
                    layout="position"
                    className={cn(
                      "transition-all duration-300 font-bold",
                      showHistory 
                        ? "text-foreground text-lg sm:text-xl" 
                        : cn("text-xs uppercase tracking-wider cursor-pointer pr-3", theme.text)
                    )}
                    onClick={() => !showHistory && setShowHistory(true)}
                  >
                    {showHistory ? "Payment History" : "History"}
                  </motion.span>
                </motion.div>
              </div>
            </DrawerTitle>
            <DrawerDescription className={cn(showHistory ? "text-left pl-8" : "text-left pl-1", "transition-all duration-300 min-h-[20px] relative")}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={showHistory ? "history" : "form"}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.5 }}
                  className="block"
                >
                  {showHistory ? "Your recent transaction history" : description}
                </motion.span>
              </AnimatePresence>
            </DrawerDescription>
          </DrawerHeader>
          <div className={cn("px-2 py-2 flex-1 min-h-0 overflow-y-auto", (!airtimeSuccess && !showHistory) && "flex flex-col")}>
            {showHistory ? renderHistory() : renderAirtimeForm()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] p-0 sm:max-w-[440px] h-[550px] max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-0 shrink-0">
          <DialogTitle className="text-2xl font-bold relative">
            <div className="flex items-center justify-between w-full min-h-[32px] relative">
              <AnimatePresence>
                {showHistory && (
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 80, damping: 16 }}
                    type="button"
                    onClick={() => setShowHistory(false)}
                    className="p-1 -ml-1 rounded-full hover:bg-muted/50 transition-colors cursor-pointer shrink-0 absolute left-0"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </motion.button>
                )}
              </AnimatePresence>

              <div className="flex items-center flex-1 min-w-0 pl-1">
                <AnimatePresence mode="wait">
                  {!showHistory && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.5 }}
                      className="text-foreground truncate block font-bold"
                    >
                      {title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                layout
                transition={{ type: "spring", stiffness: 80, damping: 16 }}
                className={cn(
                  "flex items-center",
                  showHistory ? "absolute left-8" : "absolute right-6"
                )}
              >
                <motion.span
                  layout="position"
                  className={cn(
                    "transition-all duration-300 font-bold",
                    showHistory 
                      ? "text-foreground text-xl sm:text-2xl" 
                      : cn("text-xs uppercase tracking-wider cursor-pointer pr-3", theme.text)
                  )}
                  onClick={() => !showHistory && setShowHistory(true)}
                >
                  {showHistory ? "Payment History" : "History"}
                </motion.span>
              </motion.div>
            </div>
          </DialogTitle>
          <DialogDescription className={cn(showHistory ? "text-left pl-8" : "text-left pl-1", "transition-all duration-300 min-h-[20px] relative")}>
            <AnimatePresence mode="wait">
              <motion.span
                key={showHistory ? "history" : "form"}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.5 }}
                className="block"
              >
                {showHistory ? "Your recent transaction history" : description}
              </motion.span>
            </AnimatePresence>
          </DialogDescription>
        </DialogHeader>
        <div className={cn("p-6 pt-2 flex-1 min-h-0 overflow-y-auto flex flex-col", (airtimeSuccess || (showHistory && history.length === 0)) && "justify-center")}>
          {showHistory ? renderHistory() : renderAirtimeForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
