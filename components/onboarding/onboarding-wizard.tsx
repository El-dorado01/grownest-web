"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2,
  CheckCircle2,
  User,
  Smartphone,
  Lock,
  Wallet,
  ArrowRight,
  ChevronLeft,
  Building2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PinInput } from "@/components/ui/pin-input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format, subYears } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import NextImage from "next/image"
import { authApi } from "@/lib/auth-api"
import { nestPurseApi } from "@/lib/nestpurse-api"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/context/auth-context"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import confetti from "canvas-confetti"
import Link from "next/link"

const STEPS = [
  { id: "profile", title: "Personal Details", icon: User },
  { id: "phone", title: "Phone Verification", icon: Smartphone },
  { id: "purse", title: "Activate Wallet", icon: Wallet },
  { id: "security", title: "Secure Account", icon: Lock },
]

const AFRICAN_COUNTRIES = [
  { code: "234", name: "Nigeria", flagId: "ng" },
  { code: "233", name: "Ghana", flagId: "gh" },
  { code: "254", name: "Kenya", flagId: "ke" },
  { code: "27", name: "South Africa", flagId: "za" },
]

const GROWNEST_REASONS = [
  "Saving for a specific goal",
  "Daily expenses & budgeting",
  "Food procurement & grocery shopping",
  "Bulk food ordering for home/business",
  "Group savings with friends/family",
  "Access to investment opportunities",
  "Ease of cross-border transfers",
  "Others",
]

export function OnboardingWizard({
  isPreview = false,
}: {
  isPreview?: boolean
}) {
  const { user } = useAuth()
  const { profile, mutate } = useProfile()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [direction, setDirection] = React.useState(1) // 1 for next, -1 for prev

  // Profile Sub-step (Internal to Step 0)
  const [profileSubStep, setProfileSubStep] = React.useState(0)

  // --- Form States ---
  // Profile
  const [fullName, setFullName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [selectedReasons, setSelectedReasons] = React.useState<string[]>([])

  // Phone
  const [countryCode, setCountryCode] = React.useState("234")
  const [phone, setPhone] = React.useState("")
  const [phoneOtp, setPhoneOtp] = React.useState("")
  const [phoneStep, setPhoneStep] = React.useState<"input" | "verify">("input")
  const [phoneCountdown, setPhoneCountdown] = React.useState(0)

  // PIN
  const [pin, setPin] = React.useState("")
  const [confirmPin, setConfirmPin] = React.useState("")

  // Purse/Bank
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [hasInitialized, setHasInitialized] = React.useState(false)

  // --- Smart Step Detection (Resume where left off) ---
  React.useEffect(() => {
    if (profile && !hasInitialized) {
      if (isPreview) {
        setHasInitialized(true)
        return
      }

      if (!profile.fullName) {
        setCurrentStep(0)
      } else if (!profile.isPhoneVerified) {
        setCurrentStep(1)
      } else if (!profile.hasPurse) {
        setCurrentStep(2)
      } else if (!profile.hasPin) {
        setCurrentStep(3)
      } else {
        setIsSuccess(true)
      }
      setHasInitialized(true)
    }
  }, [profile, hasInitialized])

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const prevStep = () => {
    if (currentStep === 0 && profileSubStep === 1) {
      setProfileSubStep(0)
      setDirection(-1)
      return
    }

    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep(currentStep - 1)
    }
  }

  React.useEffect(() => {
    if (phoneCountdown > 0) {
      const timer = setTimeout(
        () => setPhoneCountdown(phoneCountdown - 1),
        1000
      )
      return () => clearTimeout(timer)
    }
  }, [phoneCountdown])

  const handleComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#cca751", "#b89543", "#8a6d2f"],
    })
    setIsSuccess(true)
  }

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    )
  }

  // --- Logic Handlers ---

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()

    // Validate Step 1 (Identity)
    if (!fullName || !dob || !gender) {
      toast.error("Please fill in all identity details")
      return
    }

    // Move to sub-step 2 if not there
    if (profileSubStep === 0) {
      setDirection(1)
      setProfileSubStep(1)
      return
    }

    // Sub-step 2 (Motivation)
    if (selectedReasons.length === 0) {
      toast.error("Please select at least one reason")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authApi.updateProfile({
        userId: user?.userId,
        fullName,
        dob,
        gender,
        reasonsForGrowNest: selectedReasons,
      })
      if (res.data) {
        await mutate()
        nextStep()
      } else {
        toast.error(res.error || "Failed to update profile")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone || !user?.userId) return

    setIsSubmitting(true)
    try {
      let localPhone = phone.replace(/\D/g, "")
      if (localPhone.startsWith("0")) localPhone = localPhone.substring(1)
      const formattedPhone = `${countryCode}${localPhone}`

      const res = await authApi.sendPhoneOtp({
        userId: user.userId,
        phone: formattedPhone,
      })
      if (res.data) {
        setPhoneStep("verify")
        setPhoneCountdown(60)
        toast.success("OTP sent!")
      } else {
        toast.error(res.error || "Failed to send OTP")
      }
    } catch (err) {
      toast.error("Failed to send OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyPhoneOtp = async (codeOverride?: string) => {
    const code = codeOverride || phoneOtp
    if (code.length < 6 || !user?.userId) return

    setIsSubmitting(true)
    try {
      const res = await authApi.verifyPhoneOtp({ userId: user.userId, code })
      if (res.data) {
        toast.success("Phone verified!")
        await mutate()
        nextStep()
      } else {
        toast.error(res.error || "Invalid code")
      }
    } catch (err) {
      toast.error("Verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pin.length < 4) {
      toast.error("Please enter a 4-digit PIN")
      return
    }
    if (pin !== confirmPin) {
      toast.error("PINs do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authApi.setNestPursePin({ newPin: pin })
      if (res.data) {
        toast.success("Security PIN set successfully")
        nextStep()
      } else {
        toast.error(res.error || "Failed to set PIN")
      }
    } catch (err) {
      toast.error("Failed to set PIN")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePurseSetup = async () => {
    setIsSubmitting(true)
    try {
      const res = await nestPurseApi.setupPurse({ linkedAccount: undefined })
      if (res.data) {
        mutate()
        handleComplete()
      } else {
        toast.error(res.error || "Failed to activate wallet")
      }
    } catch (err) {
      toast.error("Activation failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Remove the banks fetch effect as it's no longer needed

  const renderStep = () => {
    const step = STEPS[currentStep]

    switch (step.id) {
      case "profile":
        if (profileSubStep === 0) {
          return (
            <div className="space-y-6">
              <div className="space-y-4">
                <Field>
                  <FieldLabel>Full Name</FieldLabel>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ayomide Ahmad Chinedu"
                    required
                    className="h-12 rounded-xl bg-muted/50"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel>Date of Birth</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "h-12 w-full justify-start rounded-xl border-0 bg-muted/50 text-left font-normal ring-1 ring-border/50",
                            !dob && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                          {dob ? (
                            format(new Date(dob), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dob ? new Date(dob) : undefined}
                          onSelect={(date) =>
                            setDob(date ? format(date, "yyyy-MM-dd") : "")
                          }
                          disabled={(date) =>
                            date > subYears(new Date(), 16) ||
                            date < new Date("1900-01-01")
                          }
                          captionLayout="dropdown"
                          startMonth={new Date(1900, 0)}
                          endMonth={subYears(new Date(), 16)}
                        />
                      </PopoverContent>
                    </Popover>
                  </Field>
                  <Field>
                    <FieldLabel>Gender</FieldLabel>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="h-12! w-full rounded-xl bg-muted/50">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={() => handleProfileSubmit()}
                  className="h-12 flex-2 rounded-xl font-bold"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        } else {
          return (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold">
                  Why are you using GrowNest?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select all that apply to help us personalize your experience.
                </p>
              </div>
              <div className="grid gap-3">
                {GROWNEST_REASONS.map((reason) => {
                  const selected = selectedReasons.includes(reason)
                  return (
                    <button
                      key={reason}
                      onClick={() => toggleReason(reason)}
                      className={cn(
                        "group flex items-center justify-between rounded-2xl border p-4 text-left transition-all",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <span className="text-sm font-medium">{reason}</span>
                      {selected ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border border-border group-hover:border-primary/50" />
                      )}
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                {(currentStep > 0 || profileSubStep > 0) && (
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    className="h-12 flex-1 rounded-xl font-bold"
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                  </Button>
                )}
                <Button
                  onClick={() => handleProfileSubmit()}
                  disabled={isSubmitting}
                  className="h-12 flex-2 rounded-xl font-bold shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </div>
          )
        }
      case "phone":
        return (
          <div className="space-y-6">
            {phoneStep === "input" ? (
              <form onSubmit={handleSendPhoneOtp} className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Add your phone number to secure your account.
                </p>
                <div className="flex h-12 w-full overflow-hidden rounded-xl border bg-muted/50 focus-within:ring-2 focus-within:ring-primary">
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="h-full! w-[130px] border-0 bg-transparent focus:ring-0">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w20/${AFRICAN_COUNTRIES.find((c) => c.code === countryCode)?.flagId}.png`}
                            alt=""
                            className="h-auto w-4 rounded-sm"
                          />
                          <span>+{countryCode}</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {AFRICAN_COUNTRIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          <div className="flex items-center gap-2">
                            <img
                              src={`https://flagcdn.com/w20/${c.flagId}.png`}
                              alt={c.name}
                              className="h-auto w-4 rounded-sm"
                            />
                            <span>
                              {c.name} (+{c.code})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="09012345678"
                    className="h-full border-0 bg-transparent focus-visible:ring-0"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <Button
                      variant="ghost"
                      onClick={prevStep}
                      className="h-12 flex-1 rounded-xl font-bold"
                      disabled={isSubmitting}
                    >
                      <ChevronLeft className="mr-2 h-5 w-5" /> Back
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-12 flex-2 rounded-xl font-bold"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      "Send Code"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-sm text-muted-foreground">
                  Enter the code sent to your phone
                </p>
                <div className="flex justify-center">
                  <PinInput
                    length={6}
                    value={phoneOtp}
                    onChange={(val) => {
                      setPhoneOtp(val)
                      if (val.length === 6) handleVerifyPhoneOtp(val)
                    }}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => setPhoneStep("input")}
                    className="h-12 flex-1 rounded-xl font-bold"
                    disabled={isSubmitting}
                  >
                    <ChevronLeft className="mr-2 h-5 w-5" /> Back
                  </Button>
                  <Button
                    onClick={() => handleVerifyPhoneOtp()}
                    disabled={isSubmitting || phoneOtp.length < 6}
                    className="h-12 flex-2 rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Verifying...</span>
                      </div>
                    ) : (
                      "Verify & Continue"
                    )}
                  </Button>
                </div>

                <div className="pt-2 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={handleSendPhoneOtp}
                    disabled={isSubmitting || phoneCountdown > 0}
                  >
                    {phoneCountdown > 0
                      ? `Resend code in ${phoneCountdown}s`
                      : "Resend code"}
                  </Button>
                </div>

                <Button
                  variant="link"
                  onClick={() => setPhoneStep("input")}
                  className="w-full text-[10px] text-muted-foreground"
                >
                  Change phone number
                </Button>
              </div>
            )}
          </div>
        )
      case "security":
        return (
          <form onSubmit={handlePinSubmit} className="space-y-8">
            <div className="space-y-8">
              <div className="space-y-3 text-center">
                <h3 className="text-lg font-bold">Create Transaction PIN</h3>
                <p className="text-sm text-muted-foreground">
                  This PIN will be required for all your transactions.
                </p>
                <div className="flex justify-center pt-2">
                  <PinInput
                    length={4}
                    value={pin}
                    onChange={(val) => setPin(val)}
                  />
                </div>
              </div>

              {pin.length === 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="animate-in space-y-3 text-center duration-500 fade-in slide-in-from-bottom-4"
                >
                  <h3 className="text-lg font-bold">Confirm Transaction PIN</h3>
                  <p className="text-sm text-muted-foreground">
                    Please re-enter your PIN to confirm.
                  </p>
                  <div className="flex justify-center pt-2">
                    <PinInput
                      length={4}
                      value={confirmPin}
                      onChange={(val) => {
                        setConfirmPin(val)
                        if (val.length === 4 && pin === val) {
                          // Auto-submit or just let them click
                        }
                      }}
                    />
                  </div>
                  {confirmPin.length === 4 && pin !== confirmPin && (
                    <p className="mt-2 animate-bounce text-xs font-medium text-destructive">
                      PINs do not match. Please check and try again.
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  pin.length < 4 ||
                  confirmPin.length < 4 ||
                  pin !== confirmPin
                }
                className="h-12 w-full rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Securing...</span>
                  </div>
                ) : (
                  "Secure Account"
                )}
              </Button>
            </div>
          </form>
        )
      case "purse":
        return (
          <div className="space-y-6">
            <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-sm font-bold">
                  GrowNest Virtual Account
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Activate your wallet to get a dedicated Nigerian bank account.
                You can receive money from any bank directly into your
                NestPurse.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={prevStep}
                className="h-12 flex-1 rounded-xl font-bold"
                disabled={isSubmitting}
              >
                <ChevronLeft className="mr-2 h-5 w-5" /> Back
              </Button>
              <Button
                onClick={handlePurseSetup}
                disabled={isSubmitting}
                className="h-12 flex-2 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Activating...</span>
                  </div>
                ) : (
                  "Activate Purse"
                )}
              </Button>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  if (isSuccess) {
    return (
      <div className="animate-in space-y-6 p-8 text-center duration-500 fade-in zoom-in">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
          />
          <Sparkles className="h-12 w-12" />
        </div>
        <div>
          <h1 className="mb-2 text-3xl font-black tracking-tight">
            Welcome to GrowNest!
          </h1>
          <p className="mx-auto max-w-sm leading-relaxed text-muted-foreground">
            Your home is ready. Start planning your food budget and growing your
            savings today.
          </p>
        </div>
        <Button
          size="lg"
          className="h-14 w-full rounded-2xl text-lg font-black shadow-xl shadow-primary/20"
          asChild
        >
          <Link href="/">
            Enter Dashboard <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    )
  }

  const StepIcon = STEPS[currentStep].icon

  return (
    <div className="flex h-full flex-col bg-card relative">
      {/* Centered Welcome Header */}
      <div className="flex flex-col items-center justify-center px-8 pt-16 pb-2 text-center">
        <div className="mb-6 flex h-15 w-15 items-center justify-center rounded-[1.75rem] bg-primary/10 shadow-inner relative group">
          <div className="absolute inset-0 rounded-[1.75rem] bg-primary/5 scale-110 blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
          <NextImage src="/d_icon.png" alt="GrowNest" width={30} height={30} className="relative" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Welcome to GrowNest
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[280px] leading-relaxed font-medium">
          Complete these quick steps to fully activate your account.
        </p>
        <div className="mt-6 flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">
            {STEPS[currentStep].title} • {currentStep + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center px-8 pt-8">
        <div className="h-1 flex-1 max-w-[240px] rounded-full bg-muted overflow-hidden relative">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`${currentStep}-${profileSubStep}`}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
