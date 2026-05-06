"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, SmartphoneIcon, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

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

export function UpdatePhoneNumber() {
  const { user } = useAuth()
  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const [countryCode, setCountryCode] = React.useState("234")
  const [phone, setPhone] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [step, setStep] = React.useState<"input" | "verify" | "success">("input")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  React.useEffect(() => {
    authApi.getProfile().then(({ data }) => {
      if (data?.profile) {
        setProfile(data.profile)
      }
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp || !user?.userId) return

    setIsSubmitting(true)
    try {
      const result = await authApi.verifyPhoneOtp({ userId: user.userId, code: otp })
      if (result.data) {
        setStep("success")
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest h-14 font-mono"
                required
              />
            </Field>

            <Button
              type="submit"
              disabled={isSubmitting || otp.length < 6}
              className="w-full h-11 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-[0.98]"
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
          <Button
            variant="outline"
            onClick={() => handleSendOtp()}
            disabled={countdown > 0 || isSubmitting}
            className="w-full h-11"
          >
            {countdown > 0 ? `Resend Code (${countdown}s)` : "Resend Code"}
          </Button>
        </div>
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
            className="w-full h-12 text-base shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-[0.98] mt-2"
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
