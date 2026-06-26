"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import useSWR from "swr"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbLink,
} from "@/components/ui/breadcrumb"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import {
  PredefinedPlan,
  PredefinedPlanItem,
  UserSubscription,
  CustomPlan,
  SubscribeRequest,
} from "@/types/nestbaskets"
import { toast } from "sonner"
import {
  ShoppingBag,
  Calendar,
  RefreshCw,
  Pause,
  Play,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { PinInput } from "@/components/ui/pin-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const toTitleCase = (str: string) => {
  if (!str) return ""
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function BasketsPageContent() {
  const { isAuthenticated } = useAuth()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const [activeTab, setActiveTab] = useState<
    "plans" | "subscriptions" | "flexible"
  >("plans")

  useEffect(() => {
    if (
      tabParam === "plans" ||
      tabParam === "subscriptions" ||
      tabParam === "flexible"
    ) {
      setActiveTab(tabParam)
    }
  }, [tabParam])
  const [pausingId, setPausingId] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const isMobile = useIsMobile()

  // Predefined Plan Direct Subscription States
  const [directSubPlan, setDirectSubPlan] = useState<any | null>(null)
  const [isDirectCheckoutOpen, setIsDirectCheckoutOpen] = useState(false)
  const [directFreq, setDirectFreq] = useState<
    "weekly" | "monthly" | "quarterly" | "yearly"
  >("monthly")
  const [directPin, setDirectPin] = useState("")
  const [isDirectSubmitting, setIsDirectSubmitting] = useState(false)

  // Fetch Delivery Profiles for Direct Subscription
  const { data: profilesRes } = useSWR(
    isAuthenticated ? "delivery-profiles" : null,
    () => nestBasketsApi.getDeliveryProfiles()
  )
  const profiles = profilesRes?.data?.data ?? []
  const defaultProfile = profilesRes?.data?.default ?? null
  const [selectedDirectProfileId, setSelectedDirectProfileId] = useState<string>("")

  useEffect(() => {
    if (isDirectCheckoutOpen) {
      if (defaultProfile) {
        setSelectedDirectProfileId(defaultProfile.id)
      } else if (profiles.length > 0) {
        setSelectedDirectProfileId(profiles[0].id)
      } else {
        setSelectedDirectProfileId("")
      }
    }
  }, [isDirectCheckoutOpen, defaultProfile, profiles])

  // 1. Fetch Predefined Plans & User Custom Drafts
  const {
    data: plansRes,
    error: plansError,
    isLoading: plansLoading,
    mutate: mutatePlans,
  } = useSWR("nestbaskets-all-plans", () => nestBasketsApi.getAllPlans())

  // 2. Fetch User's Active recurring subscriptions
  const {
    data: subsRes,
    error: subsError,
    isLoading: subsLoading,
    mutate: mutateSubs,
  } = useSWR("nestbaskets-my-subs", () => nestBasketsApi.getMySubscriptions())

  // 3. Fetch User's Active flexible saving plans
  const {
    data: flexRes,
    error: flexError,
    isLoading: flexLoading,
    mutate: mutateFlex,
  } = useSWR("nestbaskets-my-flexible", () =>
    nestBasketsApi.getMyFlexiblePlans()
  )

  const predefinedPlans = (plansRes?.data?.data?.predefined as any[]) || []
  const subscriptions = (subsRes?.data?.data as any[]) || []
  const flexiblePlans = (flexRes?.data?.data as any[]) || []

  const totalSavedFlexible = flexiblePlans.reduce(
    (sum: number, plan: any) => sum + (plan.paidAmount || 0),
    0
  )
  const totalMonthlyCommitment = subscriptions
    .filter((sub: any) => sub.status === "active")
    .reduce((sum: number, sub: any) => sum + (sub.totalAmount || 0), 0)

  const handleDirectSubmit = async () => {
    if (!directSubPlan) return
    const activeProfile = profiles.find((p: any) => p.id === selectedDirectProfileId) || defaultProfile
    if (!activeProfile) {
      toast.error("Please add a delivery address first.")
      return
    }
    if (directPin.length !== 4) {
      toast.error("Please enter your 4-digit security PIN")
      return
    }

    setIsDirectSubmitting(true)
    try {
      const isDefaultSelected = defaultProfile?.id === activeProfile.id
      
      const payload: SubscribeRequest = {
        predefinedPlanId: directSubPlan.id,
        frequency: directFreq,
        useDefaultDelivery: isDefaultSelected,
        pin: directPin,
      }

      if (!isDefaultSelected) {
        payload.deliveryOverride = {
          fullName: activeProfile.fullName,
          phone: activeProfile.phone,
          address: activeProfile.address,
          city: activeProfile.city,
          state: activeProfile.state,
          landmark: activeProfile.landmark || undefined,
          notes: activeProfile.notes || undefined,
        }
      }

      const res = await nestBasketsApi.subscribeToPlan(payload)

      if (res.error || !res.data?.success) {
        throw new Error(res.data?.message || res.error || "Failed to subscribe")
      }

      toast.success(
        `Successfully subscribed to predefined bundle: ${directSubPlan.name}`
      )

      // Reset states
      setIsDirectCheckoutOpen(false)
      setDirectSubPlan(null)
      setDirectPin("")
      setDirectFreq("monthly")

      // Refresh subscriptions list
      await mutateSubs()

      // Switch to subscriptions tab
      setActiveTab("subscriptions")
    } catch (err: any) {
      toast.error(
        err.message || "An unexpected error occurred during subscription"
      )
    } finally {
      setIsDirectSubmitting(false)
    }
  }

  const renderDirectCheckoutForm = () => {
    if (!directSubPlan) return null
    const activeProfile = profiles.find((p: any) => p.id === selectedDirectProfileId) || defaultProfile
    return (
      <div className="space-y-5 text-left">
        {/* Cost Summary */}
        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4 shadow-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">
              Predefined Bundle:
            </span>
            <span className="font-bold text-foreground capitalize">
              {directSubPlan.name}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">
              Total Cost:
            </span>
            <span className="font-extrabold text-primary">
              ₦{directSubPlan.price.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Frequency */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Subscription Frequency
          </label>
          <Select
            value={directFreq}
            onValueChange={(val: any) => setDirectFreq(val)}
          >
            <SelectTrigger className="w-full rounded-xl border-border bg-background">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover text-popover-foreground">
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] leading-normal font-medium text-muted-foreground">
            Your NestPurse wallet will be debited automatically every{" "}
            {directFreq} for this subscription.
          </p>
        </div>

        {/* Delivery Address */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
              Delivery Address
            </label>
            {profiles.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-bold text-primary hover:no-underline"
                  >
                    Change
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-3 bg-popover border border-border/60 rounded-xl shadow-lg" align="end">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground px-1">Select Delivery Address</p>
                    <div className="max-h-60 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                      {profiles.map((p: any) => {
                        const isSelected = p.id === activeProfile?.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setSelectedDirectProfileId(p.id)}
                            className={`w-full text-left flex items-start gap-2.5 rounded-lg border p-2.5 transition-all text-xs ${
                              isSelected
                                ? "border-primary bg-primary/5 font-semibold text-foreground"
                                : "border-border/60 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isSelected ? (
                                <CheckCircle2 className="size-4 text-primary" />
                              ) : (
                                <div className="size-4 rounded-full border border-muted-foreground/30" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 font-bold">
                                <span className="truncate">{p.fullName}</span>
                                {p.isDefault && (
                                  <Badge className="bg-primary/10 text-primary text-[9px] hover:bg-primary/10 px-1 py-0 h-auto font-bold uppercase shrink-0">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="truncate text-[11px] mt-0.5">{p.address}</p>
                              <p className="text-[10px] text-muted-foreground/80 mt-0.5">
                                {p.city}, {p.state}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <Separator className="my-1 border-border/40" />
                    
                    <div className="pt-1.5 text-center">
                      <Link
                        href="/settings?tab=addresses"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                        onClick={() => {
                          setIsDirectCheckoutOpen(false);
                        }}
                      >
                        <Plus className="size-3.5" />
                        Add new address
                      </Link>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
          {activeProfile ? (
            <div className="space-y-2 rounded-xl border border-border/50 bg-background p-3.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>{activeProfile.fullName}</span>
                <span className="font-mono text-muted-foreground">
                  {activeProfile.phone}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {activeProfile.address}, {activeProfile.city},{" "}
                {activeProfile.state}
              </p>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-center">
              <p className="text-xs font-medium text-destructive">
                No delivery address found. Please configure an address in settings to continue.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="rounded-lg border-destructive/30 text-destructive hover:bg-destructive/10"
                asChild
              >
                <Link href="/settings?tab=addresses">Add New Address</Link>
              </Button>
            </div>
          )}
        </div>

        {/* PIN Entry */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
            Confirm Wallet PIN
          </label>
          <div className="flex justify-center py-1">
            <PinInput
              value={directPin}
              onChange={(val) => setDirectPin(val)}
              length={4}
              disabled={isDirectSubmitting}
            />
          </div>
          <p className="text-center text-[10px] leading-normal font-medium text-muted-foreground">
            Enter your 4-digit transaction security PIN to authorize this
            recurring debit.
          </p>
        </div>
      </div>
    )
  }

  const renderPlanDetails = (plan: any) => {
    if (!plan) return null
    return (
      <div className="space-y-4 text-left">
        {/* Hero Image */}
        <div className="relative h-48 w-full overflow-hidden rounded-xl border border-border/40 bg-muted">
          {plan.imageUrl ? (
            <img
              src={plan.imageUrl}
              alt={plan.name}
              className="animate-fade-in h-full w-full object-cover object-left"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
              <ShoppingBag className="size-16" />
            </div>
          )}
          <div className="absolute top-3 right-3 rounded-full border border-border/80 bg-background/95 px-3.5 py-2 text-sm font-extrabold text-primary shadow-md backdrop-blur-md">
            ₦{plan.price.toLocaleString()} / {plan.frequency}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-foreground">
            {toTitleCase(plan.name)}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {plan.description}
          </p>

          <div className="mt-2.5 flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary/5 p-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-3.5" />
            </div>
            <p className="text-xs leading-relaxed font-medium text-muted-foreground">
              Predefined bundles are immutable. Want to add, swap, or drop
              items?{" "}
              <Link
                href={`/nestbaskets/baskets/new?cloneFrom=${plan.id}`}
                className="inline-block font-bold text-primary transition-all hover:text-primary/95 hover:underline"
              >
                Clone & Customize this basket
              </Link>
            </p>
          </div>
        </div>

        <Separator className="border-border/40" />

        {/* Item List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Included Items ({plan.items?.length || 0})
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Frequency: {toTitleCase(plan.frequency)}
            </span>
          </div>

          <div className="custom-scrollbar max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {plan.items?.map((item: any) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border/10 bg-muted/30 px-3 py-2 transition-all duration-200 hover:bg-muted/55"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <ShoppingBag className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">
                      {item.foodItem.name}
                    </p>
                    {item.foodItem.brand && (
                      <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                        {item.foodItem.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {item.foodItem.weightPerUnit && (
                    <span className="rounded-full border border-border/20 bg-muted/80 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      {item.foodItem.weightPerUnit} {item.foodItem.unit || "kg"}
                    </span>
                  )}
                  <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                    × {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handlePauseResume = async (
    subId: string,
    currentStatus: "active" | "paused" | "cancelled"
  ) => {
    if (currentStatus === "cancelled") return
    try {
      setPausingId(subId)
      if (currentStatus === "active") {
        const res = await nestBasketsApi.pauseSubscription(subId)
        if (res.data?.success || res.status === 200) {
          toast.success("Subscription paused successfully.")
        } else {
          toast.error(res.error || "Failed to pause subscription.")
        }
      } else {
        const res = await nestBasketsApi.resumeSubscription(subId)
        if (res.data?.success || res.status === 200) {
          toast.success("Subscription resumed successfully.")
        } else {
          toast.error(res.error || "Failed to resume subscription.")
        }
      }
      // Revalidate subscriptions cache
      mutateSubs()
      mutatePlans()
    } catch (err) {
      toast.error("An error occurred. Please try again.")
    } finally {
      setPausingId(null)
    }
  }

  const hasBaskets = subscriptions.length > 0 || flexiblePlans.length > 0

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur-md">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground">
                  Food Baskets
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6">
          {/* Header Section */}
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                NestBaskets
              </h1>
              <p className="mt-1 text-muted-foreground">
                Subscribe to curated food plans or save toward custom grocery
                goals automatically.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <Button
                className="bg-primary font-semibold text-primary-foreground shadow-xs hover:bg-primary/95"
                asChild
              >
                <Link href="/nestbaskets/baskets/new">
                  <Plus className="mr-2 size-4" />
                  Create Custom Basket
                </Link>
              </Button>
            </div>
          </section>

          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Active Plans */}
            <Card className="border border-border/60 transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Plans
                </CardTitle>
                <ShoppingBag className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {subscriptions.length + flexiblePlans.length}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                  Active subscriptions & savings goals
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Total Saved */}
            <Card className="border border-border/60 transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Saved
                </CardTitle>
                <TrendingUp className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₦{totalSavedFlexible.toLocaleString()}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                  Saved toward custom grocery goals
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Scheduled Commitments */}
            <Card className="border border-border/60 transition-all hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Scheduled Commitments
                </CardTitle>
                <RefreshCw className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₦{totalMonthlyCommitment.toLocaleString()}
                </div>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                  Total active monthly commitments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="w-full overflow-x-auto border-b border-border/80 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max flex-nowrap gap-6">
              <button
                onClick={() => setActiveTab("plans")}
                className={`relative pb-3 text-sm font-semibold transition-all ${
                  activeTab === "plans"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Predefined Bundles
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
                  activeTab === "subscriptions"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Subscriptions
                {subscriptions.length > 0 && (
                  <Badge className="flex size-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground hover:bg-primary">
                    {subscriptions.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab("flexible")}
                className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition-all ${
                  activeTab === "flexible"
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Savings Goals
                {flexiblePlans.length > 0 && (
                  <Badge className="flex size-5 items-center justify-center rounded-full bg-primary p-0 text-[10px] font-bold text-primary-foreground hover:bg-primary">
                    {flexiblePlans.length}
                  </Badge>
                )}
              </button>
            </div>
          </div>

          {/* TAB 1: CURATED BUNDLES */}
          {activeTab === "plans" && (
            <div className="space-y-6">
              {plansLoading ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Card
                      key={i}
                      className="overflow-hidden border border-border/40"
                    >
                      <Skeleton className="h-48 w-full" />
                      <CardHeader className="space-y-2">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-24 w-full" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-10 w-full" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : predefinedPlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
                  <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <ShoppingBag className="size-6" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    No Curated Baskets
                  </h3>
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    Predefined plans are not loaded yet or are temporarily
                    unavailable.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {predefinedPlans.map((plan: any) => (
                    <Card
                      key={plan.id}
                      className="group flex flex-col justify-between overflow-hidden border border-border/60 bg-card pt-0 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                    >
                      <div>
                        {/* Plan Header Image */}
                        <div className="relative h-44 w-full overflow-hidden rounded-t-xl bg-muted">
                          {plan.imageUrl ? (
                            <img
                              src={plan.imageUrl}
                              alt={plan.name}
                              className="h-full w-full rounded-t-xl object-cover object-left transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-t-xl bg-primary/5 text-primary">
                              <ShoppingBag className="size-12" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 rounded-full border border-border/60 bg-background/90 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur-md">
                            ₦{plan.price.toLocaleString()} / {plan.frequency}
                          </div>
                        </div>

                        <CardHeader className="space-y-1 p-5 pb-3">
                          <CardTitle className="text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                            {toTitleCase(plan.name)}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                            {plan.description}
                          </CardDescription>
                        </CardHeader>

                        {/* Plan Items */}
                        <CardContent className="px-5 py-2">
                          <Separator className="mb-3 border-border/40" />
                          <p className="mb-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                            Basket Includes:
                          </p>
                          <ul className="space-y-1.5 text-sm text-foreground/80">
                            {plan.items?.slice(0, 3).map((item: any) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between rounded-lg border border-border/20 bg-muted/30 px-2.5 py-1.5"
                              >
                                <span className="mr-2 truncate font-medium">
                                  {item.foodItem.name}{" "}
                                  {item.foodItem.brand
                                    ? `(${item.foodItem.brand})`
                                    : ""}
                                </span>
                                <span className="shrink-0 rounded border border-primary/10 bg-primary/5 px-1.5 py-0.5 font-bold text-primary">
                                  × {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {plan.items?.length > 3 && (
                            <div className="mt-2.5 text-center">
                              <span className="inline-block rounded-full border border-border/30 bg-muted/60 px-2.5 py-0.5 text-xs font-bold text-muted-foreground/90">
                                + {plan.items.length - 3} more item
                                {plan.items.length - 3 > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </div>

                      <CardFooter className="mt-auto flex gap-3 p-5 pt-3">
                        <Button
                          variant="outline"
                          className="flex-1 border-border font-semibold text-foreground transition-colors hover:bg-muted"
                          onClick={() => {
                            setSelectedPlan(plan)
                            setIsDetailsOpen(true)
                          }}
                        >
                          Details
                        </Button>
                        <Button
                          className="flex-1 bg-primary font-semibold text-primary-foreground shadow-sm transition-all duration-200 hover:bg-primary/95"
                          onClick={() => {
                            setDirectSubPlan(plan)
                            setIsDirectCheckoutOpen(true)
                          }}
                        >
                          Subscribe
                          <ArrowRight className="ml-1.5 size-4" />
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY SUBSCRIPTIONS */}
          {activeTab === "subscriptions" && (
            <div className="animate-in space-y-6 duration-300 fade-in">
              {subsLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2].map((i) => (
                      <Card key={i} className="space-y-4 p-5">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </Card>
                    ))}
                  </div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary">
                    <ShoppingBag className="size-7" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    No Subscriptions Yet
                  </h3>
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    You haven&apos;t subscribed to any regular food plans yet.
                    Build a custom groceries loop from farm to table.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("plans")}
                      className="border-border font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Browse Bundles
                    </Button>
                    <Button
                      className="bg-primary font-semibold text-primary-foreground hover:bg-primary/95"
                      asChild
                    >
                      <Link href="/nestbaskets/baskets/new">
                        Create Custom Basket
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {subscriptions.map((sub: any) => {
                    const nextDelivery = new Date(sub.nextDeliveryDate)
                    const isPaused = sub.status === "paused"

                    return (
                      <Card
                        key={sub.id}
                        className="flex flex-col justify-between overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-primary/30"
                      >
                        <CardHeader className="p-5 pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-base font-bold text-foreground">
                                {sub.title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="size-3.5" />
                                Every {sub.frequency} • ₦
                                {sub.totalAmount.toLocaleString()}
                              </CardDescription>
                            </div>
                            <Badge
                              className={`text-xs font-semibold ${
                                isPaused
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                              }`}
                            >
                              {sub.status.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3 border-y border-border/40 bg-muted/20 p-5 py-3">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium text-muted-foreground">
                              <Clock className="size-4" />
                              <span>Next Delivery:</span>
                            </div>
                            <span className="font-semibold text-foreground">
                              {nextDelivery.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 font-medium text-muted-foreground">
                              <CheckCircle2 className="size-4 text-primary" />
                              <span>Shipping Address:</span>
                            </div>
                            <span className="max-w-[200px] truncate font-medium text-foreground">
                              {sub.deliveryProfile?.address ||
                                "Default Address"}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="mt-auto flex justify-end gap-3 bg-card p-4">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pausingId === sub.id}
                            onClick={() =>
                              handlePauseResume(sub.id, sub.status)
                            }
                            className="border-border font-semibold text-foreground transition-colors hover:bg-muted"
                          >
                            {pausingId === sub.id ? (
                              <RefreshCw className="mr-1.5 size-3.5 animate-spin" />
                            ) : isPaused ? (
                              <Play className="mr-1.5 size-3.5 fill-current" />
                            ) : (
                              <Pause className="mr-1.5 size-3.5 fill-current" />
                            )}
                            {isPaused ? "Resume" : "Pause"}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary font-semibold text-primary-foreground hover:bg-primary/95"
                            asChild
                          >
                            <Link
                              href={`/nestbaskets/baskets/subscription/${sub.id}`}
                            >
                              Manage
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVINGS GOALS */}
          {activeTab === "flexible" && (
            <div className="animate-in space-y-6 duration-300 fade-in">
              {flexLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2].map((i) => (
                      <Card key={i} className="space-y-4 p-5">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </Card>
                    ))}
                  </div>
                </div>
              ) : flexiblePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card p-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary">
                    <TrendingUp className="size-7" />
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground">
                    No Savings Goals Yet
                  </h3>
                  <p className="mb-6 max-w-sm text-sm text-muted-foreground">
                    You haven&apos;t set up any dynamic savings goals yet.
                    Create custom ingredient baskets and fund them at your
                    convenience.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("plans")}
                      className="border-border font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Browse Bundles
                    </Button>
                    <Button
                      className="bg-primary font-semibold text-primary-foreground hover:bg-primary/95"
                      asChild
                    >
                      <Link href="/nestbaskets/baskets/new">
                        Create Custom Basket
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {flexiblePlans.map((plan: any) => {
                    const progress = plan.progress || 0
                    const isFullyPaid = plan.isPaid
                    const isPendingSelection =
                      plan.status === "pending_selection"
                    const autoPay = plan.autoPay

                    return (
                      <Card
                        key={plan.id}
                        className="flex flex-col justify-between overflow-hidden border border-border/60 bg-card shadow-sm transition-all duration-300 hover:border-secondary/30"
                      >
                        <CardHeader className="p-4 pb-2.5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <CardTitle className="truncate text-base font-bold text-foreground">
                                {plan.title}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <TrendingUp className="size-3.5 shrink-0 text-secondary" />
                                <span className="truncate">
                                  Target Goal: ₦
                                  {plan.totalPrice.toLocaleString()}
                                </span>
                              </CardDescription>
                            </div>
                            <Badge
                              className={`shrink-0 text-xs font-semibold ${
                                isFullyPaid
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                                  : isPendingSelection
                                    ? "border border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400"
                                    : "border border-secondary/20 bg-secondary/10 text-secondary hover:bg-secondary/10"
                              }`}
                            >
                              {isFullyPaid
                                ? "FULLY PAID"
                                : isPendingSelection
                                  ? "PENDING"
                                  : `${progress}% SAVED`}
                            </Badge>
                          </div>
                        </CardHeader>

                        {/* Progress bar and details */}
                        <CardContent className="space-y-3 border-y border-border/40 bg-muted/20 p-4 py-3">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-muted-foreground">
                                Progress
                              </span>
                              <span className="text-foreground">
                                ₦{plan.paidAmount.toLocaleString()} saved
                              </span>
                            </div>
                            {/* Custom beautiful gold/bronze progress bar */}
                            <div className="h-2 w-full overflow-hidden rounded-full border border-border/40 bg-muted">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  isPendingSelection
                                    ? "bg-amber-500"
                                    : "bg-primary"
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-muted-foreground">
                              Auto-Savings:
                            </span>
                            <span
                              className={`font-semibold ${autoPay?.enabled ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {autoPay?.enabled
                                ? `Active (${autoPay.frequency})`
                                : "Disabled"}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="mt-auto flex justify-end gap-2.5 bg-card p-3">
                          <Button
                            size="sm"
                            className={`font-semibold ${
                              isPendingSelection
                                ? "bg-amber-600 text-white hover:bg-amber-700"
                                : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            }`}
                            asChild
                          >
                            <Link
                              href={`/nestbaskets/baskets/flexible/${plan.id}`}
                            >
                              {isPendingSelection
                                ? "Resolve Expired Goal"
                                : "Manage Goal"}
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Responsive Predefined Plan Details Viewer */}
        {selectedPlan &&
          (!isMobile ? (
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="flex max-h-[85vh] flex-col justify-between gap-5 rounded-2xl border border-border/60 bg-card p-6 shadow-xl sm:max-w-[480px]">
                <div>
                  <DialogHeader className="mb-4 p-0">
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Basket Details
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      View the full contents and specifications of this curated
                      food basket.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="custom-scrollbar max-h-[50vh] overflow-y-auto pr-1 pb-2">
                    {renderPlanDetails(selectedPlan)}
                  </div>
                </div>

                <DialogFooter className="mt-1 flex w-full shrink-0 items-center gap-3 border-t border-border/20 p-0 pt-3 sm:justify-between">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-border font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Close
                    </Button>
                  </DialogClose>
                  <Button
                    className="flex-1 bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-200 hover:bg-primary/95 hover:shadow-primary/20"
                    onClick={() => {
                      setIsDetailsOpen(false)
                      setDirectSubPlan(selectedPlan)
                      setIsDirectCheckoutOpen(true)
                    }}
                  >
                    Subscribe Now
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DrawerContent className="flex max-h-[85vh] flex-col justify-between rounded-t-2xl border-t border-border/60 bg-card p-6">
                <DrawerHeader className="mb-4 shrink-0 p-0 text-left">
                  <DrawerTitle className="text-lg font-bold text-foreground">
                    Basket Details
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-muted-foreground">
                    View the full contents and specifications of this curated
                    food basket.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
                  {renderPlanDetails(selectedPlan)}
                </div>

                <DrawerFooter className="flex shrink-0 flex-col gap-2 border-t border-border/40 p-0 pt-4">
                  <Button
                    className="w-full bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/95"
                    onClick={() => {
                      setIsDetailsOpen(false)
                      setDirectSubPlan(selectedPlan)
                      setIsDirectCheckoutOpen(true)
                    }}
                  >
                    Subscribe Now
                    <ArrowRight className="ml-1.5 size-4" />
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      className="w-full border-border py-3.5 font-semibold text-foreground"
                    >
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ))}

        {directSubPlan &&
          (isDirectCheckoutOpen ? (
            <Dialog
              open={isDirectCheckoutOpen}
              onOpenChange={setIsDirectCheckoutOpen}
            >
              <DialogContent className="flex max-h-[85vh] max-w-md flex-col justify-between rounded-2xl border-border bg-card p-6 shadow-xl">
                <div>
                  <DialogHeader className="mb-4 p-0">
                    <DialogTitle className="text-xl font-bold text-foreground">
                      Direct Subscription
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Subscribe directly to this predefined bundle using your
                      digital wallet.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="custom-scrollbar max-h-[50vh] overflow-y-auto pr-1 pb-2">
                    {renderDirectCheckoutForm()}
                  </div>
                </div>

                <DialogFooter className="mt-1 flex w-full shrink-0 items-center gap-3 border-t border-border/20 p-0 pt-3 sm:justify-between">
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-border font-semibold text-foreground transition-colors hover:bg-muted"
                      disabled={isDirectSubmitting}
                    >
                      Cancel
                    </Button>
                  </DialogClose>
                  <Button
                    className="flex-1 bg-primary font-semibold text-primary-foreground shadow-md shadow-primary/15 transition-all duration-200 hover:bg-primary/95 hover:shadow-primary/20"
                    disabled={
                      isDirectSubmitting ||
                      directPin.length !== 4 ||
                      !selectedDirectProfileId
                    }
                    onClick={handleDirectSubmit}
                  >
                    {isDirectSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Confirm & Pay"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer
              open={isDirectCheckoutOpen}
              onOpenChange={setIsDirectCheckoutOpen}
            >
              <DrawerContent className="flex max-h-[90vh] flex-col justify-between rounded-t-2xl border-t border-border/60 bg-card p-6">
                <DrawerHeader className="mb-4 shrink-0 p-0 text-left">
                  <DrawerTitle className="text-lg font-bold text-foreground">
                    Direct Subscription
                  </DrawerTitle>
                  <DrawerDescription className="text-xs text-muted-foreground">
                    Subscribe directly to this predefined bundle using your
                    digital wallet.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto pr-1 pb-4">
                  {renderDirectCheckoutForm()}
                </div>

                <DrawerFooter className="flex shrink-0 flex-col gap-2 border-t border-border/40 p-0 pt-4">
                  <Button
                    className="w-full bg-primary py-3.5 font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/95"
                    disabled={
                      isDirectSubmitting ||
                      directPin.length !== 4 ||
                      !selectedDirectProfileId
                    }
                    onClick={handleDirectSubmit}
                  >
                    {isDirectSubmitting ? (
                      <>
                        <Loader2 className="mr-1.5 size-4 animate-spin" />
                        Subscribing...
                      </>
                    ) : (
                      "Confirm & Pay"
                    )}
                  </Button>
                  <DrawerClose asChild>
                    <Button
                      variant="outline"
                      className="w-full border-border py-3.5 font-semibold text-foreground"
                      disabled={isDirectSubmitting}
                    >
                      Cancel
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          ))}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function BasketsPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <BasketsPageContent />
    </React.Suspense>
  )
}
