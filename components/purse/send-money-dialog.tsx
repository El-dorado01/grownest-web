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
  DrawerFooter,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR from "swr"
import { nestPurseApi, Bank } from "@/lib/nestpurse-api"
import {
  Search,
  Landmark,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Check,
  Send,
  AlertCircle,
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

const FALLBACK_BANK_LOGO =
  "https://firebasestorage.googleapis.com/v0/b/business-banking-93cc1.appspot.com/o/bankLogos%2FEmpty%20Bank%20Logo.png?alt=media&token=c800752e-e3f0-41cf-a4bc-de2d4017ca16"

interface SendMoneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: any
  balance?: number
}

type Step = "bank" | "account" | "amount" | "pin" | "otp" | "success"

export function SendMoneyDialog({
  open,
  onOpenChange,
  profile,
  balance = 0,
}: SendMoneyDialogProps) {
  const isMobile = useIsMobile()
  const { mutate } = useSWRConfig()

  const [step, setStep] = React.useState<Step>("bank")
  const [bankSearch, setBankSearch] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)
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
      setStep("bank")
      setBankSearch("")
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

  const {
    data: banksRes,
    isLoading: isLoadingBanks,
    error: banksError,
    mutate: mutateBanks,
  } = useSWR(open ? "all-banks" : null, () => nestPurseApi.getBanks())

  const filteredBanks = React.useMemo(() => {
    if (!banksRes?.data?.banks) return []
    const filtered = banksRes.data.banks.filter((b: Bank) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    )
    return filtered
  }, [banksRes, bankSearch])

  const handleResolveAccount = async (accountNumber: string) => {
    if (accountNumber.length !== 10) return
    setIsVerifying(true)
    try {
      const res = await nestPurseApi.lookupAccount({
        bankCode: formData.bankCode,
        accountNumber,
      })
      const accountName = res?.data?.account?.accountName
      if (accountName) {
        setFormData((prev) => ({ ...prev, accountName }))
        toast.success("Account verified")
      } else {
        toast.error("Could not verify account")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Account verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSend = async (otpOverride?: string, pinOverride?: string) => {
    setIsLoading(true)
    try {
      const res = await nestPurseApi.sendMoney({
        amount: parseFloat(formData.amount),
        pin: pinOverride || formData.pin,
        narration: formData.narration || "Transfer from NestPurse",
        bankDetails: {
          bankCode: formData.bankCode,
          accountNumber: formData.accountNumber,
        },
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
          description: res.data.message,
        })
      } else {
        setStep("success")
        toast.success("Transfer Successful")
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
      case "bank":
        if (banksError) {
          return (
            <div className="py-8">
              <ErrorState
                message="Failed to load banks"
                onRetry={() => mutateBanks()}
              />
            </div>
          )
        }
        return (
          <div className="flex animate-in flex-col py-2 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search recipient bank..."
                  className="h-12 rounded-xl pl-10"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>

              <div className="grid max-h-[300px] grid-cols-1 gap-2 overflow-y-auto pr-1">
                {isLoadingBanks ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : (
                  filteredBanks.map((bank: Bank) => (
                    <button
                      key={bank.code}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          bankCode: bank.code,
                          bankName: bank.name,
                          bankLogo: bank.logo || "",
                        }))
                        setStep("account")
                      }}
                      className="group flex w-full items-center gap-4 rounded-xl border p-3 text-left transition-all hover:bg-muted/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border bg-muted">
                        <img
                          src={bank.logo || FALLBACK_BANK_LOGO}
                          alt={bank.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              FALLBACK_BANK_LOGO
                          }}
                        />
                      </div>
                      <span className="flex-1 text-sm font-semibold">
                        {bank.name}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-colors group-hover:text-primary" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )

      case "account":
        return (
          <div className="animate-in space-y-5 py-2 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border bg-white shadow-sm">
                  <img
                    src={formData.bankLogo || FALLBACK_BANK_LOGO}
                    alt={formData.bankName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{formData.bankName}</p>
                  <button
                    onClick={() => setStep("bank")}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Change Bank
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Account Number
                </label>
                <div className="relative">
                  <Input
                    placeholder="0123456789"
                    maxLength={10}
                    value={formData.accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setFormData((prev) => ({
                        ...prev,
                        accountNumber: val,
                        accountName: "",
                      }))
                      if (val.length === 10) handleResolveAccount(val)
                    }}
                    className="h-14 rounded-xl border-2 text-lg font-bold tracking-widest"
                  />
                  {isVerifying && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              {formData.accountName && (
                <div className="animate-in rounded-2xl border border-primary/20 bg-primary/5 p-4 slide-in-from-top-2">
                  <p className="text-[10px] font-bold tracking-widest text-primary/70 uppercase">
                    Recipient Name
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {formData.accountName}
                  </p>
                </div>
              )}
            </div>

            <Button
              className="h-14 w-full rounded-xl text-lg font-bold"
              disabled={
                formData.accountNumber.length !== 10 ||
                !formData.accountName ||
                isVerifying
              }
              onClick={() => setStep("amount")}
            >
              Continue
            </Button>
          </div>
        )

      case "amount":
        return (
          <div className="animate-in space-y-5 py-2 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  How much to send?
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className={cn(
                      "h-14 rounded-xl border-2 pl-10 text-2xl font-bold",
                      formData.amount &&
                        (parseFloat(formData.amount) < 50 || parseFloat(formData.amount) > balance) &&
                        "border-destructive focus-visible:ring-destructive/20"
                    )}
                    autoFocus
                  />
                </div>
                {formData.amount && parseFloat(formData.amount) < 50 && (
                  <p className="ml-1 text-[10px] font-bold text-destructive">
                    Minimum amount is ₦50
                  </p>
                )}
                {formData.amount && parseFloat(formData.amount) > balance && (
                  <p className="ml-1 text-[10px] font-bold text-destructive">
                    Insufficient wallet balance
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Narration (Optional)
                </label>
                <Input
                  placeholder="What is this for?"
                  value={formData.narration}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      narration: e.target.value,
                    }))
                  }
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
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setStep("account")}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </div>
          </div>
        )

      case "pin":
        return (
          <div className="animate-in space-y-4 py-2 text-center duration-300 fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Transaction PIN</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your secure PIN to authorize this transfer
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-[280px] space-y-4">
              <PinInput
                value={formData.pin}
                onChange={(val) => {
                  setFormData((prev) => ({ ...prev, pin: val }))
                  if (val.length === 4) handleSend(undefined, val)
                }}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col gap-3">
              <Button
                className="h-14 w-full rounded-xl text-lg font-bold"
                disabled={formData.pin.length !== 4 || isLoading}
                onClick={() => handleSend()}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Authorize Transfer
              </Button>
              <Button
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => setStep("amount")}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Go Back
              </Button>
            </div>
          </div>
        )

      case "otp":
        return (
          <div className="animate-in space-y-4 py-2 text-center duration-300 fade-in slide-in-from-right-4">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold">OTP Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Enter the code sent to your email/phone
                </p>
              </div>
            </div>

            <div className="mx-auto max-w-[240px] space-y-4">
              <Input
                placeholder="000000"
                maxLength={6}
                value={formData.otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "")
                  setFormData((prev) => ({ ...prev, otp: val }))
                  if (val.length === 6) handleSend(val)
                }}
                className="h-14 rounded-xl border-2 text-center text-3xl font-bold tracking-[0.5em]"
                autoFocus
              />
            </div>

            <Button
              className="h-14 w-full rounded-xl text-lg font-bold"
              disabled={formData.otp.length !== 6 || isLoading}
              onClick={() => handleSend()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              Verify Send
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
                <h3 className="text-xl font-bold">Transfer Successful!</h3>
                <p className="text-sm text-muted-foreground">
                  ₦{parseFloat(formData.amount).toLocaleString()} has been sent
                  to {formData.accountName}
                </p>
              </div>

              <div className="w-full space-y-2.5 rounded-2xl border border-dashed bg-muted/30 p-4 text-left">
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-muted-foreground uppercase">
                    Bank
                  </span>
                  <span className="font-bold">{formData.bankName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-muted-foreground uppercase">
                    Account
                  </span>
                  <span className="font-bold">{formData.accountNumber}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="font-bold text-muted-foreground uppercase">
                    Ref
                  </span>
                  <span className="font-mono">
                    {(Math.random() * 1000000000).toFixed(0)}
                  </span>
                </div>
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
    bank: "Send Money",
    account: "Recipient Details",
    amount: "Transfer Amount",
    pin: "Authorize",
    otp: "Verification",
    success: "Success",
  }[step]

  const description = {
    bank: "Choose a bank to send money to",
    account: "Enter the recipient's account number",
    amount: "How much would you like to transfer?",
    pin: "Confirm your identity to proceed",
    otp: "We've sent a code to your registered device",
    success: "Your transaction was processed successfully",
  }[step]

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh] px-4 pb-8">
          <DrawerHeader className="mb-2 px-0">
            <DrawerTitle className="flex items-center justify-center gap-2 text-xl font-bold">
              {title}
            </DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto max-h-[70vh] pb-4">
            {renderStep()}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] p-0 sm:max-w-[440px]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 overflow-y-auto max-h-[70vh]">{renderStep()}</div>
      </DialogContent>
    </Dialog>
  )
}
