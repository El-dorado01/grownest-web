"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, SmartphoneIcon, CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { PinInput } from "@/components/ui/pin-input"
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

const AFRICAN_COUNTRIES = [
  { code: "234", name: "Nigeria", flagId: "ng" },
  { code: "233", name: "Ghana", flagId: "gh" },
  { code: "254", name: "Kenya", flagId: "ke" },
  { code: "27", name: "South Africa", flagId: "za" },
  { code: "20", name: "Egypt", flagId: "eg" },
  { code: "256", name: "Uganda", flagId: "ug" },
  { code: "255", name: "Tanzania", flagId: "tz" },
  { code: "250", name: "Rwanda", flagId: "rw" },
  { code: "212", name: "Morocco", flagId: "ma" },
  { code: "225", name: "Ivory Coast", flagId: "ci" },
  { code: "237", name: "Cameroon", flagId: "cm" },
  { code: "260", name: "Zambia", flagId: "zm" },
  { code: "263", name: "Zimbabwe", flagId: "zw" },
]

import { useProfile } from "@/hooks/use-profile"

export function UpdatePhoneNumber() {
  const { user } = useAuth()
  const { profile, isLoading, mutate } = useProfile()

  const [countryCode, setCountryCode] = React.useState("234")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [step, setStep] = React.useState<"input" | "verify" | "success">("input")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)
  const [showExitConfirm, setShowExitConfirm] = React.useState(false)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (step === "verify") {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [step])




  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!phone || !user?.userId) return

    setIsSubmitting(true)
    try {
      // Clean up the local phone number
      let localPhone = phone.replace(/\D/g, '') // remove non-digits
      if (localPhone.startsWith("0")) {
        localPhone = localPhone.substring(1) // Strip leading zero if user adds it
      }
      
      const formattedPhone = `${countryCode}${localPhone}`

      // Trigger the OTP (which securely updates the phone number to unverified in the database)
      const result = await authApi.sendPhoneOtp({ userId: user.userId, phone: formattedPhone })
      if (result.data) {
        setStep("verify")
        setCountdown(60)
        toast.success("OTP sent to your phone!")
      } else {
        toast.error(result.error || "Failed to send OTP")
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyOtp = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault()
    const code = codeOverride || otp
    if (!code || !user?.userId) return

    setIsSubmitting(true)
    try {
      const result = await authApi.verifyPhoneOtp({ userId: user.userId, code })
      if (result.data) {
        setStep("success")
        mutate() // Refresh profile data to reflect new phone number
        toast.success("Phone number verified successfully!")
      } else {
        toast.error(result.error || "Invalid OTP code")
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading phone settings...
        </p>
      </div>
    )
  }

  const isSetup = !profile?.phone

  if (step === "success") {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-300">
        <div className="rounded-full bg-green-100 p-4 mb-4 dark:bg-green-900/30">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold">Verification Complete</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Your phone number has been successfully updated and verified.
        </p>
      </div>
    )
  }

  if (step === "verify") {
    return (
      <div className="max-w-md mx-auto py-2 md:py-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">Verify Phone Number</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the 6-digit code sent to <strong>{phone}</strong>
            </p>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="otp">Verification Code</FieldLabel>
              <PinInput
                length={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val)
                  if (val.length === 6) handleVerifyOtp(undefined, val)
                }}
                disabled={isSubmitting}
              />
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting || otp.length < 6}
              className="w-full h-11 text-base shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
              ) : (
                "Verify Code"
              )}
            </Button>
          </FieldGroup>
        </form>

        <div className="mt-8 text-center border-t pt-6">
          <p className="text-sm text-muted-foreground mb-3">Didn't receive the code?</p>
          <div className="flex flex-col gap-3">
            <Button
              variant="outline"
              onClick={() => handleSendOtp()}
              disabled={countdown > 0 || isSubmitting}
              className="w-full h-11"
            >
              {countdown > 0 ? `Resend Code (${countdown}s)` : "Resend Code"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowExitConfirm(true)
              }}
              className="w-full h-11 text-muted-foreground"
            >
              Cancel and Go Back
            </Button>
          </div>
        </div>

        <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold">Cancel Verification?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  If you go back now, your current verification attempt will be canceled and you'll need to request a new code.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="h-30 md:h-auto flex-col sm:flex-row gap-3 mt-4">
              <AlertDialogCancel className="rounded-xl flex-1 mt-0">Continue Verifying</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => setStep("input")}
                className="rounded-xl flex-1 bg-destructive hover:bg-destructive/90"
              >
                Yes, Go Back
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-2 md:py-6 animate-in fade-in duration-300">
      <form onSubmit={handleSendOtp} className="space-y-6">
        <div className="text-center mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
            <SmartphoneIcon className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">
            {isSetup ? "Setup Phone Number" : "Update Phone Number"}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {isSetup 
              ? "Add a phone number to your account for better security and communication." 
              : `Your current number is ${profile?.phone}. Enter a new one below.`}
          </p>
        </div>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="phone">New Phone Number</FieldLabel>
            <div className="flex h-12 w-full rounded-md border border-input bg-background shadow-sm overflow-hidden focus-within:ring-1 focus-within:ring-ring transition-colors">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-[140px] h-full! border-0 border-r border-input rounded-none bg-muted/30 hover:bg-muted/50 focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AFRICAN_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="py-2.5 cursor-pointer text-base">
                      <div className="flex items-center gap-2">
                        <img 
                          src={`https://flagcdn.com/w20/${c.flagId}.png`} 
                          srcSet={`https://flagcdn.com/w40/${c.flagId}.png 2x`}
                          width="20" 
                          height={"16"}
                          alt={c.name} 
                          className="inline-block rounded-sm object-cover" 
                        />
                        <span>+{c.code}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09012345678"
                className="h-full w-full border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                required
              />
            </div>
            <FieldDescription>
              We'll send a verification code to this number.
            </FieldDescription>
          </Field>

          <Button
            type="submit"
            disabled={isSubmitting || !phone}
            className="w-full h-12 text-base shadow-lg shadow-primary/20 mt-2"
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Code...</>
            ) : (
              "Send Verification Code"
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
