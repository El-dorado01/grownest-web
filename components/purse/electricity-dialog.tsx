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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { nestPurseApi } from "@/lib/nestpurse-api"
import { useProfile } from "@/hooks/use-profile"
import { useNestFeathers } from "@/hooks/use-nestfeathers"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, CheckCircle2, Zap, Search, ArrowLeft, Copy } from "lucide-react"
import confetti from "canvas-confetti"
import { motion, AnimatePresence } from "framer-motion"

interface ElectricityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Disco {
  id: string
  name: string
}

const FALLBACK_DISCOS: Disco[] = [
  { id: "phed", name: "Port Harcourt (PHED)" },
  { id: "jed", name: "Jos Electric (JEDC)" },
  { id: "kaduna", name: "Kaduna Electric (KAEDCO)" },
  { id: "ibedc", name: "Ibadan Electric (IBEDC)" },
  { id: "eko", name: "Eko Electric (EKEDC)" },
  { id: "benin", name: "Benin Electric (BEDC)" },
  { id: "abuja", name: "Abuja Electric (AEDC)" },
  { id: "kano", name: "Kano Electric (KEDCO)" },
  { id: "ikeja", name: "Ikeja Electric (IKEDC)" },
  { id: "enugu", name: "Enugu Electric (EEDC)" },
]

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000]

export function ElectricityDialog({ open, onOpenChange }: ElectricityDialogProps) {
  const isMobile = useIsMobile()
  const { profile, mutate: mutateProfile } = useProfile()
  const { mutate: mutateFeathers } = useNestFeathers()

  // Step state
  const [step, setStep] = React.useState<number>(1)

  // Step 1: Disco, meter type, meter number, customer lookup
  const [discos, setDiscos] = React.useState<Disco[]>([])
  const [isLoadingDiscos, setIsLoadingDiscos] = React.useState(false)
  const [disco, setDisco] = React.useState("")
  const [meterType, setMeterType] = React.useState<"PREPAID" | "POSTPAID">("PREPAID")
  const [meterNumber, setMeterNumber] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
  const [verifiedName, setVerifiedName] = React.useState<string | null>(null)
  const [verifiedAddress, setVerifiedAddress] = React.useState<string | null>(null)
  const [verifyError, setVerifyError] = React.useState<string | null>(null)

  // Step 2: Amount + usePoints
  const [amount, setAmount] = React.useState("")
  const [usePoints, setUsePoints] = React.useState(false)

  // Step 3: PIN
  const [pin, setPin] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [elecError, setElecError] = React.useState<string | null>(null)
  const [elecSuccess, setElecSuccess] = React.useState(false)

  // History view states
  const [showHistory, setShowHistory] = React.useState(false)
  const [history, setHistory] = React.useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(false)

  const pinInputRef = React.useRef<HTMLInputElement>(null)

  // Points calculation
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

  // Fetch discos on open
  React.useEffect(() => {
    if (!open) return
    const load = async () => {
      setIsLoadingDiscos(true)
      try {
        const res = await nestPurseApi.getElectricityDiscos()
        if (res.data?.discos?.length) {
          setDiscos(res.data.discos)
          setDisco(res.data.discos[0].id)
        } else {
          setDiscos(FALLBACK_DISCOS)
          setDisco(FALLBACK_DISCOS[0].id)
        }
      } catch {
        setDiscos(FALLBACK_DISCOS)
        setDisco(FALLBACK_DISCOS[0].id)
      } finally {
        setIsLoadingDiscos(false)
      }
    }
    load()
  }, [open])

  // Auto-focus PIN on step 3
  React.useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => pinInputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [step])

  // Reset on open/close
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setStep(1)
      setMeterNumber("")
      setMeterType("PREPAID")
      setVerifiedName(null)
      setVerifiedAddress(null)
      setVerifyError(null)
      setAmount("")
      setUsePoints(false)
      setPin("")
      setElecError(null)
      setElecSuccess(false)
      setShowHistory(false)
      setHistory([])
      setIsLoadingHistory(false)
    }
  }, [open])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch electricity history when history panel is shown
  React.useEffect(() => {
    if (showHistory && open) {
      const loadHistory = async () => {
        setIsLoadingHistory(true)
        try {
          const res = await nestPurseApi.getElectricityTransactions({ limit: 50 })
          if (res.data?.transactions) {
            setHistory(res.data.transactions)
          }
        } catch (err) {
          console.error("Failed to load electricity transactions:", err)
        } finally {
          setIsLoadingHistory(false)
        }
      }
      loadHistory()
    }
  }, [showHistory, open])

  const handleVerify = async () => {
    if (!disco || !meterNumber.trim()) return
    setIsVerifying(true)
    setVerifyError(null)
    setVerifiedName(null)
    setVerifiedAddress(null)
    try {
      const res = await nestPurseApi.lookupElectricity({ disco, customerId: meterNumber.trim() })
      if (res.error) {
        setVerifyError(res.error)
      } else if (res.data?.customerName) {
        setVerifiedName(res.data.customerName)
        setVerifiedAddress(res.data.customerAddress || null)
      } else {
        setVerifyError("Meter number could not be verified. Please check and try again.")
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verification failed. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === 1) {
      if (isStep1Valid) setStep(2)
      return
    }
    if (step === 2) {
      if (isStep2Valid) setStep(3)
      return
    }

    setIsSubmitting(true)
    setElecError(null)
    try {
      const res = await nestPurseApi.purchaseElectricity({
        disco,
        amount: numericAmount,
        customerId: meterNumber.trim(),
        meterType,
        pin,
        payerName: verifiedName || undefined,
        usePoints,
      })

      if (res.error) {
        setElecError(res.error || "Failed to vend electricity. Please try again.")
        setPin("")
      } else {
        setElecSuccess(true)
        toast.success("Electricity vended successfully!")
        confetti({
          particleCount: 100,
          spread: 60,
          origin: { y: 0.6 },
          colors: ["#eab308", "#fbbf24", "#22c55e"],
        })
        await Promise.all([mutateProfile(), mutateFeathers()])
      }
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { error?: string } } }
      const errMsg = errorResponse?.response?.data?.error || (err instanceof Error ? err.message : "An error occurred.")
      setElecError(errMsg)
      setPin("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStep1Valid = !!disco && meterNumber.trim().length >= 6 && !!verifiedName
  const isStep2Valid = numericAmount >= 100
  const isStep3Valid = pin.length === 4

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
            <Zap className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">No Payment History</p>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              You haven't purchased any electricity units yet. Your transaction history will appear here.
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
                    Electricity Vending
                  </span>
                  <span className="text-xxs text-muted-foreground font-semibold">
                    {dateStr}
                  </span>
                </div>
                <span className="text-sm font-black text-foreground">
                  ₦{tx.amount.toLocaleString()}
                </span>
              </div>

              {tx.metadata?.token && (
                <div 
                  className="flex flex-col gap-1.5 bg-primary/5 dark:bg-primary/10 rounded-xl p-3 border border-primary/10 my-1 animate-in fade-in duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-[9px] font-bold text-primary/70 uppercase tracking-wider">
                        Electricity Token
                      </span>
                      <span className="font-mono text-base font-black text-primary tracking-wider select-all">
                        {tx.metadata.token}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1.5 border-primary/30 px-3 text-xs font-bold text-primary hover:bg-primary/10 cursor-pointer bg-transparent shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(tx.metadata.token)
                        toast.success("Token copied to clipboard")
                      }}
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                  </div>
                  {tx.metadata?.units && (
                    <div className="flex justify-between items-center border-t border-primary/10 pt-1.5 mt-0.5 text-xxs font-bold text-primary/80">
                      <span>Units Purchased</span>
                      <span className="font-mono text-primary font-black">{tx.metadata.units} kWh</span>
                    </div>
                  )}
                </div>
              )}
              
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

  const renderForm = () => {
    if (elecSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">Electricity Vended!</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {usePoints && pointsToDeduct > 0 ? (
                <>
                  ₦{numericAmount.toLocaleString()} electricity has been vended to meter {meterNumber}.
                  Charged {pointsToDeduct.toLocaleString()} points
                  {walletAmountToDeduct > 0 ? ` and ₦${walletAmountToDeduct.toLocaleString()} from your wallet` : ""}.
                </>
              ) : (
                <>
                  ₦{numericAmount.toLocaleString()} electricity has been vended to meter {meterNumber}. Your wallet has been debited.
                </>
              )}
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
      <form onSubmit={handlePurchase} className="flex-1 flex flex-col gap-4 py-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        {elecError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive text-center">
            {elecError}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between items-center px-1 border-b pb-2 mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            {step === 1 && "Step 1: Meter Details"}
            {step === 2 && "Step 2: Enter Amount"}
            {step === 3 && "Step 3: Secure Transaction PIN"}
          </span>
          <div className="flex gap-1">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 1 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 2 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", step === 3 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
          </div>
        </div>

        {/* ── STEP 1: METER DETAILS ── */}
        {step === 1 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Disco selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Electricity Provider (DISCO)</label>
              {isLoadingDiscos ? (
                <div className="h-11 w-full animate-pulse rounded-xl bg-muted/40" />
              ) : (
                <Select
                  value={disco}
                  onValueChange={(val) => {
                    setDisco(val)
                    setVerifiedName(null)
                    setVerifiedAddress(null)
                    setVerifyError(null)
                  }}
                >
                  <SelectTrigger className="h-11 rounded-xl border-muted text-sm font-semibold">
                    <SelectValue placeholder="Select DISCO" />
                  </SelectTrigger>
                  <SelectContent>
                    {discos.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Meter Type */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Meter Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(["PREPAID", "POSTPAID"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setMeterType(type)
                      setVerifiedName(null)
                      setVerifiedAddress(null)
                      setVerifyError(null)
                    }}
                    className={cn(
                      "h-11 rounded-xl border font-black text-sm transition-all shadow-xs flex items-center justify-center cursor-pointer",
                      meterType === type
                        ? "bg-primary border-primary text-primary-foreground shadow-xs"
                        : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Meter Number + Verify */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Meter Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={meterNumber}
                  onChange={(e) => {
                    setMeterNumber(e.target.value)
                    setVerifiedName(null)
                    setVerifiedAddress(null)
                    setVerifyError(null)
                  }}
                  placeholder="e.g. 04123456789"
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all"
                />
                <Button
                  type="button"
                  disabled={isVerifying || meterNumber.trim().length < 6}
                  onClick={handleVerify}
                  className="h-11 rounded-xl font-bold text-xs px-4 cursor-pointer shrink-0"
                >
                  {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Search className="w-3.5 h-3.5 mr-1" /> Verify</>
                  )}
                </Button>
              </div>
              {verifyError && (
                <p className="text-xs text-destructive font-semibold mt-0.5">{verifyError}</p>
              )}
              {verifiedName && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs mt-0.5 space-y-0.5 animate-in fade-in duration-200">
                  <p className="text-primary font-bold">Verified Customer:</p>
                  <p className="font-semibold text-foreground">{verifiedName}</p>
                  {verifiedAddress && (
                    <p className="text-muted-foreground leading-normal">{verifiedAddress}</p>
                  )}
                </div>
              )}
            </div>

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
                onClick={() => setStep(2)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: AMOUNT + POINTS ── */}
        {step === 2 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Preset amounts */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setAmount(String(val))}
                    className={cn(
                      "h-8 rounded-lg border font-bold text-xs transition-all flex items-center justify-center cursor-pointer",
                      amount === String(val)
                        ? "bg-primary text-primary-foreground border-primary scale-105"
                        : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                    )}
                  >
                    {val >= 1000 ? `${val / 1000}k` : val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom Amount (Min ₦100)"
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all mt-2"
              />
            </div>

            {/* Use Points toggle */}
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
                      usePoints ? "bg-primary" : "bg-muted"
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
                      <span className="text-primary">-{pointsToDeduct.toLocaleString()} pts (≈ ₦{(pointsToDeduct / 2).toLocaleString()})</span>
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
                onClick={() => setStep(1)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={!isStep2Valid}
                onClick={() => setStep(3)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: PIN + SUMMARY ── */}
        {step === 3 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* PIN Input */}
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

            {/* Summary */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-muted/50 text-xs font-semibold text-muted-foreground space-y-1.5">
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold text-foreground text-right max-w-[65%] truncate">{verifiedName}</span>
              </div>
              <div className="flex justify-between">
                <span>Meter:</span>
                <span className="font-bold text-foreground">{meterNumber} ({meterType})</span>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span className="font-bold text-foreground uppercase">{discos.find(d => d.id === disco)?.name || disco}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-black text-foreground">₦{numericAmount.toLocaleString()}</span>
              </div>
              {usePoints && (
                <>
                  <div className="flex justify-between border-t border-dashed border-muted/80 pt-1.5 mt-0.5">
                    <span>Points to Use:</span>
                    <span className="font-bold text-primary">{pointsToDeduct.toLocaleString()} pts (≈ ₦{(pointsToDeduct / 2).toLocaleString()})</span>
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
                onClick={() => setStep(2)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isStep3Valid}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Vending...</>
                ) : (
                  <>Confirm Payment <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    )
  }

  const title = { 1: "Pay Electricity Bill", 2: "Select Amount", 3: "Security Verification" }[step as 1 | 2 | 3] || "Pay Electricity Bill"
  const description = {
    1: "Select your DISCO, meter type, and verify your meter number",
    2: "Enter the amount to vend and configure payment source",
    3: "Confirm your details and authorize with your transaction PIN",
  }[step as 1 | 2 | 3] || "Purchase electricity units for your meter"

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[95vh] px-4 pb-8 flex flex-col">
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
                        : "text-xs uppercase tracking-wider cursor-pointer text-primary pr-3"
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
          <div className={cn("px-2 py-2 flex-1 min-h-0 overflow-y-auto", (!elecSuccess && !showHistory) && "flex flex-col")}>
            {showHistory ? renderHistory() : renderForm()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] p-0 sm:max-w-[440px] h-[580px] max-h-[90vh] flex flex-col">
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
                      : "text-xs uppercase tracking-wider cursor-pointer text-primary pr-3"
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
        <div className={cn("p-6 pt-2 flex-1 min-h-0 overflow-y-auto flex flex-col", (elecSuccess || (showHistory && history.length === 0)) && "justify-center")}>
          {showHistory ? renderHistory() : renderForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
