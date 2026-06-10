// app/nestbaskets/baskets/flexible/[id]/page.tsx
"use client"

import { DashboardHeader } from "@/components/dashboard-header"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  Loader2,
  ShieldCheck,
  Trash,
  Truck,
  ArrowLeft,
  Info,
  MapPin,
  ShoppingBag,
  PiggyBank,
  Plus,
  TrendingUp,
  Settings,
  AlertCircle,
  Check
} from "lucide-react"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import useSWR from "swr"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { PinInput } from "@/components/ui/pin-input"
import { toast } from "sonner"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

const formatDate = (dateString?: string) => {
  if (!dateString) return "N/A"
  return new Date(dateString).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function FlexibleSavingsGoalPage() {
  const params = useParams()
  const router = useRouter()
  const customPlanId = params.id as string

  // UI state overlays
  const [isDepositOpen, setIsDepositOpen] = React.useState(false)
  const [isAutoPayOpen, setIsAutoPayOpen] = React.useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)

  // Forms fields
  const [depositAmount, setDepositAmount] = React.useState("")
  const [autoPayAmount, setAutoPayAmount] = React.useState("")
  const [autoPayFreq, setAutoPayFreq] = React.useState<"daily" | "weekly" | "biweekly" | "monthly">("weekly")

  // Security authorization state
  const [pinValue, setPinValue] = React.useState("")
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // SWR for Plan Details
  const {
    data: planRes,
    isLoading,
    mutate,
  } = useSWR(customPlanId ? `flexible-details-${customPlanId}` : null, () =>
    nestBasketsApi.getFlexiblePlanDetails(customPlanId)
  )

  // SWR for Shipping profiles (to switch addresses)
  const { data: profilesRes } = useSWR("delivery-profiles", () =>
    nestBasketsApi.getDeliveryProfiles()
  )

  const plan = planRes?.data?.data || null
  const profiles = profilesRes?.data?.data ?? []

  // Deposit Shortcut
  const handleAmountChipClick = (amount: number) => {
    setDepositAmount(amount.toString())
  }

  // Handle address swap
  const handleAddressSwap = async (deliveryProfileId: string) => {
    if (!plan) return
    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.updateCustomPlanAddress(plan.id, deliveryProfileId)
      if (res.data?.success) {
        toast.success("Delivery address updated successfully! Progressive weight shipping fee recalculated.")
        mutate() // Refetch details
      } else {
        toast.error(res.data?.message || res.error || "Failed to update address")
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong updating destination.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Action deposit handler
  const handleDepositSubmit = async () => {
    if (!plan) return
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < 500) {
      toast.error("Please specify a deposit amount of at least ₦500")
      return
    }
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.makeFlexiblePayment({
        customPlanId: plan.id,
        amount,
        pin: pinValue,
      })

      if (res.data?.success) {
        toast.success(
          `Deposit of ${formatCurrency(amount)} successful! savings goal progress: ${res.data?.data?.progress || "0%"}`
        )
        setIsDepositOpen(false)
        setDepositAmount("")
        setPinValue("")
        mutate()
      } else {
        toast.error(res.data?.message || res.error || "Deposit transaction failed")
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to process savings deposit. Check wallet PIN and balance.")
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Configure Auto-Pay
  const handleAutoPaySubmit = async () => {
    if (!plan) return
    const amount = parseFloat(autoPayAmount)
    if (isNaN(amount) || amount < 500) {
      toast.error("Please specify an Auto-Save transfer amount of at least ₦500")
      return
    }
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.setupAutoPay({
        customPlanId: plan.id,
        frequency: autoPayFreq,
        amount,
        pin: pinValue,
      })

      if (res.data?.success) {
        toast.success(`Successfully activated automated Auto-Pay savings scheduler!`)
        setIsAutoPayOpen(false)
        setAutoPayAmount("")
        setPinValue("")
        mutate()
      } else {
        toast.error(res.data?.message || res.error || "Failed to configure Auto-Pay")
      }
    } catch (err: any) {
      toast.error(err.message || "Incorrect PIN or failed to setup rules.")
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Deactivate Auto-Pay
  const handleDisableAutoPay = async () => {
    if (!plan) return
    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.disableAutoPay(plan.id)
      if (res.data?.success) {
        toast.success("Automated Auto-Pay savings disabled successfully.")
        mutate()
      } else {
        toast.error(res.data?.message || res.error || "Failed to disable Auto-Pay")
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Delete Savings and full wallet refund
  const handleDeletePlanSubmit = async () => {
    if (!plan) return
    if (pinValue.length !== 4) {
      toast.error("Please enter your 4-digit transactions security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.deleteCustomPlan(plan.id, pinValue)
      if (res.data?.success) {
        toast.success(
          `Savings plan successfully deleted! All accrued savings of ${formatCurrency(
            res.data?.data?.refundAmount || 0
          )} have been refunded back to your NestPurse.`
        )
        setIsDeleteOpen(false)
        router.push("/nestbaskets/baskets")
      } else {
        toast.error(res.data?.message || res.error || "Failed to delete plan")
      }
    } catch (err: any) {
      toast.error(err.message || "Incorrect PIN. Plan deletion denied.")
      setPinValue("")
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="p-4 md:p-6 space-y-6">
            <Skeleton className="h-20 rounded-2xl w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Skeleton className="h-[400px] lg:col-span-2 rounded-2xl" />
              <Skeleton className="h-[300px] rounded-2xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!plan) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-xl font-bold">Goal Not Found</h2>
            <p className="text-sm text-muted-foreground">The requested flexible savings meal target does not exist.</p>
            <Button asChild>
              <Link href="/nestbaskets/baskets">Back to Dashboard</Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const items = plan.items || []
  const profile = plan.deliveryProfile || null
  
  // Progress Calculations
  const savedPercent = plan.totalPrice > 0 ? Math.min((plan.paidAmount / plan.totalPrice) * 100, 100) : 0
  const progressPercent = Math.round(savedPercent)

  // Circular progress SVG configurations
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (savedPercent / 100) * circumference

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader
          rightActions={
            <Button variant="ghost" size="sm" asChild className="gap-1 bg-muted/30 border">
              <Link href="/nestbaskets/baskets">
                <ArrowLeft className="w-4 h-4" /> Back
              </Link>
            </Button>
          }
        >
          <Breadcrumb className="flex-1">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/nestbaskets/baskets">Food Baskets</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Savings Goal hub</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Top Page Header Banner */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md shadow-primary/2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1",
                    plan.isPaid
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20"
                      : "bg-primary/10 text-primary animate-pulse"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full bg-current", !plan.isPaid && "animate-ping")} />
                  {plan.isPaid ? "Ready for Delivery" : "Savings Active"}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                  <PiggyBank className="w-3.5 h-3.5 text-primary" /> Flexible savings goal
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{plan.title}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Target date: {formatDate(plan.savingExpiresAt)}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 shrink-0">
              <span className="text-xs text-muted-foreground font-semibold">Total Target Groceries Budget</span>
              <span className="text-2xl font-black text-foreground">{formatCurrency(plan.totalPrice)}</span>
              <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                Saved so far: {formatCurrency(plan.paidAmount)} ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side circular progress ring and list of ingredients */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Radial Savings Meter Banner */}
              <div className="rounded-2xl border bg-card p-6 flex flex-col sm:flex-row items-center justify-around gap-6 shadow-sm">
                
                {/* Glowing radial Progress Ring SVG */}
                <div className="relative size-36 shrink-0 flex items-center justify-center">
                  <svg className="size-full -rotate-90">
                    {/* Background track circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className="stroke-muted"
                      strokeWidth="10"
                      fill="transparent"
                    />
                    {/* Glowing gold active progress path circle */}
                    <circle
                      cx="72"
                      cy="72"
                      r={radius}
                      className="stroke-primary transition-all duration-1000 ease-out"
                      strokeWidth="10"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  {/* Central Text Label overlay */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-foreground leading-none">{progressPercent}%</span>
                    <span className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mt-1">Saved</span>
                  </div>
                </div>

                <div className="space-y-3 text-center sm:text-left">
                  <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-foreground"> Groceries Target Milestone</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">
                    Keep contributing at your convenience. When the indicator glows green at <strong>100% complete</strong>, your customized food ingredients unlock and automatically schedule for immediate dispatch!
                  </p>
                  
                  <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start pt-1.5">
                    {!plan.isPaid && (
                      <Button
                        onClick={() => setIsDepositOpen(true)}
                        size="sm"
                        className="h-9 rounded-xl font-bold flex items-center gap-1.5 text-foreground shadow-md shadow-primary/10 transition-transform active:scale-95"
                      >
                        <Plus className="w-4 h-4 text-foreground" /> Save Now
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => setIsAutoPayOpen(true)}
                      size="sm"
                      variant="outline"
                      className="h-9 rounded-xl font-semibold border-muted flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground active:scale-95"
                    >
                      <Settings className="w-3.5 h-3.5" /> Auto-Pay Settings
                    </Button>
                  </div>
                </div>
              </div>

              {/* Subscribed Ingredients Inventory */}
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b pb-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Custom Basket Ingredients</h2>
                </div>

                <div className="divide-y text-xs font-medium">
                  {items.map((planItem: any) => {
                    const item = planItem.foodItem
                    return (
                      <div key={planItem.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                        <div className="flex gap-3 items-center min-w-0 pr-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-xl shrink-0">
                            {item?.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" /> : "🌾"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{item?.name || "Fresh Grocery"}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{item?.brand || "Fresh Farms"} • {item?.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-muted-foreground font-black">×{planItem.quantity}</span>
                          <span className="font-black text-foreground">{formatCurrency(item?.pricePerUnit * planItem.quantity)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right side Auto-pay info, Delivery Profiles selector and delete button */}
            <div className="space-y-6">
              
              {/* Auto-Pay Planner Card */}
              <div className="rounded-2xl border bg-card p-5 space-y-3.5 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" /> Auto-Pay Scheduler
                  </h3>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[8px] tracking-tight font-black uppercase",
                      plan.autoPayEnabled
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {plan.autoPayEnabled ? "Active" : "Inactive"}
                  </span>
                </div>

                {plan.autoPayEnabled ? (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Automated savings transfer rules are configured and active. Periodic deductions will credit your groceries goal automatically.
                    </p>
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 p-2.5 rounded-xl text-[10px] font-bold text-foreground">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">Cycle Frequency</span>
                        <span className="capitalize">{plan.autoPayFrequency}</span>
                      </div>
                      <div className="flex flex-col gap-0.5 items-end">
                        <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-black">Transfer Amount</span>
                        <span>{formatCurrency(plan.autoPayAmount || 0)}</span>
                      </div>
                    </div>
                    {plan.autoPayNextDate && (
                      <p className="text-[9px] text-primary font-bold text-center">
                        Next Auto-Pay transfer: {formatDate(plan.autoPayNextDate)}
                      </p>
                    )}
                    <Button
                      onClick={handleDisableAutoPay}
                      disabled={isActionLoading}
                      variant="outline"
                      size="sm"
                      className="w-full h-8 rounded-lg text-[10px] font-bold border-red-500/35 hover:bg-red-500/5 hover:text-red-500 transition-colors"
                    >
                      {isActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Disable Auto-Pay"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Auto-Pay scheduler is inactive. Enable rules to automatically deposit set amounts periodically, accelerating your progress goal.
                    </p>
                    <Button
                      onClick={() => setIsAutoPayOpen(true)}
                      variant="outline"
                      size="sm"
                      className="w-full h-9 rounded-xl font-bold flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Setup Auto-Pay Rules
                    </Button>
                  </div>
                )}
              </div>

              {/* Shipping profiles pre-delivery swap utility */}
              <div className="rounded-2xl border bg-card p-5 space-y-3.5 shadow-sm text-xs">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" /> Delivery Destination
                  </h3>
                  {profiles.length > 0 && !plan.isPaid && (
                    <select
                      value={plan.deliveryProfileId || ""}
                      onChange={(e) => handleAddressSwap(e.target.value)}
                      disabled={isActionLoading}
                      className="bg-transparent text-[10px] font-black text-primary underline focus:outline-none cursor-pointer text-right max-w-[130px]"
                    >
                      {profiles.map((p: any) => (
                        <option key={p.id} value={p.id} className="text-foreground">
                          {p.fullName} ({p.city})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {profile ? (
                  <div className="space-y-1.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-foreground">{profile.fullName} ({profile.phone})</span>
                      <span className="text-[11px] text-muted-foreground leading-normal mt-0.5">
                        {profile.address}, {profile.city}, {profile.state}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Zone Shipping Fee:</span>
                      <span className="text-foreground">{formatCurrency(plan.deliveryFee || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No active address profiles linked.</p>
                )}
              </div>

              {/* Goal Deletion CTA */}
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm text-xs">
                <h3 className="text-sm font-bold text-foreground border-b pb-2">Destructive Options</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Delete savings goal permanently and instantly refund all accrued savings back to your digital NestPurse wallet.
                </p>
                <Button
                  onClick={() => setIsDeleteOpen(true)}
                  variant="destructive"
                  className="w-full h-10 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <Trash className="w-4 h-4" /> Delete Goal & Refund
                </Button>
              </div>

            </div>
          </div>
        </div>

        {/* Deposit Quick-Save Drawer */}
        <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
          <DialogContent className="max-w-sm rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <Plus className="w-5 h-5 text-primary" /> Savings Goal Deposit
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Accelerate your groceries target by making manual deposits. Min ₦500.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-medium">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Deposit Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="e.g. 5000"
                  className="h-10 rounded-xl border-muted font-bold text-sm"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>

              {/* Preset Chips */}
              <div className="flex gap-2">
                {[1000, 5000, 10000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountChipClick(amt)}
                    className="flex-1 py-1.5 border rounded-lg hover:bg-primary/5 hover:border-primary/40 font-bold transition-all"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>

              {/* PinInput confirmation */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-1 justify-center text-primary mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Confirm NestPurse PIN</span>
                </div>
                <PinInput
                  value={pinValue}
                  onChange={setPinValue}
                  disabled={isActionLoading}
                />
              </div>

              <Button
                onClick={handleDepositSubmit}
                disabled={isActionLoading || pinValue.length !== 4 || parseFloat(depositAmount) < 500}
                className="w-full h-11 mt-4 rounded-xl text-foreground font-black flex items-center justify-center gap-2"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                ) : (
                  "Authorize Savings Deposit"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Configure Auto-Pay Drawer */}
        <Dialog open={isAutoPayOpen} onOpenChange={setIsAutoPayOpen}>
          <DialogContent className="max-w-sm rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <Calendar className="w-5 h-5 text-primary" /> Configure Auto-Pay
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Set up periodically automated balance transfers from NestPurse.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Frequency</label>
                  <select
                    value={autoPayFreq}
                    onChange={(e) => setAutoPayFreq(e.target.value as any)}
                    className="w-full bg-card border rounded-lg h-9 px-2 text-[11px] font-bold"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Amount (₦)</label>
                  <Input
                    type="number"
                    placeholder="Min ₦500"
                    className="h-9 rounded-lg text-[11px] border-muted font-bold"
                    value={autoPayAmount}
                    onChange={(e) => setAutoPayAmount(e.target.value)}
                  />
                </div>
              </div>

              {/* PinInput confirmation */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-1 justify-center text-primary mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Confirm NestPurse PIN</span>
                </div>
                <PinInput
                  value={pinValue}
                  onChange={setPinValue}
                  disabled={isActionLoading}
                />
              </div>

              <Button
                onClick={handleAutoPaySubmit}
                disabled={isActionLoading || pinValue.length !== 4 || parseFloat(autoPayAmount) < 500}
                className="w-full h-11 mt-4 rounded-xl text-foreground font-black flex items-center justify-center gap-2"
              >
                {isActionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                ) : (
                  "Activate Auto-Pay Plan"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Savings Confirm Dialog */}
        <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent className="max-w-sm rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <Trash className="w-5 h-5 text-destructive" /> Delete Savings Goal
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to delete this custom savings goal?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-medium">
              <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 mb-1.5 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Important Refund Warning:</span>
                </div>
                Deleting this savings goal will instantly release all locked funds. An amount of <strong>{formatCurrency(plan.paidAmount)}</strong> will be immediately refunded back to your NestPurse balance.
              </div>

              {/* PinInput confirmation */}
              <div className="space-y-2 border-t pt-4">
                <div className="flex items-center gap-1 justify-center text-primary mb-1">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Confirm NestPurse PIN</span>
                </div>
                <PinInput
                  value={pinValue}
                  onChange={setPinValue}
                  disabled={isActionLoading}
                />
              </div>

              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setIsDeleteOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={isActionLoading}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={handleDeletePlanSubmit}
                  disabled={isActionLoading || pinValue.length !== 4}
                  variant="destructive"
                  className="flex-1 rounded-xl font-bold"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "Authorize Delete & Refund"
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </SidebarProvider>
  )
}
