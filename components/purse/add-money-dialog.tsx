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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { nestPurseApi } from "@/lib/nestpurse-api"
import { format } from "date-fns"
import {
  Calendar as CalendarIcon,
  Search,
  Landmark,
  CreditCard,
  CalendarClock,
  ChevronRight,
  Copy,
  Check,
  Info,
  ArrowLeft,
  RefreshCcw,
  Loader2,
  PauseCircle,
  PlayCircle,
  Trash2,
  Banknote,
  Sparkles,
} from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { useSWRConfig } from "swr"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"

const FALLBACK_BANK_LOGO = "https://firebasestorage.googleapis.com/v0/b/business-banking-93cc1.appspot.com/o/bankLogos%2FEmpty%20Bank%20Logo.png?alt=media&token=c800752e-e3f0-41cf-a4bc-de2d4017ca16"

interface AddMoneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: any
}

export function AddMoneyDialog({
  open,
  onOpenChange,
  profile,
}: AddMoneyDialogProps) {
  const isMobile = useIsMobile()
  const { mutate } = useSWRConfig()
  const [method, setMethod] = React.useState<
    "choice" | "bank_transfer" | "card_amount" | "auto_schedule"
  >("choice")
  const [autoStep, setAutoStep] = React.useState<
    "list" | "select_account" | "banks" | "account" | "schedule"
  >("list")

  const [amount, setAmount] = React.useState("")
  const [isInitiating, setIsInitiating] = React.useState(false)

  const [copied, setCopied] = React.useState<string | null>(null)
  const [lastBalance, setLastBalance] = React.useState<number | null>(null)
  const [mandateToDelete, setMandateToDelete] = React.useState<string | null>(
    null
  )
  const [isDeletingMandate, setIsDeletingMandate] = React.useState(false)

  // Mandate Form State
  const [mandateData, setMandateData] = React.useState({
    bankCode: "",
    bankName: "",
    bankLogo: "",
    accountNumber: "",
    accountName: "",
    frequency: "MONTHLY",
    amount: "",
    startDate: "",
    endDate: "",
  })
  const [bankSearch, setBankSearch] = React.useState("")
  const [isVerifying, setIsVerifying] = React.useState(false)

  const { data: virtualRes, isLoading } = useSWR(
    open ? "virtual-account" : null,
    () => nestPurseApi.getVirtualAccount(),
    {
      refreshInterval: method === "bank_transfer" ? 8000 : 0, // Poll every 8s when on transfer screen
      revalidateOnFocus: true,
    }
  )

  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setMethod("choice")
      setAutoStep("list")
      setAmount("")
      setBankSearch("")
      setMandateData({
        bankCode: "",
        bankName: "",
        bankLogo: "",
        accountNumber: "",
        accountName: "",
        frequency: "MONTHLY",
        amount: "",
        startDate: "",
        endDate: "",
      })
    }
  }, [open])

  // Detect balance changes
  React.useEffect(() => {
    const currentBalance = virtualRes?.data?.balance
    if (
      currentBalance !== undefined &&
      lastBalance !== null &&
      currentBalance > lastBalance
    ) {
      toast.success("Deposit Detected!", {
        description: `₦${(currentBalance - lastBalance).toLocaleString()} has been added to your NestPurse.`,
        icon: <Sparkles className="h-5 w-5 text-yellow-500" />,
      })
      mutate("user-profile") // Refresh global dashboard balance
    }
    if (currentBalance !== undefined) {
      setLastBalance(currentBalance)
    }
  }, [virtualRes?.data?.balance, lastBalance, mutate])

  const accounts = React.useMemo(() => {
    if (!virtualRes?.data) return []
    const d = virtualRes.data
    if (d.accounts) return d.accounts
    if (d.accountNumber) {
      return [
        {
          provider: d.provider || "nomba",
          bankName: d.bankName || "",
          accountNumber: d.accountNumber || "",
          accountName: d.accountName || "",
          currency: "NGN",
          isPrimary: true,
        },
      ]
    }
    return []
  }, [virtualRes])

  const primaryAccount = accounts.find((a) => a.isPrimary) || accounts[0]

  const handleCopy = (
    text: string,
    id: string,
    label: string = "Account number"
  ) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }

  const {
    data: mandatesRes,
    isLoading: isLoadingMandates,
    error: mandatesError,
    mutate: mutateMandates,
  } = useSWR(method === "auto_schedule" ? "mandates" : null, () =>
    nestPurseApi.getMandates()
  )

  const {
    data: linkedRes,
    isLoading: isLoadingLinked,
    mutate: mutateLinked,
  } = useSWR(method === "auto_schedule" ? "linked-accounts" : null, () =>
    nestPurseApi.getLinkedAccounts()
  )
  const {
    data: mandateBanksRes,
    isLoading: isLoadingBanks,
    error: banksError,
    mutate: mutateBanks,
  } = useSWR(method === "auto_schedule" ? "mandate-banks" : null, () =>
    nestPurseApi.getMandateBanks()
  )

  const filteredBanks = React.useMemo(() => {
    if (!mandateBanksRes?.data?.banks) return []
    return mandateBanksRes.data.banks.filter((b: any) =>
      b.name.toLowerCase().includes(bankSearch.toLowerCase())
    )
  }, [mandateBanksRes, bankSearch])

  const handleResolveMandateAccount = async () => {
    if (mandateData.accountNumber.length !== 10) return
    setIsVerifying(true)
    try {
      const res = await nestPurseApi.lookupAccount({
        bankCode: mandateData.bankCode,
        accountNumber: mandateData.accountNumber,
      })
      const accountName = res?.data?.account?.accountName
      if (accountName) {
        setMandateData((prev) => ({ ...prev, accountName }))
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

  // Auto-verify mandate account
  React.useEffect(() => {
    if (
      method === "auto_schedule" &&
      autoStep === "account" &&
      mandateData.accountNumber.length === 10 &&
      mandateData.bankCode
    ) {
      handleResolveMandateAccount()
    }
  }, [mandateData.accountNumber, mandateData.bankCode, method, autoStep])

  const handleUpdateStatus = async (
    id: string,
    status: "SUSPEND" | "ACTIVE"
  ) => {
    try {
      const res = await nestPurseApi.updateMandateStatus(id, status)
      if (res?.data?.message) {
        toast.success(res.data.message)
      }
      mutate("mandates")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status")
    }
  }

  const handleDeleteMandate = async (id: string) => {
    setIsDeletingMandate(true)
    try {
      const res = await nestPurseApi.deleteMandate(id)
      if (res?.data?.message) {
        toast.success(res.data.message)
      }
      mutate("mandates")
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete schedule")
    } finally {
      setIsDeletingMandate(false)
    }
  }

  const options: {
    id: string
    title: string
    description: string
    icon: React.ReactNode
    onClick: () => void
    disabled?: boolean
    badge?: string
  }[] = [
    {
      id: "card",
      title: "Debit Card",
      description: "Fund instantly using your card",
      icon: <CreditCard className="h-5 w-5 text-blue-500" />,
      onClick: () => setMethod("card_amount"),
    },
    {
      id: "transfer",
      title: "Bank Transfer",
      description: "Send money to your virtual account",
      icon: <Landmark className="h-5 w-5 text-primary" />,
      onClick: () => setMethod("bank_transfer"),
    },
    {
      id: "auto",
      title: "Auto-Schedule Top-up",
      description: "Set up recurring deposits",
      icon: <CalendarClock className="h-5 w-5 text-orange-500" />,
      onClick: () => {
        setMethod("auto_schedule")
        setAutoStep("list")
      },
    },
  ]

  const renderContent = () => {
    if (method === "choice") {
      return (
        <div className="grid max-h-[60vh] gap-4 overflow-y-auto px-1 py-4 pr-2">
          {/* Quick Display of Virtual Account(s) */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="space-y-3 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-16 rounded-lg" />
                </div>
              </div>
            ) : accounts.length > 0 ? (
              (() => {
                const acc = accounts[1] || accounts[0]
                return (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-bold tracking-widest text-primary/70 uppercase">
                        Instant Funding Account
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {acc.bankName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-2xl font-bold tracking-tight">
                          {acc.accountNumber}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
                          {acc.accountName}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 gap-1.5 border-primary/30 px-3 text-xs font-bold text-primary hover:bg-primary/10"
                        onClick={() =>
                          handleCopy(
                            acc.accountNumber,
                            "quick-view",
                            "Account number"
                          )
                        }
                      >
                        {copied === "quick-view" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copied === "quick-view" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                )
              })()
            ) : null}
          </div>

          <div className="space-y-3">
            {options.map((opt) => (
              <button
                key={opt.id}
                disabled={opt.disabled}
                onClick={opt.onClick}
                className={cn(
                  "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  opt.disabled
                    ? "cursor-not-allowed border-transparent bg-muted/30 opacity-60"
                    : "border-border hover:border-primary/30 hover:bg-muted/50 active:scale-[0.98]"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    opt.disabled ? "bg-muted" : "bg-primary/10"
                  )}
                >
                  {opt.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold md:text-base">
                      {opt.title}
                    </span>
                    {opt.badge && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {opt.description}
                  </p>
                </div>
                {!opt.disabled && (
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (method === "bank_transfer") {
      return (
        <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
          <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-medium text-muted-foreground">
                  Fetching accounts...
                </p>
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="space-y-4 rounded-xl border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Account Number
                      </p>
                      <p className="font-mono text-2xl font-bold tracking-tight">
                        {acc.accountNumber}
                      </p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-10 w-10 rounded-full"
                      onClick={() =>
                        handleCopy(
                          acc.accountNumber,
                          `acc-${idx}`,
                          "Account number"
                        )
                      }
                    >
                      {copied === `acc-${idx}` ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Bank Name
                      </p>
                      <p className="text-sm font-semibold">{acc.bankName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        Beneficiary
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {acc.accountName}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No virtual accounts found.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
            <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
              Transfers to any of these accounts will fund your NestPurse
              balance instantly.
            </p>
          </div>

          <Button
            variant="outline"
            className="h-11 w-full gap-2 rounded-xl"
            onClick={() => setMethod("choice")}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      )
    }

    if (method === "card_amount") {
      const numAmount = parseFloat(amount) || 0
      const isValid =
        numAmount >= 50 && numAmount <= 500000 && numAmount % 50 === 0

      const handleInitiate = async () => {
        if (!isValid) return
        setIsInitiating(true)
        try {
          const res = await nestPurseApi.initiateTopup({
            amount: numAmount,
            paymentMethod: "card",
            redirectUrl: window.location.origin,
            cancelUrl: window.location.origin,
          })
          if (res?.data?.checkoutUrl) {
            toast.info("Redirecting to secure payment page...")
            window.location.href = res.data.checkoutUrl
          }
        } catch (err: any) {
          toast.error(err.response?.data?.error || "Failed to initiate payment")
          setIsInitiating(false)
        }
      }

      return (
        <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                ₦
              </span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-16 rounded-2xl border-2 pl-10 text-3xl font-bold focus-visible:border-primary/50 focus-visible:ring-primary/20"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[1000, 5000, 10000].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  className="h-12 rounded-xl text-sm font-semibold"
                  onClick={() => setAmount(val.toString())}
                >
                  +₦{val.toLocaleString()}
                </Button>
              ))}
            </div>

            <div className="flex gap-3 rounded-xl border border-primary/10 bg-primary/5 p-4">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold tracking-widest text-primary/70 uppercase">
                  Top-up Info
                </p>
                <p className="text-xs leading-tight text-muted-foreground">
                  Min: ₦50 • Max: ₦500,000. Amounts must be multiples of ₦50.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              className="h-14 w-full rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
              disabled={!isValid || isInitiating}
              onClick={handleInitiate}
            >
              {isInitiating ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {isInitiating
                ? "Processing..."
                : `Fund with ₦${numAmount.toLocaleString()}`}
            </Button>

            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl text-muted-foreground"
              disabled={isInitiating}
              onClick={() => setMethod("choice")}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      )
    }

    if (method === "auto_schedule") {
      if (autoStep === "list") {
        const mandates = mandatesRes?.data?.mandates || []

        if (mandatesError) {
          return (
            <div className="py-8">
              <ErrorState
                message="Failed to load your schedules"
                onRetry={() => mutateMandates()}
              />
            </div>
          )
        }

        return (
          <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
            <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
              {isLoadingMandates ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                  ))}
                </div>
              ) : mandates.length > 0 ? (
                mandates.map((m) => (
                  <div
                    key={m.id}
                    className="group relative flex flex-col gap-2 rounded-2xl border bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center border border-border/50">
                        {(m as any).bankLogo ? (
                          <img
                            src={(m as any).bankLogo}
                            alt={m.bankName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Landmark className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background p-1 shadow-sm">
                          <RefreshCcw
                            className={cn(
                              "h-full w-full text-primary",
                              m.status === "ACTIVE" && "animate-spin-slow"
                            )}
                          />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold">
                            ₦{m.amount.toLocaleString()}
                          </p>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              m.status === "ACTIVE"
                                ? "bg-primary/10 text-primary"
                                : m.status === "SUSPENDED" ||
                                    m.status === "SUSPEND"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-orange-100 text-orange-700"
                            )}
                          >
                            {m.status}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {m.bankName} • {m.frequency}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-muted/30">
                      {m.status === "ACTIVE" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 flex-1 gap-1.5 text-[10px] font-bold text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
                          onClick={() => handleUpdateStatus(m.id, "SUSPEND")}
                        >
                          <PauseCircle className="h-3.5 w-3.5" />
                          Pause
                        </Button>
                      ) : m.status === "SUSPENDED" || m.status === "SUSPEND" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 flex-1 gap-1.5 text-[10px] font-bold text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => handleUpdateStatus(m.id, "ACTIVE")}
                        >
                          <PlayCircle className="h-3.5 w-3.5" />
                          Resume
                        </Button>
                      ) : null}

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 flex-1 gap-1.5 text-[10px] font-bold text-destructive hover:bg-destructive/5"
                        onClick={() => setMandateToDelete(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-muted/50 bg-muted/5 px-6 py-10 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/20">
                    <CalendarClock className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="mb-1 text-base font-bold">
                    No active schedules
                  </h3>
                  <p className="mb-6 max-w-[220px] text-xs text-muted-foreground">
                    Set up recurring deposits to reach your savings goals faster
                    and automatically.
                  </p>
                  <Button
                    onClick={() => setAutoStep("select_account")}
                    className="rounded-xl px-8"
                  >
                    Create a Schedule
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {mandates.length > 0 && (
                <Button
                  className="h-12 w-full rounded-xl font-bold"
                  onClick={() => setAutoStep("select_account")}
                >
                  Create New Schedule
                </Button>
              )}
              <Button
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl text-muted-foreground"
                onClick={() => setMethod("choice")}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>

            <AlertDialog
              open={!!mandateToDelete}
              onOpenChange={(open) => !open && setMandateToDelete(null)}
            >
              <AlertDialogContent className="rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">
                    Cancel Schedule?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm text-muted-foreground">
                    This will permanently deactivate this automated top-up
                    schedule. You can set up a new one anytime.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl border-none bg-muted font-bold hover:bg-muted/80">
                    No, Keep It
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeletingMandate}
                    className="text-destructive-foreground rounded-xl bg-destructive font-bold hover:bg-destructive/90 min-w-[100px]"
                    onClick={(e) => {
                      e.preventDefault()
                      if (mandateToDelete) {
                        handleDeleteMandate(mandateToDelete).then(() => {
                          setMandateToDelete(null)
                        })
                      }
                    }}
                  >
                    {isDeletingMandate ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Yes, Cancel"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )
      }

      if (autoStep === "select_account") {
        const linkedAccounts = linkedRes?.data?.linkedAccounts || []
        const supportedBankCodes = new Set(mandateBanksRes?.data?.banks?.map((b: any) => b.code) || [])

        return (
          <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select a linked account</h4>
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {isLoadingLinked || isLoadingBanks ? (
                  [1, 2].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
                ) : linkedAccounts.length > 0 ? (
                  linkedAccounts.map((acc: any) => {
                    const isSupported = supportedBankCodes.has(acc.bankCode)
                    return (
                      <button
                        key={`${acc.bankCode}-${acc.accountNumber}`}
                        disabled={!isSupported}
                        onClick={() => {
                          setMandateData(prev => ({
                            ...prev,
                            bankCode: acc.bankCode,
                            bankName: acc.bankName,
                            accountNumber: acc.accountNumber,
                            accountName: acc.accountName,
                          }))
                          setAutoStep("schedule")
                        }}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                          isSupported 
                            ? "hover:bg-muted/50 border-border hover:border-primary/30" 
                            : "opacity-60 cursor-not-allowed bg-muted/20"
                        )}
                      >
                        <div className="h-10 w-10 rounded-xl bg-muted overflow-hidden border border-border/50 flex items-center justify-center shrink-0">
                          <img 
                            src={acc.bankLogo || FALLBACK_BANK_LOGO} 
                            alt={acc.bankName} 
                            className="h-full w-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{acc.bankName}</p>
                          <p className="text-xs text-muted-foreground">{acc.accountNumber}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {isSupported ? (
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Unsupported</span>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-8 text-center bg-muted/5 rounded-2xl border border-dashed">
                    <p className="text-xs text-muted-foreground">No accounts linked yet</p>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="w-full h-14 rounded-2xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 gap-2"
                onClick={() => setAutoStep("banks")}
              >
                <Landmark className="h-5 w-5 text-primary" />
                Add New Bank Account
              </Button>
            </div>

            <Button
              variant="outline"
              className="h-11 w-full gap-2 rounded-xl text-muted-foreground"
              onClick={() => setAutoStep("list")}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        )
      }

      if (autoStep === "banks") {
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
          <div className="flex flex-col min-h-[400px] py-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search your bank..." 
                  className="pl-10 h-12 rounded-xl"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {isLoadingBanks ? (
                  <div className="space-y-2">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
                  </div>
                ) : filteredBanks.map((bank: any) => (
                  <button
                    key={bank.code}
                    onClick={() => {
                      setMandateData(prev => ({ ...prev, bankCode: bank.code, bankName: bank.name, bankLogo: bank.bankLogo || bank.logo || "" }))
                      setAutoStep("account")
                    }}
                    className="flex items-center gap-4 w-full p-3 rounded-xl border hover:bg-muted/50 transition-all text-left group"
                  >
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden border">
                      <img 
                        src={bank.bankLogo || bank.logo || FALLBACK_BANK_LOGO} 
                        alt={bank.name} 
                        className="h-full w-full object-cover" 
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                        }}
                      />
                    </div>
                    <span className="font-semibold text-sm flex-1">{bank.name}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-11 rounded-xl gap-2 mt-auto"
              onClick={() => setAutoStep("list")}
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
        )
      }

      if (autoStep === "account") {
        return (
          <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border bg-muted/30 p-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border bg-white shadow-sm">
                  <img
                    src={mandateData.bankLogo || FALLBACK_BANK_LOGO}
                    alt={mandateData.bankName}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = FALLBACK_BANK_LOGO
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{mandateData.bankName}</p>
                  <button
                    onClick={() => setAutoStep("banks")}
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
                    value={mandateData.accountNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setMandateData((prev) => ({
                        ...prev,
                        accountNumber: val,
                        accountName: "",
                      }))
                    }}
                    className="h-14 rounded-xl border-2 font-mono text-xl font-bold tracking-widest focus-visible:ring-primary/20"
                  />
                  {isVerifying && (
                    <div className="absolute top-1/2 right-4 -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>

              {mandateData.accountName && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 animate-in zoom-in-95 duration-200">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1">Account Name</p>
                  <p className="text-sm font-bold text-foreground">{mandateData.accountName}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Button
                className="h-14 w-full rounded-xl text-lg font-bold"
                disabled={!mandateData.accountName || isVerifying || isInitiating}
                onClick={async () => {
                  // Check if this account is already linked
                  const isLinked = linkedRes?.data?.linkedAccounts?.some(
                    (acc: any) => acc.accountNumber === mandateData.accountNumber && acc.bankCode === mandateData.bankCode
                  )

                  if (!isLinked) {
                    setIsInitiating(true)
                    try {
                      await nestPurseApi.linkAccount({
                        bankCode: mandateData.bankCode,
                        accountNumber: mandateData.accountNumber,
                        accountName: mandateData.accountName,
                        status: true
                      })
                      mutateLinked()
                      toast.success("Account linked successfully")
                    } catch (err: any) {
                      toast.error("Failed to link account, but you can still proceed")
                    } finally {
                      setIsInitiating(false)
                    }
                  }
                  
                  setAutoStep("schedule")
                }}
              >
                {isInitiating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Continue
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl text-muted-foreground"
                onClick={() => setAutoStep("banks")}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        )
      }

      if (autoStep === "schedule") {
        const handleCreate = async () => {
          setIsInitiating(true)
          try {
            const res = await nestPurseApi.createMandate({
              bankCode: mandateData.bankCode,
              accountNumber: mandateData.accountNumber,
              accountName: mandateData.accountName,
              amount: parseFloat(mandateData.amount),
              frequency: mandateData.frequency,
              startDate: mandateData.startDate,
              endDate: mandateData.endDate,
              redirectUrl: window.location.origin + "/nestpurse?status=success",
              cancelUrl: window.location.origin + "/nestpurse?status=cancel",
            })
            const checkoutUrl = res?.data?.checkoutUrl
            if (checkoutUrl) {
              toast.info("Redirecting to authorization...")
              window.location.href = checkoutUrl
            } else {
              toast.success("Mandate created successfully")
              onOpenChange(false)
            }
          } catch (err: any) {
            toast.error(
              err.response?.data?.error || "Failed to create schedule"
            )
          } finally {
            setIsInitiating(false)
          }
        }

        const isValid =
          mandateData.amount &&
          parseFloat(mandateData.amount) >= 100 &&
          mandateData.startDate &&
          mandateData.endDate

        return (
          <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  How much to save?
                </label>
                <div className="relative">
                  <span className="absolute top-1/2 left-4 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                    ₦
                  </span>
                  <Input
                    type="number"
                    placeholder="1,000"
                    value={mandateData.amount}
                    onChange={(e) =>
                      setMandateData((prev) => ({
                        ...prev,
                        amount: e.target.value,
                      }))
                    }
                    className={cn(
                      "h-14 rounded-xl border-2 pl-10 text-2xl font-bold",
                      mandateData.amount && parseFloat(mandateData.amount) < 100 && "border-destructive focus-visible:ring-destructive/20"
                    )}
                  />
                </div>
                {mandateData.amount && parseFloat(mandateData.amount) < 100 && (
                  <p className="text-[10px] font-bold text-destructive ml-1">Minimum amount is ₦100</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                  Frequency
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {["DAILY", "WEEKLY", "MONTHLY"].map((f) => (
                    <Button
                      key={f}
                      variant={
                        mandateData.frequency === f ? "default" : "outline"
                      }
                      className="h-12 rounded-xl text-xs font-bold"
                      onClick={() =>
                        setMandateData((prev) => ({ ...prev, frequency: f }))
                      }
                    >
                      <RefreshCcw
                        className={cn(
                          "mr-1.5 h-3 w-3",
                          mandateData.frequency === f && "animate-spin-slow"
                        )}
                      />
                      {f}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-12 w-full justify-start rounded-xl text-left font-normal border-2",
                          !mandateData.startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {mandateData.startDate ? (
                          format(new Date(mandateData.startDate), "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={mandateData.startDate ? new Date(mandateData.startDate) : undefined}
                        onSelect={(date) =>
                          setMandateData((prev) => ({
                            ...prev,
                            startDate: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                        }
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <label className="ml-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "h-12 w-full justify-start rounded-xl text-left font-normal border-2",
                          !mandateData.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {mandateData.endDate ? (
                          format(new Date(mandateData.endDate), "PPP")
                        ) : (
                          <span>Pick date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl" align="end">
                      <Calendar
                        mode="single"
                        selected={mandateData.endDate ? new Date(mandateData.endDate) : undefined}
                        onSelect={(date) =>
                          setMandateData((prev) => ({
                            ...prev,
                            endDate: date ? format(date, "yyyy-MM-dd") : "",
                          }))
                        }
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                className="h-14 w-full rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
                disabled={!isValid || isInitiating}
                onClick={handleCreate}
              >
                {isInitiating ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <CalendarIcon className="mr-2 h-5 w-5" />
                )}
                {isInitiating ? "Setting up..." : "Schedule Top-up"}
              </Button>
              <Button
                variant="outline"
                className="h-11 w-full gap-2 rounded-xl text-muted-foreground"
                onClick={() => setAutoStep("account")}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        )
      }
    }

    return (
      <div className="animate-in space-y-6 py-4 duration-300 fade-in slide-in-from-right-4">
        <div className="max-h-[400px] space-y-4 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium text-muted-foreground">
                Fetching accounts...
              </p>
            </div>
          ) : accounts.length > 0 ? (
            accounts.map((acc, idx) => (
              <div
                key={idx}
                className="space-y-4 rounded-xl border bg-card p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Account Number
                    </p>
                    <p className="font-mono text-2xl font-bold tracking-tight">
                      {acc.accountNumber}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 rounded-full"
                    onClick={() =>
                      handleCopy(
                        acc.accountNumber,
                        `acc-${idx}`,
                        "Account number"
                      )
                    }
                  >
                    {copied === `acc-${idx}` ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Bank Name
                    </p>
                    <p className="text-sm font-semibold">{acc.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                      Beneficiary
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {acc.accountName}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No virtual accounts found.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/20 dark:bg-blue-900/10">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-xs leading-relaxed text-blue-700 dark:text-blue-400">
            Transfers to any of these accounts will fund your NestPurse balance
            instantly.
          </p>
        </div>

        <Button
          variant="outline"
          className="h-11 w-full gap-2 rounded-xl"
          onClick={() => setMethod("choice")}
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[95vh] px-4 pb-8 flex flex-col">
          <div className="flex h-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-0">
              <DrawerTitle>
                {method === "choice"
                  ? "Add Money"
                  : method === "bank_transfer"
                    ? "Bank Transfer"
                    : method === "card_amount"
                      ? "Debit Card"
                      : "Auto-Schedule"}
              </DrawerTitle>
              <DrawerDescription>
                {method === "choice"
                  ? "Select your preferred funding method below"
                  : method === "bank_transfer"
                    ? "Transfer to any of the virtual accounts below"
                    : method === "card_amount"
                      ? "Enter the amount you'd like to fund your account with"
                      : autoStep === "list"
                        ? "View and manage your automated top-up schedules"
                        : "Set up a recurring deposit from your bank"}
              </DrawerDescription>
            </DrawerHeader>

            <div className="flex-1 overflow-y-auto pr-1">{renderContent()}</div>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-[550px] flex-col overflow-hidden rounded-3xl p-6 sm:max-w-[550px]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold md:text-2xl">
            {method === "choice"
              ? "Add Money"
              : method === "bank_transfer"
                ? "Bank Transfer"
                : method === "card_amount"
                  ? "Debit Card"
                  : "Auto-Schedule"}
          </DialogTitle>
          <DialogDescription>
            {method === "choice"
              ? "Select your preferred funding method below"
              : method === "bank_transfer"
                ? "Transfer to any of the virtual accounts below"
                : method === "card_amount"
                  ? "Enter the amount you'd like to fund your account with"
                  : autoStep === "list"
                    ? "View and manage your automated top-up schedules"
                    : "Set up a recurring deposit from your bank"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  )
}
