"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { PinInput } from "@/components/ui/pin-input"
import { toast } from "sonner"
import { Loader2, Mail, RefreshCw } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import Link from "next/link"
import Image from "next/image"

export default function SignupVerifyPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const { profile, mutate, isLoading: isProfileLoading } = useProfile()
  const [otp, setOtp] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [countdown, setCountdown] = React.useState(0)

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Redirect if not logged in at all (though register logs them in partially now)
  React.useEffect(() => {
    if (!user) {
      router.push("/signup")
    }
  }, [user, router])

  // Redirect to onboarding if already verified
  React.useEffect(() => {
    console.log("Verification Page - Profile Status:", {
      isLoading: isProfileLoading,
      isVerified: profile?.isVerified,
      userId: user?.userId
    })

    if (!isProfileLoading && profile?.isVerified) {
      console.log("User already verified, forcing redirect to onboarding...")
      window.location.href = "/onboarding"
    }
  }, [profile, isProfileLoading, router, user])

  const handleVerify = async (codeOverride?: string) => {
    const code = codeOverride || otp
    if (code.length < 6 || !user?.userId) return

    setIsSubmitting(true)
    try {
      const result = await authApi.verifyAccount({ userId: user.userId, code })
      if (result.data) {
        console.log("Verification successful, refreshing profile...")
        toast.success("Account verified successfully!")
        
        // Update local session if a new token was returned
        if (result.data.token) {
          localStorage.setItem("auth_token", result.data.token)
          document.cookie = `auth_token=${result.data.token}; path=/; max-age=${7 * 24 * 60 * 60}`
        }

        await mutate()
        console.log("Profile refreshed, forcing redirect to onboarding...")
        // Using window.location.href for a hard redirect to ensure state is fresh
        window.location.href = "/onboarding"
      } else {
        toast.error(result.error || "Invalid verification code")
      }
    } catch (err) {
      toast.error("An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (!user?.userId || countdown > 0) return

    setIsResending(true)
    try {
      const result = await authApi.resendVerification({ userId: user.userId })
      if (result.data) {
        toast.success("Verification code resent!")
        setCountdown(60)
      } else {
        toast.error(result.error || "Failed to resend code")
      }
    } catch (err) {
      toast.error("Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-muted/30">
      <header className="flex items-center justify-between px-8 py-6">
        <Link href="/">
          <Image src="/logo.png" alt="GrowNest" width={120} height={36} className="w-auto h-auto" priority />
        </Link>
        <Button variant="ghost" size="sm" onClick={() => logout()} className="text-muted-foreground font-medium">
          Sign out
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Mail className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Verify your email</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We've sent a 6-digit verification code to <br />
              <strong className="text-foreground">{user?.email}</strong>
            </p>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex justify-center">
              <PinInput
                length={6}
                value={otp}
                onChange={(val) => {
                  setOtp(val)
                  if (val.length === 6) handleVerify(val)
                }}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="w-full h-11 font-bold shadow-md shadow-primary/20"
                onClick={() => handleVerify()}
                disabled={isSubmitting || otp.length < 6}
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                ) : (
                  "Verify Account"
                )}
              </Button>
              
              <div className="flex flex-col gap-4 mt-2">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">Didn't receive the code?</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-lg h-10 px-6 font-medium"
                    onClick={handleResend}
                    disabled={isResending || countdown > 0}
                  >
                    {isResending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className={countdown > 0 ? "h-3.5 w-3.5 mr-2 opacity-50" : "h-3.5 w-3.5 mr-2"} />
                    )}
                    {countdown > 0 ? `Resend code in ${countdown}s` : "Resend code"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
