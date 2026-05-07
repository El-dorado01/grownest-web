"use client"

import { useState, useEffect } from "react"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Loader2, ArrowLeft, Mail } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Use the frontend URL from environment or fallback to current origin
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const result = await authApi.forgotPassword({ email, frontendUrl })

      if (result.data) {
        setIsSubmitted(true)
        setCountdown(60)
        toast.success("Reset link sent!")
      } else {
        toast.error(result.error || "Failed to send reset link")
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    try {
      const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const result = await authApi.forgotPassword({ email, frontendUrl })

      if (result.data) {
        setCountdown(60)
        toast.success("Reset link resent!")
      } else {
        toast.error(result.error || "Failed to resend reset link")
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className={cn("flex flex-col gap-6 text-center", className)} {...props}>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button 
            variant="default" 
            onClick={handleResend}
            disabled={countdown > 0 || isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {countdown > 0 ? `Resend Link (${countdown}s)` : "Resend Link"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex flex-col items-center gap-2 mb-4">
              <img src="/logo.png" alt="GrowNest" width={120} height={120} />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>
          {/* <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </Field> */}
            <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-foreground">
                      Email Address<span className="text-primary ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="youremail@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="pl-9 h-11 bg-card"
                      />
                    </div>
                  </div>
          <Field>
            <Button
              type="submit"
              className="w-full h-11 mt-1 text-sm font-medium text-foreground"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </Field>
          <div className="text-center">
             <Link href="/login" className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4">
                Back to login
             </Link>
          </div>
        </FieldGroup>
      </form>
    </div>
  )
}
