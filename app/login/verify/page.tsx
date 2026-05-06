"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function Verify2FAPage() {
  const { requires2FA, pendingUserId, verify2FA, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isResending, setIsResending] = useState(false)

  // Redirect if no pending 2FA
  useEffect(() => {
    if (!requires2FA && !pendingUserId) {
      router.replace("/login")
    }
  }, [requires2FA, pendingUserId, router])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.length < 6) return

    setIsSubmitting(true)
    try {
      const result = await verify2FA(code)
      if (!result.success) {
        toast.error(result.error || "Invalid verification code")
        setIsSubmitting(false)
      }
      // On success, verify2FA in auth-context handles redirect + token
    } catch {
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!pendingUserId || countdown > 0) return
    setIsResending(true)
    try {
      const result = await authApi.resend2FALogin({ userId: pendingUserId })
      if (result.data) {
        setCountdown(60)
        toast.success(result.data.message || "Verification code resent!")
      } else {
        toast.error(result.error || "Failed to resend code")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setIsResending(false)
    }
  }

  const isLoading = isAuthLoading || isSubmitting

  if (!requires2FA && !pendingUserId) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link href="/" className="flex items-center gap-2 self-center font-medium">
          <img src="/logo.png" alt="GrowNest" width={100} height={100} />
        </Link>

        <Card>
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-xl">Two-Factor Verification</CardTitle>
            <CardDescription className="leading-relaxed">
              A verification code has been sent to your alternate contact method. Enter it below to complete your login.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <Field>
                <FieldLabel htmlFor="otp-code">Verification Code</FieldLabel>
                <Input
                  id="otp-code"
                  type="text"
                  inputMode="numeric"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-[0.4em] h-14 font-mono"
                  autoFocus
                  required
                  disabled={isLoading}
                  autoComplete="one-time-code"
                />
                <FieldDescription>Enter the 6-digit code from your email or phone</FieldDescription>
              </Field>

              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading || code.length < 6}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                ) : (
                  "Verify & Login"
                )}
              </Button>

              <div className="text-center pt-2 border-t space-y-3">
                <p className="text-sm text-muted-foreground">Didn't receive the code?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10"
                  onClick={handleResend}
                  disabled={countdown > 0 || isResending}
                >
                  {isResending ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resending...</>
                  ) : countdown > 0 ? (
                    `Resend Code (${countdown}s)`
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mx-auto"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </button>
      </div>
    </div>
  )
}
