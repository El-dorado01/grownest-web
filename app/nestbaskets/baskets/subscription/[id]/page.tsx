// app/nestbaskets/baskets/subscription/[id]/page.tsx
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
import {
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  Pause,
  Play,
  ShieldCheck,
  Trash,
  Truck,
  ArrowLeft,
  Info,
  CheckCircle,
  HelpCircle,
  MapPin,
  ChevronRight,
  User,
  ShoppingBag
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

export default function SubscriptionDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const subscriptionId = params.id as string

  // Dialog states
  const [isCancelOpen, setIsCancelOpen] = React.useState(false)
  const [pinValue, setPinValue] = React.useState("")
  const [isActionLoading, setIsActionLoading] = React.useState(false)

  // SWR for Subscription Details
  const {
    data: subRes,
    isLoading,
    mutate,
  } = useSWR(subscriptionId ? `subscription-details-${subscriptionId}` : null, () =>
    nestBasketsApi.getSubscriptionDetails(subscriptionId)
  )

  const subscription = subRes?.data?.data || null

  // Pause / Resume toggle handlers
  const handleTogglePause = async () => {
    if (!subscription) return
    setIsActionLoading(true)
    try {
      const isPaused = subscription.status === "paused"
      const res = isPaused
        ? await nestBasketsApi.resumeSubscription(subscription.id)
        : await nestBasketsApi.pauseSubscription(subscription.id)

      if (res.data?.success) {
        toast.success(`Subscription successfully ${isPaused ? "resumed" : "paused"}`)
        mutate() // Revalidate
      } else {
        toast.error(res.data?.message || res.error || "Failed to update subscription status")
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong updating state.")
    } finally {
      setIsActionLoading(false)
    }
  }

  // Cancel Handler
  const handleCancelSubmit = async () => {
    if (!subscription) return
    if (pinValue.length !== 4) {
      toast.error("Please enter a valid 4-digit security PIN")
      return
    }

    setIsActionLoading(true)
    try {
      const res = await nestBasketsApi.cancelSubscription(subscription.id)
      if (res.data?.success) {
        toast.success(
          `Successfully cancelled subscription! Refund of ${formatCurrency(
            res.data?.data?.refundAmount || 0
          )} returned to your NestPurse.`
        )
        setIsCancelOpen(false)
        router.push("/nestbaskets/baskets")
      } else {
        toast.error(res.data?.message || res.error || "Failed to cancel subscription")
      }
    } catch (err: any) {
      toast.error(err.message || "Incorrect PIN or insufficient permissions.")
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

  if (!subscription) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="text-5xl">⚠️</span>
            <h2 className="text-xl font-bold">Subscription Not Found</h2>
            <p className="text-sm text-muted-foreground">The requested active delivery pipeline does not exist.</p>
            <Button asChild>
              <Link href="/nestbaskets/baskets">Back to Dashboard</Link>
            </Button>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const items = subscription.items || []
  const payments = subscription.payments || []
  const deliveries = subscription.deliveries || []
  const profile = subscription.deliveryProfile || null

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
                <BreadcrumbPage>Subscription details</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto w-full">
          {/* Main Info Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border bg-card p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-md shadow-primary/2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1",
                    subscription.status === "active"
                      ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20"
                      : subscription.status === "paused"
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 animate-pulse"
                      : "bg-gray-500/10 text-gray-600 dark:bg-gray-500/20"
                  )}
                >
                  <span className={cn("size-1.5 rounded-full bg-current", subscription.status === "active" && "animate-ping")} />
                  {subscription.status}
                </span>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                  Cycle: {subscription.frequency}
                </span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{subscription.title}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Established on {formatDate(subscription.createdAt)}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1.5 shrink-0">
              <span className="text-xs text-muted-foreground font-semibold">Total Price per Cycle</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(subscription.totalAmount)}</span>
              {subscription.status === "active" && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-500/5 px-2 py-0.5 rounded">
                  <Calendar className="w-3 h-3" /> Next delivery: {formatDate(subscription.nextDeliveryDate)}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left side timeline and items list */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deliveries Timeline */}
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b pb-3">
                  <Truck className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Delivery Timeline</h2>
                </div>

                {deliveries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-2.5">
                    <Truck className="w-8 h-8 text-muted-foreground/35" />
                    <p className="text-xs font-bold text-muted-foreground">No active dispatches scheduled yet</p>
                    <p className="text-[10px] text-muted-foreground max-w-[250px]">
                      Your upcoming grocery dispatch will be created automatically prior to your next cycle trigger date.
                    </p>
                  </div>
                ) : (
                  <div className="relative pl-6 border-l-2 border-primary/20 space-y-6 py-2 ml-3">
                    {deliveries.map((delivery: any) => (
                      <div key={delivery.id} className="relative">
                        {/* Timeline marker */}
                        <div
                          className={cn(
                            "absolute left-[-31px] top-1 size-4.5 rounded-full border-4 border-card flex items-center justify-center shadow-md",
                            delivery.status === "delivered"
                              ? "bg-emerald-500"
                              : delivery.status === "failed"
                              ? "bg-destructive"
                              : "bg-primary animate-pulse"
                          )}
                        />
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-foreground">
                              {delivery.status === "delivered"
                                ? "Groceries Fulfilled"
                                : delivery.status === "in_transit"
                                ? "In Transit"
                                : delivery.status === "dispatched"
                                ? "Dispatched"
                                : "Delivery Scheduled"}
                            </h4>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Scheduled: {formatDate(delivery.deliveryDate)}
                            </p>
                            {delivery.riderName && (
                              <div className="text-[10px] text-foreground font-medium flex items-center gap-1.5 p-1 px-2 rounded bg-muted/65 w-fit mt-1.5">
                                <User className="w-3 h-3 text-primary" />
                                <span>Rider: {delivery.riderName} ({delivery.riderPhone})</span>
                              </div>
                            )}
                          </div>
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shrink-0",
                              delivery.status === "delivered"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {delivery.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Snapshotted Items Summary */}
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b pb-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="text-base font-bold text-foreground">Subscribed Ingredients</h2>
                </div>

                <div className="divide-y text-xs font-medium">
                  {items.map((subItem: any) => {
                    const item = subItem.foodItem
                    return (
                      <div key={subItem.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                        <div className="flex gap-3 items-center min-w-0 pr-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-xl shrink-0">
                            {item?.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" /> : "🌾"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-foreground truncate">{item?.name || "Fresh Food Item"}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{item?.brand || "Fresh Farms"} • {item?.unit}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="text-muted-foreground font-black">×{subItem.quantity}</span>
                          <span className="font-black text-foreground">{formatCurrency(subItem.unitPriceAtPurchase * subItem.quantity)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right side controls, delivery address and payment logs */}
            <div className="space-y-6">
              {/* Subscription Controls */}
              <div className="rounded-2xl border bg-card p-5 space-y-4 shadow-sm">
                <h3 className="text-sm font-bold text-foreground border-b pb-2">Control Panel</h3>
                <div className="space-y-2">
                  {subscription.status !== "cancelled" ? (
                    <>
                      <Button
                        onClick={handleTogglePause}
                        disabled={isActionLoading}
                        variant={subscription.status === "paused" ? "default" : "outline"}
                        className="w-full h-10 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                      >
                        {isActionLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-foreground" />
                        ) : subscription.status === "paused" ? (
                          <>
                            <Play className="w-4 h-4" /> Resume Subscription
                          </>
                        ) : (
                          <>
                            <Pause className="w-4 h-4" /> Pause Subscription
                          </>
                        )}
                      </Button>

                      <Button
                        onClick={() => setIsCancelOpen(true)}
                        disabled={isActionLoading}
                        variant="destructive"
                        className="w-full h-10 rounded-xl font-bold flex items-center justify-center gap-2 text-xs"
                      >
                        <Trash className="w-4 h-4" /> Cancel Subscription
                      </Button>
                    </>
                  ) : (
                    <div className="p-3 bg-muted rounded-xl text-center text-xs text-muted-foreground">
                      This subscription is permanently cancelled and cannot be edited.
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex gap-2.5 items-start mt-2">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <strong>Immutability Tip:</strong> Predefined subscriptions protect prices. Pausing suspends active automated renewals, preserving balance. Cancelling instantly refunds current unfulfilled runs.
                  </p>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm text-xs">
                <h3 className="text-sm font-bold text-foreground border-b pb-2">Shipping Destination</h3>
                {profile ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex gap-2 items-start">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground">{profile.fullName}</span>
                        <span className="text-muted-foreground">{profile.phone}</span>
                        <span className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                          {profile.address}, {profile.city}, {profile.state}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">No address profile attached.</p>
                )}
              </div>

              {/* Payment Log */}
              <div className="rounded-2xl border bg-card p-5 space-y-3 shadow-sm">
                <h3 className="text-sm font-bold text-foreground border-b pb-2">Billing History</h3>

                {payments.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground py-2">No past payment receipts registered.</p>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {payments.map((pay: any) => (
                      <div key={pay.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/40 text-[10px] font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-foreground truncate max-w-[120px]">{pay.reference}</span>
                          <span className="text-muted-foreground">{formatDate(pay.paymentDate || pay.createdAt)}</span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-foreground font-black">{formatCurrency(pay.amount)}</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.2 rounded uppercase text-[8px] tracking-tight font-black",
                              pay.status === "success" || pay.status === "paid"
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-destructive/10 text-destructive"
                            )}
                          >
                            {pay.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancellation confirmation PIN modal */}
        <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
          <DialogContent className="max-w-sm rounded-2xl p-6">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-bold flex items-center gap-1.5 text-foreground">
                <Trash className="w-5 h-5 text-destructive" /> Cancel Subscription
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Are you sure you want to cancel this plan? Cancellation is permanent.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-xs font-medium">
              <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-[11px] leading-relaxed">
                <strong>Attention:</strong> If you paid for the current cycle, cancelling immediately stops shipping and automatically refunds the amount of <strong>{formatCurrency(subscription.totalAmount)}</strong> back into your NestPurse balance.
              </div>

              {/* PIN confirm input */}
              <div className="space-y-2">
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
                  onClick={() => setIsCancelOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                  disabled={isActionLoading}
                >
                  Dismiss
                </Button>
                <Button
                  onClick={handleCancelSubmit}
                  disabled={isActionLoading || pinValue.length !== 4}
                  variant="destructive"
                  className="flex-1 rounded-xl font-bold"
                >
                  {isActionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    "Authorize Cancel"
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
