"use client"

import * as React from "react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, CheckCircle2, Mail, SmartphoneIcon, FileText, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { PinInput } from "@/components/ui/pin-input"

type TwoFAStep = "idle" | "choose_medium" | "pending_otp" | "success"

import { useProfile } from "@/hooks/use-profile"

export function PrivacySecurity() {
  const { user, logout } = useAuth()
  const { profile, isLoading, mutate } = useProfile()

  // 2FA state
  const [twoFAStep, setTwoFAStep] = React.useState<TwoFAStep>("idle")
  const [twoFACode, setTwoFACode] = React.useState("")
  const [twoFASubmitting, setTwoFASubmitting] = React.useState(false)
  const [twoFACountdown, setTwoFACountdown] = React.useState(0)
  const [twoFAMedium, setTwoFAMedium] = React.useState<"email" | "phone">("email")

  // Disable 2FA state
  const [disablePin, setDisablePin] = React.useState("")
  const [disableSubmitting, setDisableSubmitting] = React.useState(false)
  const [showDisableForm, setShowDisableForm] = React.useState(false)

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = React.useState("")
  const [deleteSubmitting, setDeleteSubmitting] = React.useState(false)

  const [showExitConfirm, setShowExitConfirm] = React.useState(false)

  // Countdown timer
  React.useEffect(() => {
    if (twoFACountdown > 0) {
      const timer = setTimeout(() => setTwoFACountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [twoFACountdown])

  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (twoFAStep === "pending_otp") {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [twoFAStep])




  const handleSetup2FA = () => {
    // Show medium picker before sending
    setTwoFAStep("choose_medium")
  }

  const handleSendCode = async () => {
    if (!user?.userId) return
    setTwoFASubmitting(true)
    try {
      const result = await authApi.setup2FA({ userId: user.userId, medium: twoFAMedium })
      if (result.data) {
        setTwoFAStep("pending_otp")
        setTwoFACountdown(60)
        toast.success(`Verification code sent to your ${twoFAMedium}!`)
      } else {
        toast.error(result.error || "Failed to initiate 2FA setup")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setTwoFASubmitting(false)
    }
  }

  const handleVerify2FA = async (e?: React.FormEvent, codeOverride?: string) => {
    if (e) e.preventDefault()
    const code = codeOverride || twoFACode
    if (!user?.userId || !code) return
    setTwoFASubmitting(true)
    try {
      const result = await authApi.verify2FASetup({ userId: user.userId, code })
      if (result.data) {
        setTwoFAStep("success")
        mutate()
        toast.success("Two-Factor Authentication enabled!")
      } else {
        toast.error(result.error || "Invalid code. Please try again.")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setTwoFASubmitting(false)
    }
  }

  const handleDisable2FA = async (e?: React.FormEvent, pinOverride?: string) => {
    if (e) e.preventDefault()
    if (!user?.userId) return
    const pin = pinOverride || disablePin
    setDisableSubmitting(true)
    try {
      const result = await authApi.disable2FA({ userId: user.userId, pin: pin || undefined })
      if (result.data) {
        mutate()
        setShowDisableForm(false)
        setDisablePin("")
        toast.success("Two-Factor Authentication disabled.")
      } else {
        toast.error(result.error || "Failed to disable 2FA")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setDisableSubmitting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user?.userId || deleteConfirmText !== "DELETE") return
    setDeleteSubmitting(true)
    try {
      const result = await authApi.deleteAccount({ userId: user.userId })
      if (result.data) {
        setShowDeleteDialog(false)
        toast.success("Account deletion scheduled. You will be logged out.")
        setTimeout(() => logout?.(), 2000)
      } else {
        toast.error(result.error || "Failed to schedule deletion")
      }
    } catch {
      toast.error("An unexpected error occurred")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading security settings...
        </p>
      </div>
    )
  }

  const is2FAEnabled = profile?.is2FAEnabled

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-6 md:pb-10">
      {/* Two-Factor Authentication */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Main row */}
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 md:px-5 md:py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm md:text-base">Two-factor authentication</span>
              {is2FAEnabled && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Enabled
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-sm">
              Add an extra layer of security by requiring a verification code on login.
            </p>
          </div>

          {!is2FAEnabled && twoFAStep === "idle" && (
            <Button
              size="sm"
              onClick={handleSetup2FA}
              disabled={twoFASubmitting}
              className="shrink-0 px-5 h-9 font-semibold"
            >
              {twoFASubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enable"}
            </Button>
          )}

          {(is2FAEnabled || twoFAStep === "success") && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDisableForm(!showDisableForm)}
              className="shrink-0 px-5 h-9 font-semibold text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              {showDisableForm ? "Cancel" : "Disable"}
            </Button>
          )}

          {!is2FAEnabled && (twoFAStep === "pending_otp" || twoFAStep === "choose_medium") && (
            <span className="text-xs text-muted-foreground shrink-0 font-medium">
              {twoFAStep === "choose_medium" ? "Choose delivery" : `Check your ${twoFAMedium}`}
            </span>
          )}
        </div>

        {/* Medium picker step */}
        {!is2FAEnabled && twoFAStep === "choose_medium" && (
          <div className="border-t px-4 py-4 md:px-5 space-y-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Choose how you&apos;d like to receive your verification code.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTwoFAMedium("email")}
                className={`flex-1 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  twoFAMedium === "email"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <Mail className="h-5 w-5" />
                <span>Email</span>
                {!profile?.email && <span className="ml-auto text-[10px] text-muted-foreground">Not set</span>}
              </button>
              <button
                type="button"
                onClick={() => setTwoFAMedium("phone")}
                className={`flex-1 flex items-center gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  twoFAMedium === "phone"
                    ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                    : "border-border bg-background hover:bg-muted/50"
                }`}
              >
                <SmartphoneIcon className="h-5 w-5" />
                <span>Phone</span>
                {!profile?.phone && <span className="ml-auto text-[10px] text-destructive">Not set</span>}
              </button>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSendCode}
                disabled={twoFASubmitting || (twoFAMedium === "phone" && !profile?.phone)}
                className="h-10"
              >
                {twoFASubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : "Send Code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10"
                onClick={() => setTwoFAStep("idle")}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* OTP verification step */}
        {!is2FAEnabled && twoFAStep === "pending_otp" && (
          <form onSubmit={handleVerify2FA} className="border-t px-4 py-4 md:px-5 space-y-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to your <strong>{twoFAMedium}</strong>. Enter it below to activate 2FA.
            </p>
            <Field>
              <FieldLabel htmlFor="twofa-code">Verification Code</FieldLabel>
              <PinInput
                length={6}
                value={twoFACode}
                onChange={(val) => {
                  setTwoFACode(val)
                  if (val.length === 6) handleVerify2FA(undefined, val) 
                }}
                disabled={twoFASubmitting}
              />
            </Field>
            <div className="flex flex-wrap gap-3 items-center">
              <Button type="submit" disabled={twoFASubmitting || twoFACode.length < 6} className="h-10">
                {twoFASubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : "Verify & Enable 2FA"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendCode}
                disabled={twoFACountdown > 0 || twoFASubmitting}
                className="h-10"
              >
                {twoFACountdown > 0 ? `Resend (${twoFACountdown}s)` : "Resend Code"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowExitConfirm(true)
                }}
                disabled={twoFASubmitting}
                className="h-10 text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
          <AlertDialogContent className="max-w-[400px] rounded-2xl p-6">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-2">
                <AlertDialogTitle className="text-xl font-bold">Discard 2FA Setup?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  If you cancel now, you&apos;ll need to start the two-factor authentication setup from the beginning.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>
            <AlertDialogFooter className="h-30 md:h-auto flex-col sm:flex-row gap-3 mt-4">
              <AlertDialogCancel className="rounded-xl flex-1 mt-0">Continue Setup</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => {
                  setTwoFAStep("idle")
                  setTwoFACode("")
                }}
                className="rounded-xl flex-1 bg-destructive hover:bg-destructive/90"
              >
                Yes, Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Success confirmation */}
        {twoFAStep === "success" && (
          <div className="border-t px-4 py-3 md:px-5 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/10">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>2FA successfully activated on your account.</span>
          </div>
        )}

        {/* Disable 2FA form */}
        {showDisableForm && (
          <form onSubmit={handleDisable2FA} className="border-t px-4 py-4 md:px-5 space-y-4 bg-muted/30">
            {profile?.hasPin ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter your transaction PIN to confirm disabling 2FA.
                </p>
                <Field>
                  <FieldLabel htmlFor="disable-pin">Transaction PIN</FieldLabel>
                  <PinInput
                    value={disablePin}
                    onChange={(val) => {
                      setDisablePin(val)
                      if (val.length === 4) handleDisable2FA(undefined, val)
                    }}
                    disabled={disableSubmitting}
                  />
                  <FieldDescription>Your 4-digit transaction PIN is required to disable 2FA.</FieldDescription>
                </Field>
              </>
            ) : (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                You don't have a transaction PIN set. Click below to disable 2FA — no PIN verification is required.
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                variant="destructive"
                disabled={disableSubmitting || (profile?.hasPin && !disablePin)}
                className="h-10"
              >
                {disableSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Disabling...</> : "Confirm Disable"}
              </Button>
            </div>
          </form>
        )}
      </section>

      {/* Legal */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3.5 md:px-5 md:py-4 border-b border-border">
          <span className="font-medium text-sm md:text-base">Legal</span>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "Terms & Conditions", href: "/terms" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Cookie Policy", href: "/cookies" },
            { label: "Refund & Cancellation Policy", href: "/refund-policy" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 hover:bg-muted/50 transition-colors"
            >
              <span className="flex items-center gap-2.5 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                {label}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 md:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-destructive">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              Deleting your account schedules a <strong>30-day grace period</strong> before permanent removal. You may cancel this during that window by contacting support.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="h-11 border-destructive/50 text-destructive hover:bg-destructive hover:text-white"
          onClick={() => { setDeleteConfirmText(""); setShowDeleteDialog(true) }}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Schedule Account Deletion
        </Button>

        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirmText("") }}>
          <AlertDialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            {/* Centered warning icon */}
            <div className="flex flex-col items-center text-center pt-2 pb-1">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-4 ring-destructive/5 mb-4">
                <AlertTriangle className="h-7 w-7 text-destructive" />
              </div>
              <AlertDialogHeader className="space-y-1.5 sm:text-center">
                <AlertDialogTitle className="text-lg">Delete your account?</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  Your account will be scheduled for permanent deletion after a <strong className="text-foreground">30-day grace period</strong>. During this time you can contact support to cancel.
                </AlertDialogDescription>
              </AlertDialogHeader>
            </div>

            {/* Consequences list */}
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 space-y-1.5 text-sm">
              <p className="font-medium text-destructive text-xs uppercase tracking-wider">What will be deleted</p>
              <ul className="space-y-1 text-muted-foreground">
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span>Your profile, savings goals &amp; transaction history</li>
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span>All wallet balances &amp; connected payment methods</li>
                <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span>Store listings, products &amp; customer data</li>
              </ul>
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <FieldLabel htmlFor="delete-confirm" className="text-sm">
                Type <strong className="text-destructive font-mono">DELETE</strong> below to confirm
              </FieldLabel>
              <div className="relative">
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className={`h-11 font-mono tracking-wider pr-10 transition-colors ${
                    deleteConfirmText === "DELETE"
                      ? "border-green-500 focus-visible:ring-green-500/30"
                      : "border-destructive/40 focus-visible:ring-destructive/30"
                  }`}
                  autoComplete="off"
                  spellCheck={false}
                />
                {deleteConfirmText === "DELETE" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500 animate-in fade-in zoom-in duration-200" />
                )}
              </div>
            </div>

            <AlertDialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3 h-30 md:h-auto">
              <AlertDialogCancel disabled={deleteSubmitting} className="h-10 flex-1 sm:flex-none mt-0 order-2 sm:order-1">
                Keep my account
              </AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteSubmitting || deleteConfirmText !== "DELETE"}
                onClick={handleDeleteAccount}
                className="h-10 flex-1 sm:flex-none order-1 sm:order-2"
              >
                {deleteSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scheduling...</>
                  : "Delete my account"
                }
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
