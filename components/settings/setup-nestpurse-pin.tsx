"use client"

import * as React from "react"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, ShieldCheck, KeyRound, Mail, Smartphone, ArrowRight, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type FlowState = "initial" | "create" | "verify_current" | "verify_otp" | "success"

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

  React.useEffect(() => {
    fetchPinStatus()
  }, [])

  const fetchPinStatus = async () => {
    setIsLoading(true)
    try {
      const { data } = await authApi.getProfile()
      // The backend returns hasPin status inside the profile object
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

  const handleRequestOtp = async () => {
    if (currentPin.length !== 4) {
      toast.error("Current PIN must be 4 digits")
      return
    }

    setIsSubmitting(true)
    try {
      const { data, error } = await authApi.requestPinUpdateOtp({ currentPin, otpMedium })
      if (error) {
        toast.error(error)
      } else if (data?.sessionId) {
        setSessionId(data.sessionId)
        setFlow("verify_otp")
        toast.success(`OTP sent to your ${otpMedium === "email" ? "email" : "phone"}`)
      }
    } catch (err) {
      toast.error("Failed to request OTP")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("OTP must be 6 digits")
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await authApi.verifyPinUpdateOtp({ sessionId, otp })
      if (error) {
        toast.error(error)
      } else {
        // Backend resets PIN to null after successful OTP verification
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

  if (flow === "success") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">PIN Setup Complete</h3>
        <p className="text-muted-foreground max-w-xs mt-2 mx-auto">
          Your NestPurse transaction PIN is now active. Keep it safe!
        </p>
        <Button 
          variant="outline" 
          className="mt-8 rounded-full"
          onClick={() => {
            setFlow("initial")
            fetchPinStatus()
          }}
        >
          View PIN Settings
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg leading-none font-medium tracking-tight">
          Transaction PIN
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Your 4-digit PIN is required for all withdrawals, transfers, and
          high-value transactions.
        </p>
      </div>

      {/* Simplified Status */}
      <div
        className={cn(
          "flex items-center justify-between rounded-xl border p-4",
          hasPin
            ? "border-muted bg-muted/30"
            : "border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10"
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
            Status
          </span>
          <span
            className={cn(
              "text-sm font-semibold",
              !hasPin && "text-amber-600 dark:text-amber-400"
            )}
          >
            {hasPin ? "PIN is active" : "No PIN set"}
          </span>
        </div>
        {!hasPin && flow === "initial" && (
          <Button
            size="sm"
            className="rounded-lg"
            onClick={() => setFlow("create")}
          >
            Setup PIN
          </Button>
        )}
      </div>

      {/* Create Flow */}
      {flow === "create" && (
        <div className="animate-in space-y-6 duration-300 fade-in">
          <div className="grid max-w-sm gap-4">
            <Field>
              <FieldLabel>New PIN</FieldLabel>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="h-11 rounded-xl bg-muted/50 text-lg tracking-[0.5em]"
                value={newPin}
                onChange={(e) =>
                  setNewPin(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="****"
              />
            </Field>
            <Field>
              <FieldLabel>Confirm PIN</FieldLabel>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="h-11 rounded-xl bg-muted/50 text-lg tracking-[0.5em]"
                value={confirmPin}
                onChange={(e) =>
                  setConfirmPin(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="****"
              />
            </Field>
          </div>
          <div className="flex max-w-sm gap-3">
            <Button
              variant="ghost"
              className="h-10 flex-1 rounded-xl"
              onClick={() => setFlow("initial")}
            >
              Cancel
            </Button>
            <Button
              className="h-10 flex-1 rounded-xl"
              disabled={
                newPin.length !== 4 || newPin !== confirmPin || isSubmitting
              }
              onClick={handleCreatePin}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save PIN
            </Button>
          </div>
        </div>
      )}

      {/* Change PIN Flow - Step 1: Verify Current */}
      {hasPin && flow === "initial" && (
        <div className="animate-in duration-300 fade-in">
          <Button
            variant="outline"
            className="h-10 rounded-xl"
            onClick={() => setFlow("verify_current")}
          >
            Change Transaction PIN
          </Button>
        </div>
      )}

      {flow === "verify_current" && (
        <div className="animate-in space-y-6 duration-300 fade-in">
          <div className="grid max-w-sm gap-4">
            <Field>
              <FieldLabel>Current PIN</FieldLabel>
              <Input
                type="password"
                inputMode="numeric"
                maxLength={4}
                className="h-11 rounded-xl bg-muted/50 text-lg tracking-[0.5em]"
                value={currentPin}
                onChange={(e) =>
                  setCurrentPin(e.target.value.replace(/[^0-9]/g, ""))
                }
                placeholder="****"
              />
            </Field>

            <div className="space-y-3">
              <label className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Verification Method
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOtpMedium("email")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                    otpMedium === "email"
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setOtpMedium("sms")}
                  className={cn(
                    "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all",
                    otpMedium === "sms"
                      ? "border-primary/40 bg-primary/5 text-primary"
                      : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  SMS
                </button>
              </div>
            </div>
          </div>
          <div className="flex max-w-sm gap-3">
            <Button
              variant="ghost"
              className="h-10 flex-1 rounded-xl"
              onClick={() => setFlow("initial")}
            >
              Cancel
            </Button>
            <Button
              className="h-10 flex-1 rounded-xl"
              disabled={currentPin.length !== 4 || isSubmitting}
              onClick={handleRequestOtp}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Request OTP
            </Button>
          </div>
        </div>
      )}

      {flow === "verify_otp" && (
        <div className="max-w-sm animate-in space-y-6 duration-300 fade-in">
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold">Verify Identity</h4>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Enter the 6-digit code sent to your{" "}
                {otpMedium === "email" ? "email" : "phone"}.
              </p>
            </div>

            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="h-12 rounded-xl bg-muted/50 text-center text-2xl font-bold tracking-[0.25em]"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="000000"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              className="h-10 flex-1 rounded-xl"
              onClick={() => setFlow("verify_current")}
            >
              Back
            </Button>
            <Button
              className="h-10 flex-1 rounded-xl"
              disabled={otp.length !== 6 || isSubmitting}
              onClick={handleVerifyOtp}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verify
            </Button>
          </div>
        </div>
      )}

      {/* Security Tip */}
      <div className="rounded-2xl border border-dashed border-muted-foreground/20 p-5 bg-muted/5">
        <div className="flex items-start gap-3">
          <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0 animate-pulse" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Security Tip</p>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Never share your NestPurse PIN with anyone, including GrowNest staff. We will never ask for your PIN over email or chat.</p>
              </div>
        </div>
      </div>
    </div>
  )
}
