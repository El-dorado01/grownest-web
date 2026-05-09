"use client"

import * as React from "react"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { 
  Loader2, 
  ShieldCheck, 
  KeyRound, 
  CheckCircle2, 
  ChevronLeft,
  Lock,
  Mail,
  Smartphone,
  ArrowRight,
  AlertTriangle
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PinInput } from "@/components/ui/pin-input"

type FlowState = "initial" | "create" | "verify_current" | "verify_otp" | "success"

const slideVariants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export function SetupNestPursePin() {
  const [flow, setFlow] = React.useState<FlowState>("initial")
  const [hasPin, setHasPin] = React.useState<boolean | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [currentPin, setCurrentPin] = React.useState("")
  const [newPin, setNewPin] = React.useState("")
  const [confirmPin, setConfirmPin] = React.useState("")
  const [otpMedium, setOtpMedium] = React.useState<"email" | "sms">("email")
  const [otp, setOtp] = React.useState("")
  const [sessionId, setSessionId] = React.useState("")
  const [showExitConfirm, setShowExitConfirm] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  React.useEffect(() => {
    fetchPinStatus()
  }, [])

  const fetchPinStatus = async () => {
    setIsLoading(true)
    try {
      const { data } = await authApi.getProfile()
      const hasPinStatus = (data as any)?.profile?.hasPin
      setHasPin(!!hasPinStatus)
    } catch (error) {
      console.error("Failed to fetch PIN status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreatePin = async () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be 4 digits")
      return
    }
    if (newPin !== confirmPin) {
      toast.error("PINs do not match")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authApi.setNestPursePin({ newPin })
      if (error) {
        toast.error(error)
      } else {
        toast.success("Transaction PIN set successfully!")
        setFlow("success")
        setHasPin(true)
      }
    } catch (err) {
      toast.error("Failed to set PIN. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestOtp = async (e?: React.MouseEvent | string) => {
    if (e && typeof e !== 'string') e.preventDefault()
    const pin = typeof e === 'string' ? e : currentPin
    if (pin.length !== 4) {
      toast.error("Current PIN must be 4 digits")
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await authApi.requestPinUpdateOtp({ currentPin: pin, otpMedium })
      if (error) {
        toast.error(error)
      } else if (data?.sessionId) {
        setSessionId(data.sessionId)
        setFlow("verify_otp")
        setCountdown(60)
        toast.success(`OTP sent to your ${otpMedium === "email" ? "email" : "phone"}`)
      }
    } catch (err) {
      toast.error("Failed to request OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e?: React.MouseEvent | string) => {
    if (e && typeof e !== 'string') e.preventDefault()
    const code = typeof e === 'string' ? e : otp
    if (code.length !== 6) {
      toast.error("OTP must be 6 digits")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authApi.verifyPinUpdateOtp({ sessionId, otp: code })
      if (error) {
        toast.error(error)
      } else {
        toast.success("Identity verified. You can now set a new PIN.")
        setNewPin("")
        setConfirmPin("")
        setFlow("create")
      }
    } catch (err) {
      toast.error("Verification failed")
    } finally {
      setIsSubmitting(false)
    }
  }

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (flow === "verify_otp" || flow === "create") {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [flow])

  const resetAll = () => {
    setFlow("initial")
    setCurrentPin("")
    setNewPin("")
    setConfirmPin("")
    setOtp("")
    setSessionId("")
  }

  const handleBackWithConfirm = () => {
    if ((flow === "verify_otp" || flow === "create") && !isSubmitting) {
      setShowExitConfirm(true)
    } else {
      resetAll()
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading your security settings...
        </p>
      </div>
    )
  }

  return (
    <div className="relative min-h-[400px]">
      <AnimatePresence mode="wait">
        {flow === "initial" && (
          <motion.div
            key="initial"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-xl font-bold tracking-tight">Transaction PIN</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Secure your wallet with a 4-digit PIN for withdrawals and transfers.
              </p>
            </div>

            {/* Improved Status Card */}
            <div
              className={cn(
                "group relative flex items-center justify-between rounded-xl border p-5",
                hasPin
                  ? "border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm shadow-primary/5"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10"
              )}
            >
              <div className="flex items-center gap-5">
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  hasPin ? "bg-primary text-white shadow-primary/20" : "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 shadow-amber-200/20"
                )}>
                  <KeyRound className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-bold tracking-widest text-muted-foreground uppercase opacity-80">
                    Security Status
                  </span>
                  <div className="flex items-center gap-2.5">
                    <span className={cn("text-sm font-semibold", !hasPin && "text-amber-600 dark:text-amber-400")}>
                      {hasPin ? "Protection Active" : "No PIN Setup"}
                    </span>
                    {hasPin && (
                      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tighter text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        Secure
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="sm"
                variant={hasPin ? "outline" : "default"}
                className={cn(
                  "h-10 rounded-xl px-5 text-xs font-bold",
                  hasPin && "border-primary/20 hover:bg-primary/5"
                )}
                onClick={() => setFlow(hasPin ? "verify_current" : "create")}
              >
                {hasPin ? "Change PIN" : "Setup Now"}
              </Button>
            </div>

            {/* Security Tip */}
            <div className="rounded-2xl border border-dashed border-muted-foreground/20 p-6 bg-muted/5 mt-2">
              <div className="flex items-start gap-4">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                <div className="space-y-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Security Protocol</p>
                  <p className="text-xs leading-relaxed text-muted-foreground/80 font-medium">
                    Never share your NestPurse PIN with anyone, including GrowNest staff. We will never ask for your PIN over email, chat, or phone calls.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {flow === "create" && (
          <motion.div
            key="create"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 rounded-full h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleBackWithConfirm}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">{hasPin ? "Set New PIN" : "Setup NestPurse PIN"}</h3>
                <p className="text-sm text-muted-foreground">Choose a secure 4-digit code for your transactions.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid gap-6">
                <Field>
                  <FieldLabel>Enter New PIN</FieldLabel>
                  <PinInput
                    value={newPin}
                    onChange={(val) => setNewPin(val)}
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel>Confirm New PIN</FieldLabel>
                  <PinInput
                    value={confirmPin}
                    onChange={(val) => setConfirmPin(val)}
                    disabled={isSubmitting}
                    autoFocus={false}
                  />
                </Field>
              </div>
              <Button 
                className="w-full h-12 text-base font-bold shadow-md shadow-primary/20"
                disabled={newPin.length !== 4 || newPin !== confirmPin || isSubmitting}
                onClick={handleCreatePin}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Save Transaction PIN
              </Button>
            </div>
          </motion.div>
        )}

        {flow === "verify_current" && (
          <motion.div
            key="verify_current"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 rounded-full h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleBackWithConfirm}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Change Transaction PIN</h3>
                <p className="text-sm text-muted-foreground">For security, please verify your current identity first.</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid gap-8">
                <Field>
                  <FieldLabel>Current 4-Digit PIN</FieldLabel>
                  <PinInput
                    value={currentPin}
                    onChange={(val) => {
                      setCurrentPin(val)
                      if (val.length === 4) handleRequestOtp(val)
                    }}
                    disabled={isSubmitting}
                  />
                </Field>

                <div className="space-y-4">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                    Verification Method
                  </label>
                  <div className="grid gap-3 mt-2">
                    {[
                      { id: "email", title: "Email Address", sub: "Receive code via your email", icon: Mail },
                      { id: "sms", title: "SMS / Phone", sub: "Receive code via text message", icon: Smartphone }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setOtpMedium(item.id as "email" | "sms")}
                        className={cn(
                          "flex items-center justify-between rounded-2xl border p-3.5 text-left transition-all duration-300 group",
                          otpMedium === item.id
                            ? "border-primary/40 bg-primary/5 ring-1 ring-primary/40 shadow-sm"
                            : "border-transparent bg-muted/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-9 w-9 rounded-xl flex items-center justify-center transition-colors",
                            otpMedium === item.id ? "bg-primary/10 text-primary" : "bg-background text-muted-foreground group-hover:text-foreground"
                          )}>
                            <item.icon className="h-4.5 w-4.5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{item.title}</span>
                            <span className="text-xs text-muted-foreground">{item.sub}</span>
                          </div>
                        </div>
                        <div className={cn(
                          "h-5 w-5 rounded-full border-2 flex items-center justify-center",
                          otpMedium === item.id ? "border-primary bg-primary shadow-lg shadow-primary/20" : "border-muted-foreground/20"
                        )}>
                          {otpMedium === item.id && <div className="h-2 w-2 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button 
                className="w-full rounded-2xl h-12 text-base font-bold shadow-md shadow-primary/20 mb-5"
                disabled={currentPin.length !== 4 || isSubmitting}
                onClick={handleRequestOtp}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <ArrowRight className="mr-2 h-5 w-5" />}
                Continue to Verification
              </Button>
            </div>
          </motion.div>
        )}

        {flow === "verify_otp" && (
          <motion.div
            key="verify_otp"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 rounded-full h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={handleBackWithConfirm}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">Verify Identity</h3>
                <p className="text-sm text-muted-foreground">We've sent a 6-digit code to your {otpMedium === "email" ? "email" : "phone"}.</p>
              </div>
            </div>

            <div className="space-y-8">
              <Field>
                <FieldLabel>Verification Code</FieldLabel>
                <PinInput
                  length={6}
                  value={otp}
                  onChange={(val) => {
                    setOtp(val)
                    if (val.length === 6) handleVerifyOtp(val)
                  }}
                  disabled={isSubmitting}
                />
              </Field>
              
              <div className="space-y-4">
                <Button 
                  className="w-full h-12 text-base font-bold shadow-md shadow-primary/20"
                  disabled={otp.length !== 6 || isSubmitting}
                  onClick={handleVerifyOtp}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                  Verify & Continue
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Didn't receive the code? <button className="text-primary font-bold hover:underline disabled:opacity-50" onClick={handleRequestOtp} disabled={countdown > 0}>
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend"}
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {flow === "success" && (
          <motion.div
            key="success"
            variants={slideVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Setup Complete</h3>
            <p className="text-muted-foreground max-w-xs mt-3 mx-auto">
              Your NestPurse transaction PIN has been successfully updated and is now active.
            </p>
            <Button 
              variant="outline" 
              className="mt-10 rounded-full px-8 h-11 font-semibold border-primary/20 hover:bg-primary/5"
              onClick={() => {
                resetAll()
                fetchPinStatus()
              }}
            >
              Return to Settings
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-xl font-bold">Discard Progress?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                You are in the middle of a secure process. If you go back now, you will need to restart the verification from the beginning.
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>
          <AlertDialogFooter className="h-30 md:h-auto flex-col sm:flex-row gap-3 mt-4">
            <AlertDialogCancel className="h-12 rounded-xl flex-1 mt-0">Keep Verifying</AlertDialogCancel>
            <AlertDialogAction 
              onClick={resetAll}
              className="h-12 rounded-xl flex-1 bg-destructive hover:bg-destructive/90"
            >
              Yes, Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
