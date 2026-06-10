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
import { nestPurseApi } from "@/lib/nestpurse-api"
import { useProfile } from "@/hooks/use-profile"
import { useNestFeathers } from "@/hooks/use-nestfeathers"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ArrowRight, Loader2, CheckCircle2, Smartphone } from "lucide-react"
import confetti from "canvas-confetti"

interface AirtimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

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

export function AirtimeDialog({ open, onOpenChange }: AirtimeDialogProps) {
  const isMobile = useIsMobile()
  const { profile, mutate: mutateProfile } = useProfile()
  const { mutate: mutateFeathers } = useNestFeathers()

  // Wizard flow states
  const [airtimeStep, setAirtimeStep] = React.useState<number>(1)
  const [isForSelf, setIsForSelf] = React.useState<boolean | null>(null)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [network, setNetwork] = React.useState("MTN")
  const [amount, setAmount] = React.useState("")
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
      setAmount("")
      setPin("")
      setAirtimeStep(1)
      setAirtimeError(null)
      setAirtimeSuccess(false)
    }
  }, [open])

  const isStep1Valid = phoneNumber.replace(/[\s\-\+]/g, "").length >= 10 && !!network
  const isStep2Valid = Number(amount) >= 50
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
      const res = await nestPurseApi.purchaseAirtime({
        phoneNumber,
        network,
        amount: Number(amount),
        pin,
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
        await Promise.all([mutateProfile(), mutateFeathers()])
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "An error occurred."
      setAirtimeError(errMsg)
    } finally {
      setIsSubmitting(false)
    }
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
              ₦{Number(amount).toLocaleString()} airtime has been sent to {phoneNumber}. Your wallet balance has been updated.
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
      <form onSubmit={handleBuyAirtime} className="flex-1 flex flex-col gap-4 py-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
        {airtimeError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive text-center">
            {airtimeError}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between items-center px-1 border-b pb-2 mb-1">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            {airtimeStep === 1 && "Step 1: Recipient & Network"}
            {airtimeStep === 2 && "Step 2: Enter Amount"}
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
                    placeholder={isForSelf ? "No phone number set in profile" : "e.g. 08055441122"}
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

        {/* STEP 2: ENTER AMOUNT */}
        {airtimeStep === 2 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Amount Selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[50, 100, 200, 500, 1000].map((val) => (
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
                    ₦{val}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Custom Amount (Min ₦50)"
                disabled={isSubmitting}
                className="w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all mt-2"
              />
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
                <span>Amount:</span>
                <span className="font-black text-foreground">₦{Number(amount).toLocaleString()}</span>
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
        <DrawerContent className="max-h-[95vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="mb-2 px-0 shrink-0">
            <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold">
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className={cn("px-2 py-2 flex-1 min-h-0 overflow-y-auto", !airtimeSuccess && "flex flex-col")}>
            {renderAirtimeForm()}
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
          {renderAirtimeForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
