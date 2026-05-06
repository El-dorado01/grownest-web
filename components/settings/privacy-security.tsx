"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Loader2, AlertTriangle, CheckCircle2, KeyRound, Mail, SmartphoneIcon } from "lucide-react"
import { toast } from "sonner"

type TwoFAStep = "idle" | "choose_medium" | "pending_otp" | "success"

export function PrivacySecurity() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)

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

  // Countdown timer
  React.useEffect(() => {
    if (twoFACountdown > 0) {
      const timer = setTimeout(() => setTwoFACountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [twoFACountdown])

  React.useEffect(() => {
    authApi.getProfile().then(({ data }) => {
      if (data?.profile) setProfile(data.profile)
      setIsLoading(false)
    }).catch(() => setIsLoading(false))
  }, [])

  const handleSetup2FA = () => {
    // Show medium picker before sending
    setTwoFAStep("choose_medium")
  }

  const handleSendCode = async () => {
    if (!user?.userId) return
    setTwoFASubmitting(true)
    try {
      const result = await authApi.setup2FA({ userId: user.userId })
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

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.userId || !twoFACode) return
    setTwoFASubmitting(true)
    try {
      const result = await authApi.verify2FASetup({ userId: user.userId, code: twoFACode })
      if (result.data) {
        setTwoFAStep("success")
        setProfile((p: any) => ({ ...p, is2FAEnabled: true }))
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

  const handleDisable2FA = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.userId) return
    setDisableSubmitting(true)
    try {
      const result = await authApi.disable2FA({ userId: user.userId, pin: disablePin || undefined })
      if (result.data) {
        setProfile((p: any) => ({ ...p, is2FAEnabled: false }))
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
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
              Choose how you'd like to receive your verification code.
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
              <Input
                id="twofa-code"
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="text-center text-xl tracking-widest h-12 font-mono max-w-xs"
                required
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
            </div>
          </form>
        )}

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
                  <Input
                    id="disable-pin"
                    type="password"
                    value={disablePin}
                    onChange={(e) => setDisablePin(e.target.value)}
                    placeholder="••••••"
                    className="h-11 max-w-xs"
                    maxLength={6}
                    required
                  />
                  <FieldDescription>Your 4–6 digit transaction PIN is required to disable 2FA.</FieldDescription>
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
          className="h-11 border-destructive/50 text-destructive hover:bg-destructive hover:text-white transition-all"
          onClick={() => { setDeleteConfirmText(""); setShowDeleteDialog(true) }}
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          Schedule Account Deletion
        </Button>

        <AlertDialog open={showDeleteDialog} onOpenChange={(open) => { setShowDeleteDialog(open); if (!open) setDeleteConfirmText("") }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Schedule Account Deletion
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">
                  This will schedule your account for <strong>permanent deletion after 30 days</strong>. All your data, savings, and activity history will be permanently erased.
                </span>
                <span className="block font-medium text-foreground">This action cannot be undone.</span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="px-1 py-2">
              <Field>
                <FieldLabel htmlFor="delete-confirm">
                  Type <strong className="text-destructive font-mono">DELETE</strong> to confirm
                </FieldLabel>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-11 font-mono border-destructive/40 focus-visible:ring-destructive/30"
                  autoComplete="off"
                />
              </Field>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteSubmitting}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={deleteSubmitting || deleteConfirmText !== "DELETE"}
                onClick={handleDeleteAccount}
                className="h-10"
              >
                {deleteSubmitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scheduling...</>
                  : <><KeyRound className="mr-2 h-4 w-4" />Confirm Deletion</>
                }
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
