"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR from "swr"
import { nestPurseApi, LinkedAccount } from "@/lib/nestpurse-api"
import {
  Landmark,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Check,
  ArrowDownToLine,
  ShieldCheck,
  Lock,
} from "lucide-react"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSWRConfig } from "swr"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { PinInput } from "@/components/ui/pin-input"
import confetti from "canvas-confetti"

const FALLBACK_BANK_LOGO = "https://firebasestorage.googleapis.com/v0/b/business-banking-93cc1.appspot.com/o/bankLogos%2FEmpty%20Bank%20Logo.png?alt=media&token=c800752e-e3f0-41cf-a4bc-de2d4017ca16"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: any
  balance?: number
}

type Step = "list" | "amount" | "pin" | "otp" | "success"

export function WithdrawDialog({
  open,
  onOpenChange,
  profile,
  balance = 0,
}: WithdrawDialogProps) {
  const isMobile = useIsMobile()
  const { mutate } = useSWRConfig()
  
  const [step, setStep] = React.useState<Step>("list")
  const [isLoading, setIsLoading] = React.useState(false)
  const [requiresOtp, setRequiresOtp] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    bankCode: "",
    bankName: "",
    bankLogo: "",
    accountNumber: "",
    accountName: "",
    amount: "",
    narration: "",
    pin: "",
    otp: "",
  })

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStep("list")
      setRequiresOtp(false)
      setIsLoading(false)
      setFormData({
        bankCode: "",
        bankName: "",
        bankLogo: "",
        accountNumber: "",
        accountName: "",
        amount: "",
        narration: "",
        pin: "",
        otp: "",
      })
    }
  }, [open])

  const { data: linkedRes, isLoading: isLoadingLinked, error: linkedError, mutate: mutateLinked } = useSWR(
    open ? "linked-accounts" : null,
    () => nestPurseApi.getLinkedAccounts()
  )

  const handleWithdraw = async (otpOverride?: string, pinOverride?: string) => {
    setIsLoading(true)
    try {
      const res = await nestPurseApi.withdrawMoney({
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        amount: parseFloat(formData.amount),
        pin: pinOverride || formData.pin,
        narration: formData.narration || "Withdrawal from NestPurse",
        otp: otpOverride || formData.otp || undefined,
      })

      if (res.error) {
        toast.error(res.error)
        return
      }

      if (res.data?.requiresOtp) {
        setRequiresOtp(true)
        setStep("otp")
        toast.info("Authorization required", {
          description: res.data.message
        })
      } else {
        setStep("success")
        toast.success("Withdrawal Successful")
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#10b981", "#3b82f6"],
        })
        mutate("user-profile")
      }
    } catch (err: any) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case "list":
        if (linkedError) {
          return (
            <div className="py-8">
              <ErrorState
                message="Failed to load linked accounts"
                onRetry={() => mutateLinked()}
              />
            </div>
          )
        }
        return (
          <div className="flex flex-col animate-in py-2 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {isLoadingLinked ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                  </div>
                ) : linkedRes?.data?.linkedAccounts?.length ? (
                  linkedRes.data.linkedAccounts.map((acc: LinkedAccount) => (
                    <button
                      key={`${acc.bankCode}-${acc.accountNumber}`}
                      onClick={() => {
                        setFormData(prev => ({ 
                          ...prev, 
                          bankCode: acc.bankCode, 
                          bankName: acc.bankName || "Bank", 
                          bankLogo: acc.bankLogo || "",
                          accountNumber: acc.accountNumber,
                          accountName: acc.accountName
                        }))
                        setStep("amount")
                      }}
                      className="flex items-center gap-4 w-full p-4 rounded-2xl border hover:bg-muted/50 transition-all text-left group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                        <img 
                          src={acc.bankLogo || FALLBACK_BANK_LOGO} 
                          alt={acc.bankName || ""} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">{acc.bankName}</p>
                        <p className="text-xs text-muted-foreground">{acc.accountNumber}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </button>
                  ))
                ) : (
                  <div className="py-12 text-center bg-muted/10 rounded-2xl border border-dashed flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Landmark className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold">No linked accounts</p>
                      <p className="text-xs text-muted-foreground">Link a bank account to enable withdrawals</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      case "amount":
        return (
          <div className="animate-in space-y-5 py-2 duration-300 fade-in slide-in-from-right-4">
             <div className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm">
                  <img
                    src={formData.bankLogo || FALLBACK_BANK_LOGO}
                    alt={formData.bankName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{formData.bankName}</p>
                  <p className="text-xs text-muted-foreground">{formData.accountNumber} • {formData.accountName}</p>
                </div>
                <button
                  onClick={() => setStep("list")}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Change
                </button>
              </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  How much to withdraw?
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className={cn(
                      "h-14 rounded-xl border-2 pl-10 text-2xl font-bold",
                      formData.amount && (parseFloat(formData.amount) < 50 || parseFloat(formData.amount) > balance) && "border-destructive focus-visible:ring-destructive/20"
                    )}
                    autoFocus
                  />
                </div>
                {formData.amount && parseFloat(formData.amount) < 50 && (
                  <p className="text-[10px] font-bold text-destructive ml-1">Minimum amount is ₦50</p>
                )}
                {formData.amount && parseFloat(formData.amount) > balance && (
                  <p className="text-[10px] font-bold text-destructive ml-1">Insufficient wallet balance</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Narration (Optional)
                </label>
                <Input
                  placeholder="What is this for?"
                  value={formData.narration}
                  onChange={(e) => setFormData(prev => ({ ...prev, narration: e.target.value }))}
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="h-14 w-full rounded-xl text-lg font-bold"
                disabled={
                  !formData.amount || 
                  parseFloat(formData.amount) < 50 || 
                  parseFloat(formData.amount) > balance
                }
                onClick={() => setStep("pin")}
              >
                Continue
              </Button>
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setStep("list")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        )

      case "pin":
        return (
          <div className="animate-in space-y-4 py-2 duration-300 fade-in slide-in-from-right-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Transaction PIN</h3>
                <p className="text-sm text-muted-foreground">Enter your secure PIN to authorize withdrawal</p>
              </div>
            </div>

            <div className="mx-auto max-w-[280px] space-y-4">
              <PinInput
                value={formData.pin}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, pin: val }))
                  if (val.length === 4) handleWithdraw(undefined, val)
                }}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="h-14 w-full rounded-xl text-lg font-bold"
                disabled={formData.pin.length !== 4 || isLoading}
                onClick={() => handleWithdraw()}
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Confirm Withdrawal
              </Button>
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => setStep("amount")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        )

      case "otp":
        return (
          <div className="animate-in space-y-4 py-2 duration-300 fade-in slide-in-from-right-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">OTP Verification</h3>
                <p className="text-sm text-muted-foreground">Enter the code sent to your email/phone</p>
              </div>
            </div>

            <div className="max-w-[240px] mx-auto space-y-4">
               <Input 
                 placeholder="000000"
                 maxLength={6}
                 value={formData.otp}
                 onChange={(e) => {
                   const val = e.target.value.replace(/\D/g, "")
                   setFormData(prev => ({ ...prev, otp: val }))
                   if (val.length === 6) handleWithdraw(val)
                 }}
                 className="h-14 rounded-xl border-2 text-center text-3xl tracking-[0.5em] font-bold"
                 autoFocus
               />
            </div>

            <Button
              className="h-14 w-full rounded-xl text-lg font-bold"
              disabled={formData.otp.length !== 6 || isLoading}
              onClick={() => handleWithdraw()}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              Verify Withdraw
            </Button>
          </div>
        )

      case "success":
        return (
          <div className="animate-in space-y-4 py-2 text-center duration-500 zoom-in-95 fade-in">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Check className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold">Withdrawal Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  ₦{parseFloat(formData.amount).toLocaleString()} is being processed to your bank account.
                </p>
              </div>
            </div>

            <Button
              className="mt-2 h-14 w-full rounded-xl text-lg font-bold"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        )
    }
  }

  const title = {
    list: "Withdraw Money",
    amount: "Withdraw Amount",
    pin: "Authorize",
    otp: "Verification",
    success: "Success",
  }[step]

  const description = {
    list: "Select a linked bank account",
    amount: "How much would you like to withdraw?",
    pin: "Confirm your identity to proceed",
    otp: "We've sent a code to your registered device",
    success: "Your transaction was processed successfully",
  }[step]

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[95vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold flex items-center justify-center gap-2">
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 min-h-0 overflow-y-auto pb-4">
            {renderStep()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
             {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 overflow-y-auto max-h-[70vh]">
          {renderStep()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
