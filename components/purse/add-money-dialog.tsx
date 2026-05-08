"use client"

import * as React from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerDescription,
  DrawerFooter
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { CreditCard, Landmark, CalendarClock, Copy, Check, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import useSWR from "swr"
import { nestPurseApi } from "@/lib/nestpurse-api"
import { ArrowLeft, Loader2, ChevronRight, Banknote, Sparkles } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSWRConfig } from "swr"
import { Input } from "@/components/ui/input"

interface AddMoneyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile?: any
}

export function AddMoneyDialog({ open, onOpenChange, profile }: AddMoneyDialogProps) {
  const isMobile = useIsMobile()
  const { mutate } = useSWRConfig()
  const [method, setMethod] = React.useState<"choice" | "bank_transfer" | "card_amount">("choice")
  const [amount, setAmount] = React.useState("")
  const [isInitiating, setIsInitiating] = React.useState(false)
  const [copied, setCopied] = React.useState<string | null>(null)
  const [lastBalance, setLastBalance] = React.useState<number | null>(null)

  const { data: virtualRes, isLoading } = useSWR(
    open ? "virtual-account" : null,
    () => nestPurseApi.getVirtualAccount(),
    {
      refreshInterval: method === "bank_transfer" ? 8000 : 0, // Poll every 8s when on transfer screen
      revalidateOnFocus: true
    }
  )

  // Detect balance changes
  React.useEffect(() => {
    const currentBalance = virtualRes?.data?.balance
    if (currentBalance !== undefined && lastBalance !== null && currentBalance > lastBalance) {
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
      return [{
        provider: d.provider || "nomba",
        bankName: d.bankName || "",
        accountNumber: d.accountNumber || "",
        accountName: d.accountName || "",
        currency: "NGN",
        isPrimary: true
      }]
    }
    return []
  }, [virtualRes])

  const primaryAccount = accounts.find(a => a.isPrimary) || accounts[0]


  const handleCopy = (text: string, id: string, label: string = "Account number") => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success(`${label} copied to clipboard`)
    setTimeout(() => setCopied(null), 2000)
  }


  const options = [
    {
      id: "card",
      title: "Debit Card",
      description: "Fund instantly using your card",
      icon: <CreditCard className="h-5 w-5 text-blue-500" />,
      onClick: () => setMethod("card_amount")
    },

    {
      id: "transfer",
      title: "Bank Transfer",
      description: "Send money to your virtual account",
      icon: <Landmark className="h-5 w-5 text-primary" />,
      onClick: () => setMethod("bank_transfer")
    },
    {
      id: "auto",
      title: "Auto-Schedule Top-up",
      description: "Set up recurring deposits",
      icon: <CalendarClock className="h-5 w-5 text-orange-500" />,
      disabled: true,
      badge: "Coming Soon"
    }
  ]

  const renderContent = () => {
    if (method === "choice") {
      return (
        <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh] px-1 pr-2">
          {/* Quick Display of Virtual Account(s) */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-9 w-16 rounded-lg" />
                </div>
              </div>
            ) : accounts.length > 0 ? (
              (() => {
                const acc = accounts[1] || accounts[0];
                return (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                        Instant Funding Account
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground">{acc.bankName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-mono font-bold tracking-tight">{acc.accountNumber}</p>
                        <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">{acc.accountName}</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-9 px-3 text-xs font-bold gap-1.5 border-primary/30 hover:bg-primary/10 text-primary"
                        onClick={() => handleCopy(acc.accountNumber, "quick-view", "Account number")}
                      >
                        {copied === "quick-view" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied === "quick-view" ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>
                );
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
                  "w-full flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                  opt.disabled 
                    ? "opacity-60 cursor-not-allowed bg-muted/30 border-transparent" 
                    : "hover:bg-muted/50 active:scale-[0.98] border-border hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  opt.disabled ? "bg-muted" : "bg-primary/10"
                )}>
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm md:text-base">{opt.title}</span>
                    {opt.badge && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {opt.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{opt.description}</p>
                </div>
                {!opt.disabled && <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (method === "card_amount") {
      const numAmount = parseFloat(amount) || 0
      const isValid = numAmount >= 50 && numAmount <= 500000 && numAmount % 50 === 0

      const handleInitiate = async () => {
        if (!isValid) return
        setIsInitiating(true)
        try {
          const res = await nestPurseApi.initiateTopup({ 
            amount: numAmount, 
            paymentMethod: "card",
            redirectUrl: window.location.origin,
            cancelUrl: window.location.origin
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
        <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">₦</span>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-16 pl-10 text-3xl font-bold rounded-2xl border-2 focus-visible:ring-primary/20 focus-visible:border-primary/50"
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

            <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3">
              <Banknote className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Top-up Info</p>
                <p className="text-xs text-muted-foreground leading-tight">
                  Min: ₦50 • Max: ₦500,000. Amounts must be multiples of ₦50.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button 
              className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-primary/20"
              disabled={!isValid || isInitiating}
              onClick={handleInitiate}
            >
              {isInitiating ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {isInitiating ? "Processing..." : `Fund with ₦${numAmount.toLocaleString()}`}
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full h-11 rounded-xl gap-2 text-muted-foreground"
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

    return (

      <div className="space-y-6 py-4 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Fetching accounts...</p>
            </div>
          ) : accounts.length > 0 ? (
            accounts.map((acc, idx) => (
              <div key={idx} className="rounded-xl border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Account Number</p>
                    <p className="text-2xl font-mono font-bold tracking-tight">{acc.accountNumber}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-10 w-10 rounded-full"
                    onClick={() => handleCopy(acc.accountNumber, `acc-${idx}`, "Account number")}
                  >
                    {copied === `acc-${idx}` ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>

                </div>
                
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bank Name</p>
                    <p className="text-sm font-semibold">{acc.bankName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Beneficiary</p>
                    <p className="text-sm font-semibold truncate">{acc.accountName}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No virtual accounts found.</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 flex gap-3 dark:bg-blue-900/10 dark:border-blue-900/20">
          <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-700 leading-relaxed dark:text-blue-400">
            Transfers to any of these accounts will fund your NestPurse balance instantly.
          </p>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-11 rounded-xl gap-2"
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
        <DrawerContent className="px-4 pb-8 max-h-[90vh]">
          <div className="overflow-y-auto">
            <DrawerHeader className="px-0">
              <DrawerTitle>
                {method === "choice" ? "Add Money" : method === "bank_transfer" ? "Bank Transfer" : "Debit Card"}
              </DrawerTitle>
              <DrawerDescription>
                {method === "choice" 
                  ? "Select your preferred funding method below" 
                  : method === "bank_transfer"
                  ? "Transfer to any of the virtual accounts below"
                  : "Enter the amount you'd like to fund your account with"}
              </DrawerDescription>
            </DrawerHeader>

            {renderContent()}
          </div>
        </DrawerContent>

      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[550px] sm:max-w-[550px] rounded-3xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-bold">
            {method === "choice" ? "Add Money" : method === "bank_transfer" ? "Bank Transfer" : "Debit Card"}
          </DialogTitle>
          <DialogDescription>
            {method === "choice" 
              ? "Select your preferred funding method below" 
              : method === "bank_transfer"
              ? "Transfer to any of the virtual accounts below"
              : "Enter the amount you'd like to fund your account with"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
