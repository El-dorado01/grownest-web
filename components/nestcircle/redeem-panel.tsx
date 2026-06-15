"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useProfile } from "@/hooks/use-profile"
import { nestCircleApi, RedeemPayload } from "@/lib/nestcircle-api"
import {
  Smartphone,
  Wifi,
  Tv,
  Zap,
  Coins,
  ArrowRight,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
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
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { detectNetwork, CABLE_PLANS, parsePlanDetails, DataPlan } from "./utils"

interface RedeemPanelProps {
  pointsBalance: number
  minPoints: number
  minNaira: number
  onSuccess: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RedeemPanel({
  pointsBalance,
  minPoints,
  onSuccess,
  open,
  onOpenChange,
}: RedeemPanelProps) {
  const isMobile = useIsMobile()
  const { profile, mutate: mutateProfile } = useProfile()

  // Wizard flow states
  const [redemptionStep, setRedemptionStep] = React.useState<number>(1)
  const [redemptionType, setRedemptionType] = React.useState<'airtime' | 'data' | 'cabletv' | 'electricity'>('airtime')

  // Shared recipient states (for airtime & data)
  const [isForSelf, setIsForSelf] = React.useState<boolean | null>(null)
  const [phoneNumber, setPhoneNumber] = React.useState("")
  const [network, setNetwork] = React.useState("MTN")

  // Electricity states
  const [disco, setDisco] = React.useState("")
  const [isLoadingDiscos, setIsLoadingDiscos] = React.useState(false)
  const [meterNumber, setMeterNumber] = React.useState("")
  const [meterType, setMeterType] = React.useState("PREPAID")
  const [discos, setDiscos] = React.useState<Array<{ id: string; name: string }>>([])

  // Cable TV states
  const [cableTvType, setCableTvType] = React.useState("dstv")
  const [smartcardNo, setSmartcardNo] = React.useState("")

  // Verification lookup states (for Electricity and Cable TV)
  const [isVerifyingCustomer, setIsVerifyingCustomer] = React.useState(false)
  const [verifiedCustomerName, setVerifiedCustomerName] = React.useState<string | null>(null)
  const [verifiedCustomerAddress, setVerifiedCustomerAddress] = React.useState<string | null>(null)
  const [verificationError, setVerificationError] = React.useState<string | null>(null)

  // Data plans states
  const [dataPlans, setDataPlans] = React.useState<DataPlan[]>([])
  const [isLoadingDataPlans, setIsLoadingDataPlans] = React.useState(false)
  const [selectedDataPlan, setSelectedDataPlan] = React.useState<DataPlan | null>(null)
  const [dataSearchQuery, setDataSearchQuery] = React.useState("")

  // Cable TV plans states
  const [selectedCablePlan, setSelectedCablePlan] = React.useState<{ name: string; amount: number } | null>(null)

  // Presets & inputs for points
  const [pointsToRedeem, setPointsToRedeem] = React.useState(minPoints)
  const [pin, setPin] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [redemptionError, setRedemptionError] = React.useState<string | null>(null)
  const [redemptionSuccess, setRedemptionSuccess] = React.useState(false)

  const pinInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch discos for electricity
  React.useEffect(() => {
    if (open && redemptionType === 'electricity' && discos.length === 0) {
      const fetchDiscos = async () => {
        setIsLoadingDiscos(true)
        try {
          const { nestPurseApi } = await import("@/lib/nestpurse-api")
          const res = await nestPurseApi.getElectricityDiscos()
          if (res.data?.discos) {
            setDiscos(res.data.discos)
            if (res.data.discos.length > 0) {
              setDisco(res.data.discos[0].id)
            }
          } else {
            const fallback = [
              { id: "phed", name: "Port Harcourt (PHED)" },
              { id: "jed", name: "Jos Electric (JEDC)" },
              { id: "kaduna", name: "Kaduna Electric (KAEDCO)" },
              { id: "ibedc", name: "Ibadan Electric (IBEDC)" },
              { id: "eko", name: "Eko Electric (EKEDC)" },
              { id: "benin", name: "Benin Electric (BEDC)" },
              { id: "abuja", name: "Abuja Electric (AEDC)" },
              { id: "kano", name: "Kano Electric (KEDCO)" },
              { id: "ikeja", name: "Ikeja Electric (IKEDC)" },
              { id: "enugu", name: "Enugu Electric (EEDC)" }
            ]
            setDiscos(fallback)
            setDisco(fallback[0].id)
          }
        } catch {
          const fallback = [
            { id: "phed", name: "Port Harcourt (PHED)" },
            { id: "jed", name: "Jos Electric (JEDC)" },
            { id: "kaduna", name: "Kaduna Electric (KAEDCO)" },
            { id: "ibedc", name: "Ibadan Electric (IBEDC)" },
            { id: "eko", name: "Eko Electric (EKEDC)" },
            { id: "benin", name: "Benin Electric (BEDC)" },
            { id: "abuja", name: "Abuja Electric (AEDC)" },
            { id: "kano", name: "Kano Electric (KEDCO)" },
            { id: "ikeja", name: "Ikeja Electric (IKEDC)" },
            { id: "enugu", name: "Enugu Electric (EEDC)" }
          ]
          setDiscos(fallback)
          setDisco(fallback[0].id)
        } finally {
          setIsLoadingDiscos(false)
        }
      }
      fetchDiscos()
    }
  }, [open, redemptionType, discos.length])

  // Fetch data plans
  React.useEffect(() => {
    if (open && redemptionStep === 2 && redemptionType === 'data' && network) {
      const fetchPlans = async () => {
        setIsLoadingDataPlans(true)
        try {
          const { nestPurseApi } = await import("@/lib/nestpurse-api")
          const res = await nestPurseApi.getDataPlans(network)
          if (res.data?.plans) {
            setDataPlans(res.data.plans)
          }
        } catch (err) {
          console.error("Failed to load data plans", err)
        } finally {
          setIsLoadingDataPlans(false)
        }
      }
      fetchPlans()
    }
  }, [open, redemptionStep, redemptionType, network])

  // Reset fields when redemptionType changes
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setRedemptionError(null)
    setVerificationError(null)
    setVerifiedCustomerName(null)
    setVerifiedCustomerAddress(null)
    setSelectedDataPlan(null)
    setSelectedCablePlan(null)
    setPin("")
    setRedemptionStep(1)
  }, [redemptionType])

  // Auto focus PIN field on step 3
  React.useEffect(() => {
    if (redemptionStep === 3) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [redemptionStep])

  // Reset form states on open/close
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    if (open) {
      setIsForSelf(true)
      const phone = profile?.phone || ""
      setPhoneNumber(phone)
      const detected = phone ? detectNetwork(phone) : null
      setNetwork(detected || "MTN")
      setPointsToRedeem(minPoints)
      setPin("")
      setRedemptionType('airtime')
      setRedemptionStep(1)
      setRedemptionError(null)
      setRedemptionSuccess(false)
      setMeterNumber("")
      setSmartcardNo("")
      setVerifiedCustomerName(null)
      setVerifiedCustomerAddress(null)
      setVerificationError(null)
      setSelectedDataPlan(null)
      setSelectedCablePlan(null)
    }
  }, [open, profile?.phone, minPoints])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleVerifyElectricity = async () => {
    if (!meterNumber || !disco) return
    setIsVerifyingCustomer(true)
    setVerificationError(null)
    setVerifiedCustomerName(null)
    setVerifiedCustomerAddress(null)
    try {
      const { nestPurseApi } = await import("@/lib/nestpurse-api")
      const res = await nestPurseApi.lookupElectricity({ disco, customerId: meterNumber })
      if (res.error) {
        setVerificationError(res.error)
      } else if (res.data?.customerName || res.data?.name) {
        setVerifiedCustomerName(res.data.customerName || res.data.name || "")
        setVerifiedCustomerAddress(res.data.customerAddress || "No address returned")
      } else {
        setVerificationError("Meter number could not be verified.")
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to verify meter number."
      setVerificationError(errMsg)
    } finally {
      setIsVerifyingCustomer(false)
    }
  }

  const handleVerifyCable = async () => {
    if (!smartcardNo || !cableTvType) return
    setIsVerifyingCustomer(true)
    setVerificationError(null)
    setVerifiedCustomerName(null)
    try {
      const { nestPurseApi } = await import("@/lib/nestpurse-api")
      const res = await nestPurseApi.lookupCable({ cableTvType, customerId: smartcardNo })
      if (res.error) {
        setVerificationError(res.error)
      } else if (res.data?.customerName || res.data?.name) {
        setVerifiedCustomerName(res.data.customerName || res.data.name || "")
      } else {
        setVerificationError("Smartcard number could not be verified.")
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to verify smartcard number."
      setVerificationError(errMsg)
    } finally {
      setIsVerifyingCustomer(false)
    }
  }

  const nairaValue = React.useMemo(() => {
    if (redemptionType === 'airtime' || redemptionType === 'electricity') {
      return pointsToRedeem / 2
    }
    if (redemptionType === 'data' && selectedDataPlan) {
      return selectedDataPlan.amount
    }
    if (redemptionType === 'cabletv' && selectedCablePlan) {
      return selectedCablePlan.amount
    }
    return 0
  }, [redemptionType, pointsToRedeem, selectedDataPlan, selectedCablePlan])

  const calculatedPointsNeeded = React.useMemo(() => {
    if (redemptionType === 'airtime' || redemptionType === 'electricity') {
      return pointsToRedeem
    }
    if (redemptionType === 'data' && selectedDataPlan) {
      return selectedDataPlan.amount * 2
    }
    if (redemptionType === 'cabletv' && selectedCablePlan) {
      return selectedCablePlan.amount * 2
    }
    return 0
  }, [redemptionType, pointsToRedeem, selectedDataPlan, selectedCablePlan])

  const isStep1Valid = React.useMemo(() => {
    if (redemptionType === 'airtime' || redemptionType === 'data') {
      return phoneNumber.replace(/[\s\-\+]/g, "").length >= 10 && !!network
    }
    if (redemptionType === 'cabletv') {
      return !!cableTvType && !!smartcardNo && !!verifiedCustomerName
    }
    if (redemptionType === 'electricity') {
      return !!disco && !!meterNumber && !!meterType && !!verifiedCustomerName
    }
    return false
  }, [redemptionType, phoneNumber, network, cableTvType, smartcardNo, verifiedCustomerName, disco, meterNumber, meterType])

  const isStep2Valid = React.useMemo(() => {
    if (redemptionType === 'airtime' || redemptionType === 'electricity') {
      return pointsToRedeem >= minPoints && pointsToRedeem <= pointsBalance
    }
    if (redemptionType === 'data') {
      return !!selectedDataPlan && (selectedDataPlan.amount * 2) <= pointsBalance
    }
    if (redemptionType === 'cabletv') {
      return !!selectedCablePlan && (selectedCablePlan.amount * 2) <= pointsBalance
    }
    return false
  }, [redemptionType, pointsToRedeem, minPoints, pointsBalance, selectedDataPlan, selectedCablePlan])

  const isStep3Valid = pin.length === 4

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault()

    if (redemptionStep === 1) {
      if (isStep1Valid) {
        setRedemptionStep(2)
      }
      return
    }
    if (redemptionStep === 2) {
      if (isStep2Valid) {
        setRedemptionStep(3)
      }
      return
    }

    if (calculatedPointsNeeded > pointsBalance) {
      setRedemptionError("Insufficient points balance.")
      return
    }

    setIsSubmitting(true)
    setRedemptionError(null)

    try {
      const payload: RedeemPayload = {
        redemptionType,
        pointsToRedeem: calculatedPointsNeeded,
        pin,
      }

      if (redemptionType === 'airtime' || redemptionType === 'data') {
        payload.phoneNumber = phoneNumber
        payload.network = network
      } else if (redemptionType === 'electricity') {
        payload.disco = disco
        payload.customerId = meterNumber
        payload.meterType = meterType
      } else if (redemptionType === 'cabletv') {
        payload.cableTvType = cableTvType
        payload.customerId = smartcardNo
      }

      const res = await nestCircleApi.redeemPoints(payload)

      if (res.error) {
        setRedemptionError(res.error || "Failed to redeem points. Please try again.")
        setPin("")
      } else {
        setRedemptionSuccess(true)
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
    } catch (err) {
      const errMsg = (err as { response?: { data?: { error?: string } }; message?: string }).response?.data?.error || (err as Error).message || "An error occurred."
      setRedemptionError(errMsg)
      setPin("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderRedeemForm = () => {
    if (redemptionSuccess) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-10 w-10 fill-emerald-500 text-white dark:fill-transparent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-black text-foreground">Redemption Successful!</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Successfully redeemed {calculatedPointsNeeded.toLocaleString()} points for your {redemptionType} transaction worth ₦{nairaValue.toLocaleString()}.
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
      <form onSubmit={handleRedeem} className="flex-1 flex flex-col gap-4 py-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-300 min-h-0">
        {redemptionError && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-bold text-destructive text-center shrink-0">
            {redemptionError}
          </div>
        )}

        {/* Step Indicator */}
        <div className="flex justify-between items-center px-1 border-b pb-2 mb-1 shrink-0">
          <span className="text-xs font-black uppercase tracking-wider text-primary">
            {redemptionStep === 1 && "Step 1: Configure Service"}
            {redemptionStep === 2 && "Step 2: Points to Redeem"}
            {redemptionStep === 3 && "Step 3: Secure PIN Auth"}
          </span>
          <div className="flex gap-1">
            <div className={cn("h-1.5 rounded-full transition-all duration-300", redemptionStep === 1 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", redemptionStep === 2 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
            <div className={cn("h-1.5 rounded-full transition-all duration-300", redemptionStep === 3 ? "bg-primary w-4.5" : "bg-muted w-1.5")} />
          </div>
        </div>

        {/* STEP 1: CONFIGURE SERVICE */}
        {redemptionStep === 1 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 min-h-0 overflow-y-auto">
            {/* Redemption Tabs */}
            <div className="flex border rounded-xl p-1 bg-muted/40 shrink-0 gap-1">
              {[
                { id: 'airtime', label: 'Airtime', icon: <Smartphone className="w-3.5 h-3.5" /> },
                { id: 'data', label: 'Data', icon: <Wifi className="w-3.5 h-3.5" /> },
                { id: 'cabletv', label: 'Cable TV', icon: <Tv className="w-3.5 h-3.5" /> },
                { id: 'electricity', label: 'Electricity', icon: <Zap className="w-3.5 h-3.5" /> },
              ].map((tab) => {
                const isActive = redemptionType === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRedemptionType(tab.id as 'airtime' | 'data' | 'cabletv' | 'electricity')}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all cursor-pointer",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-xs" 
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    )}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* AIRTIME & DATA STEP 1 */}
            {(redemptionType === 'airtime' || redemptionType === 'data') && (
              <div className="space-y-4 text-left">
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
                          ? "bg-primary border-primary text-primary-foreground"
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
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                      )}
                    >
                      For Others
                    </button>
                  </div>
                </div>

                {isForSelf !== null && (
                  <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone Number</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => {
                          const val = e.target.value
                          setPhoneNumber(val)
                          const detected = detectNetwork(val)
                          if (detected) setNetwork(detected)
                        }}
                        placeholder={isForSelf ? "No phone number set in profile" : "e.g. 08012345678"}
                        disabled={isSubmitting || isForSelf}
                        className={cn(
                          "w-full h-11 px-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all",
                          isForSelf && "opacity-75 bg-muted/20 cursor-not-allowed"
                        )}
                      />
                    </div>

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
                                "h-10 rounded-xl border font-black text-xs tracking-wide transition-all flex items-center justify-center cursor-pointer",
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
              </div>
            )}

            {/* CABLE TV STEP 1 */}
            {redemptionType === 'cabletv' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Cable Provider</label>
                  <Select value={cableTvType} onValueChange={(val) => { setCableTvType(val); setVerifiedCustomerName(null); setSelectedCablePlan(null); }}>
                    <SelectTrigger className="rounded-xl border-muted h-11 text-sm font-semibold">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dstv">DSTV</SelectItem>
                      <SelectItem value="gotv">GOtv</SelectItem>
                      <SelectItem value="startimes">StarTimes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Smartcard / Customer ID</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={smartcardNo}
                      onChange={(e) => { setSmartcardNo(e.target.value); setVerifiedCustomerName(null); }}
                      placeholder="e.g. 1023456789"
                      className="rounded-xl border-muted h-11 text-sm font-semibold flex-1"
                    />
                    <Button
                      type="button"
                      disabled={isVerifyingCustomer || !smartcardNo}
                      onClick={handleVerifyCable}
                      className="h-11 rounded-xl font-bold text-xs px-4 cursor-pointer"
                    >
                      {isVerifyingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  {verificationError && (
                    <p className="text-xs text-destructive font-semibold mt-1">{verificationError}</p>
                  )}
                  {verifiedCustomerName && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs mt-1">
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold">Verified Owner:</p>
                      <p className="font-semibold text-foreground">{verifiedCustomerName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ELECTRICITY STEP 1 */}
            {redemptionType === 'electricity' && (
              <div className="space-y-4 text-left">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Disco Provider</label>
                  {isLoadingDiscos ? (
                    <div className="h-11 w-full animate-pulse rounded-xl bg-muted/40" />
                  ) : (
                    <Select value={disco} onValueChange={(val) => { setDisco(val); setVerifiedCustomerName(null); }}>
                      <SelectTrigger className="rounded-xl border-muted h-11 text-sm font-semibold">
                        <SelectValue placeholder="Select Disco" />
                      </SelectTrigger>
                      <SelectContent>
                        {discos.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Meter Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["PREPAID", "POSTPAID"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMeterType(t)}
                        className={cn(
                          "h-10 rounded-xl border font-black text-xs transition-all shadow-xs cursor-pointer",
                          meterType === t
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-muted text-muted-foreground hover:bg-muted/30"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Meter Number</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={meterNumber}
                      onChange={(e) => { setMeterNumber(e.target.value); setVerifiedCustomerName(null); }}
                      placeholder="e.g. 04123456789"
                      className="rounded-xl border-muted h-11 text-sm font-semibold flex-1"
                    />
                    <Button
                      type="button"
                      disabled={isVerifyingCustomer || !meterNumber}
                      onClick={handleVerifyElectricity}
                      className="h-11 rounded-xl font-bold text-xs px-4 cursor-pointer"
                    >
                      {isVerifyingCustomer ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  {verificationError && (
                    <p className="text-xs text-destructive font-semibold mt-1">{verificationError}</p>
                  )}
                  {verifiedCustomerName && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs mt-1 space-y-1">
                      <p className="text-emerald-700 dark:text-emerald-400 font-bold">Verified Owner:</p>
                      <p className="font-semibold text-foreground">{verifiedCustomerName}</p>
                      {verifiedCustomerAddress && (
                        <>
                          <p className="text-emerald-700 dark:text-emerald-400 font-bold mt-1">Address:</p>
                          <p className="font-semibold text-foreground leading-normal">{verifiedCustomerAddress}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 1 Footer */}
            <div className="flex gap-2 border-t pt-4 mt-auto shrink-0">
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
                onClick={() => setRedemptionStep(2)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: POINTS / PACKAGE SELECTION */}
        {redemptionStep === 2 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300 min-h-0">
            {/* Balance Display */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3.5 flex items-center justify-between shrink-0">
              <div className="text-left">
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Your Points Balance</p>
                <p className="text-xl font-black text-primary">{pointsBalance.toLocaleString()} pts</p>
                <p className="text-xs text-muted-foreground">≈ ₦{(pointsBalance / 2).toLocaleString()}</p>
              </div>
              <Coins className="w-8 h-8 text-primary/40" />
            </div>

            {/* AIRTIME & ELECTRICITY STEP 2 (Custom amount of points) */}
            {(redemptionType === 'airtime' || redemptionType === 'electricity') && (
              <div className="flex flex-col gap-2 shrink-0 text-left">
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
                  Rate: 2 points = ₦1 · You&apos;ll redeem <strong className="text-foreground">{pointsToRedeem.toLocaleString()} pts</strong> for <strong className="text-foreground">₦{nairaValue.toLocaleString()}</strong> value.
                </p>
              </div>
            )}

            {/* DATA STEP 2 */}
            {redemptionType === 'data' && (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <div className="relative shrink-0">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={dataSearchQuery}
                    onChange={(e) => setDataSearchQuery(e.target.value)}
                    placeholder="Search data plans..."
                    disabled={isLoadingDataPlans}
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-muted bg-card text-foreground placeholder:text-muted-foreground/60 focus:outline-hidden focus:border-primary focus:ring-1 focus:ring-primary text-sm font-semibold transition-all"
                  />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                  {isLoadingDataPlans ? (
                    <div className="flex flex-col gap-2 py-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-muted/40 border border-muted/20" />
                      ))}
                    </div>
                  ) : dataPlans.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-2 text-muted-foreground">
                      <Wifi className="h-8 w-8 opacity-25" />
                      <p className="text-xs font-semibold">No data plans found.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 py-1 pr-1">
                      {dataPlans.filter(p => !dataSearchQuery || p.plan.toLowerCase().includes(dataSearchQuery.toLowerCase())).map((item, idx) => {
                        const parsed = parsePlanDetails(item.plan)
                        const isSelected = selectedDataPlan?.plan === item.plan
                        const pointsCost = item.amount * 2
                        const isAffordable = pointsCost <= pointsBalance
                        return (
                          <button
                            key={`${item.plan}-${idx}`}
                            type="button"
                            disabled={!isAffordable}
                            onClick={() => setSelectedDataPlan(item)}
                            className={cn(
                              "w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between gap-4 cursor-pointer",
                              isSelected
                                ? "bg-primary/10 border-primary text-primary-foreground font-black shadow-xs ring-1 ring-primary"
                                : "bg-card border-muted text-foreground hover:bg-muted/20",
                              !isAffordable && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>
                                {parsed.allowance}
                              </span>
                              <span className="text-xxs text-muted-foreground font-medium">
                                Cost: {pointsCost.toLocaleString()} pts
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={cn("text-sm font-black", isSelected ? "text-primary" : "text-foreground")}>
                                ₦{item.amount.toLocaleString()}
                              </span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* CABLE TV STEP 2 */}
            {redemptionType === 'cabletv' && (
              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0 text-left">Choose package</p>
                <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 py-1">
                  {(CABLE_PLANS[cableTvType] || []).map((item, idx) => {
                    const isSelected = selectedCablePlan?.name === item.name
                    const pointsCost = item.amount * 2
                    const isAffordable = pointsCost <= pointsBalance
                    return (
                      <button
                        key={`${item.name}-${idx}`}
                        type="button"
                        disabled={!isAffordable}
                        onClick={() => setSelectedCablePlan(item)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-center justify-between gap-4 cursor-pointer",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary-foreground font-black shadow-xs ring-1 ring-primary"
                            : "bg-card border-muted text-foreground hover:bg-muted/20",
                          !isAffordable && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className={cn("text-sm font-bold", isSelected ? "text-primary" : "text-foreground")}>
                            {item.name}
                          </span>
                          <span className="text-xxs text-muted-foreground font-medium">
                            Cost: {pointsCost.toLocaleString()} pts
                          </span>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-sm font-black", isSelected ? "text-primary" : "text-foreground")}>
                            ₦{item.amount.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Step 2 Footer */}
            <div className="flex gap-2 border-t pt-4 mt-auto shrink-0">
              <Button
                type="button"
                variant="ghost"
                disabled={isSubmitting}
                onClick={() => setRedemptionStep(1)}
                className="flex-1 h-10 rounded-full font-bold text-sm cursor-pointer"
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={!isStep2Valid}
                onClick={() => setRedemptionStep(3)}
                className="flex-1 h-10 rounded-full font-bold gap-2 text-sm text-primary-foreground bg-primary hover:bg-primary/90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: SECURITY AUTH & TRANSACTION SUMMARY */}
        {redemptionStep === 3 && (
          <div className="flex-1 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Transaction PIN */}
            <div className="flex flex-col gap-2 text-left">
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
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-muted/50 text-xs font-semibold text-muted-foreground space-y-1.5 text-left">
              {verifiedCustomerName && (
                <div className="flex justify-between">
                  <span>Owner:</span>
                  <span className="font-bold text-foreground text-right">{verifiedCustomerName}</span>
                </div>
              )}
              {redemptionType === 'airtime' && (
                <>
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
                </>
              )}
              {redemptionType === 'data' && (
                <>
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span className="font-bold text-foreground">{isForSelf ? "Self" : "Others"} ({phoneNumber})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Network:</span>
                    <span className="font-bold text-foreground">{network}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-bold text-foreground text-right max-w-[75%] truncate">{selectedDataPlan?.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points to Redeem:</span>
                    <span className="font-bold text-foreground">{calculatedPointsNeeded.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Data Value:</span>
                    <span className="font-black text-foreground">₦{nairaValue.toLocaleString()}</span>
                  </div>
                </>
              )}
              {redemptionType === 'cabletv' && (
                <>
                  <div className="flex justify-between">
                    <span>Smartcard:</span>
                    <span className="font-bold text-foreground">{smartcardNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Provider:</span>
                    <span className="font-bold text-foreground uppercase">{cableTvType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan:</span>
                    <span className="font-bold text-foreground text-right max-w-[75%] truncate">{selectedCablePlan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points to Redeem:</span>
                    <span className="font-bold text-foreground">{calculatedPointsNeeded.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subscription Value:</span>
                    <span className="font-black text-foreground">₦{nairaValue.toLocaleString()}</span>
                  </div>
                </>
              )}
              {redemptionType === 'electricity' && (
                <>
                  <div className="flex justify-between">
                    <span>Meter:</span>
                    <span className="font-bold text-foreground">{meterNumber} ({meterType})</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Disco:</span>
                    <span className="font-bold text-foreground uppercase">{disco}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Points to Redeem:</span>
                    <span className="font-bold text-foreground">{calculatedPointsNeeded.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vended Value:</span>
                    <span className="font-black text-foreground">₦{nairaValue.toLocaleString()}</span>
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
                onClick={() => setRedemptionStep(2)}
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
    1: "Configure Service",
    2: "Select Points",
    3: "Security Verification",
  }[redemptionStep as 1 | 2 | 3] || "Redeem Points"

  const description = {
    1: "Configure recipient details and service provider info",
    2: "Select the data package, cable subscription, or amount of points to redeem",
    3: "Confirm details and authorize points redemption with transaction PIN",
  }[redemptionStep as 1 | 2 | 3] || "Convert points to airtime, data, cable, or electricity"

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="mb-2 px-0 shrink-0">
            <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold text-foreground">
              {title}
            </DrawerTitle>
            <DrawerDescription className="text-center">{description}</DrawerDescription>
          </DrawerHeader>
          <div className={cn("px-2 py-2 flex-1 min-h-0 overflow-y-auto", !redemptionSuccess && "flex flex-col")}>
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
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-foreground">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className={cn("p-6 pt-2 flex-1 min-h-0 overflow-y-auto flex flex-col", redemptionSuccess && "justify-center")}>
          {renderRedeemForm()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
