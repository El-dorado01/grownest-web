"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { nestBasketsApi } from "@/lib/nestbaskets-api";
import { 
  PredefinedPlan, 
  PredefinedPlanItem, 
  UserSubscription, 
  CustomPlan 
} from "@/types/nestbaskets";
import { toast } from "sonner";
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
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from "@/components/ui/drawer";

const toTitleCase = (str: string) => {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function BasketsPageContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"plans" | "subscriptions" | "flexible">("plans");

  useEffect(() => {
    if (tabParam === "plans" || tabParam === "subscriptions" || tabParam === "flexible") {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  const [pausingId, setPausingId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const isMobile = useIsMobile();

  // 1. Fetch Predefined Plans & User Custom Drafts
  const { data: plansRes, error: plansError, isLoading: plansLoading, mutate: mutatePlans } = useSWR(
    "nestbaskets-all-plans",
    () => nestBasketsApi.getAllPlans()
  );

  // 2. Fetch User's Active recurring subscriptions
  const { data: subsRes, error: subsError, isLoading: subsLoading, mutate: mutateSubs } = useSWR(
    "nestbaskets-my-subs",
    () => nestBasketsApi.getMySubscriptions()
  );

  // 3. Fetch User's Active flexible saving plans
  const { data: flexRes, error: flexError, isLoading: flexLoading, mutate: mutateFlex } = useSWR(
    "nestbaskets-my-flexible",
    () => nestBasketsApi.getMyFlexiblePlans()
  );

  const predefinedPlans = (plansRes?.data?.data?.predefined as any[]) || [];
  const subscriptions = (subsRes?.data?.data as any[]) || [];
  const flexiblePlans = (flexRes?.data?.data as any[]) || [];

  const totalSavedFlexible = flexiblePlans.reduce((sum: number, plan: any) => sum + (plan.paidAmount || 0), 0);
  const totalMonthlyCommitment = subscriptions
    .filter((sub: any) => sub.status === "active")
    .reduce((sum: number, sub: any) => sum + (sub.totalAmount || 0), 0);

  const renderPlanDetails = (plan: any) => {
    if (!plan) return null;
    return (
      <div className="space-y-4 text-left">
        {/* Hero Image */}
        <div className="relative h-48 w-full overflow-hidden rounded-xl bg-muted border border-border/40">
          {plan.imageUrl ? (
            <img
              src={plan.imageUrl}
              alt={plan.name}
              className="h-full w-full object-cover object-left animate-fade-in"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary">
              <ShoppingBag className="size-16" />
            </div>
          )}
          <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-md px-3.5 py-2 rounded-full border border-border/80 font-extrabold text-sm text-primary shadow-md">
            ₦{plan.price.toLocaleString()} / {plan.frequency}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-foreground">{toTitleCase(plan.name)}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
          
          <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/15 p-3 mt-2.5">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
              <Sparkles className="size-3.5" />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground font-medium">
              Predefined bundles are immutable. Want to add, swap, or drop items?{" "}
              <Link 
                href={`/nestbaskets/baskets/new?cloneFrom=${plan.id}`}
                className="text-primary font-bold hover:underline hover:text-primary/95 transition-all inline-block"
              >
                Clone & Customize this basket
              </Link>
            </p>
          </div>
        </div>

        <Separator className="border-border/40" />

        {/* Item List */}
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Included Items ({plan.items?.length || 0})
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Frequency: {toTitleCase(plan.frequency)}
            </span>
          </div>

          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {plan.items?.map((item: any) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between bg-muted/30 hover:bg-muted/55 border border-border/10 px-3 py-2 rounded-xl transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-7 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <ShoppingBag className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {item.foodItem.name}
                    </p>
                    {item.foodItem.brand && (
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {item.foodItem.brand}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {item.foodItem.weightPerUnit && (
                    <span className="text-xs text-muted-foreground font-semibold bg-muted/80 px-2.5 py-0.5 rounded-full border border-border/20">
                      {item.foodItem.weightPerUnit} {item.foodItem.unit || "kg"}
                    </span>
                  )}
                  <span className="text-primary font-bold bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20 text-xs">
                    × {item.quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handlePauseResume = async (subId: string, currentStatus: "active" | "paused" | "cancelled") => {
    if (currentStatus === "cancelled") return;
    try {
      setPausingId(subId);
      if (currentStatus === "active") {
        const res = await nestBasketsApi.pauseSubscription(subId);
        if (res.data?.success || res.status === 200) {
          toast.success("Subscription paused successfully.");
        } else {
          toast.error(res.error || "Failed to pause subscription.");
        }
      } else {
        const res = await nestBasketsApi.resumeSubscription(subId);
        if (res.data?.success || res.status === 200) {
          toast.success("Subscription resumed successfully.");
        } else {
          toast.error(res.error || "Failed to resume subscription.");
        }
      }
      // Revalidate subscriptions cache
      mutateSubs();
      mutatePlans();
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setPausingId(null);
    }
  };

  const hasBaskets = subscriptions.length > 0 || flexiblePlans.length > 0;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur-md sticky top-0 z-10">
          <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium">Food Baskets</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <main className="p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Section */}
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">NestBaskets</h1>
              <p className="mt-1 text-muted-foreground">
                Subscribe to curated food plans or save toward custom grocery goals automatically.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-xs" asChild>
                <Link href="/nestbaskets/baskets/new">
                  <Plus className="size-4 mr-2" />
                  Create Custom Basket
                </Link>
              </Button>
            </div>
          </section>

          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Card 1: Active Plans */}
            <Card className="transition-all hover:shadow-md border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Plans</CardTitle>
                <ShoppingBag className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {subscriptions.length + flexiblePlans.length}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Active subscriptions & savings goals
                </p>
              </CardContent>
            </Card>

            {/* Card 2: Total Saved */}
            <Card className="transition-all hover:shadow-md border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
                <TrendingUp className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₦{totalSavedFlexible.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Saved toward custom grocery goals
                </p>
              </CardContent>
            </Card>

            {/* Card 3: Scheduled Commitments */}
            <Card className="transition-all hover:shadow-md border border-border/60">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Scheduled Commitments</CardTitle>
                <RefreshCw className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ₦{totalMonthlyCommitment.toLocaleString()}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                  Total active monthly commitments
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-border/80 pb-1">
            <div className="flex gap-6 flex-wrap">
              <button
                onClick={() => setActiveTab("plans")}
                className={`pb-3 font-semibold text-sm transition-all relative ${
                  activeTab === "plans"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Predefined Bundles
              </button>
              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-2 ${
                  activeTab === "subscriptions"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                My Subscriptions
                {subscriptions.length > 0 && (
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold size-5 rounded-full flex items-center justify-center p-0 text-[10px]">
                    {subscriptions.length}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab("flexible")}
                className={`pb-3 font-semibold text-sm transition-all relative flex items-center gap-2 ${
                  activeTab === "flexible"
                    ? "text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Savings Goals
                {flexiblePlans.length > 0 && (
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground font-bold size-5 rounded-full flex items-center justify-center p-0 text-[10px]">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="overflow-hidden border border-border/40">
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
                <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center bg-card">
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-4 text-muted-foreground">
                    <ShoppingBag className="size-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-foreground">No Curated Baskets</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Predefined plans are not loaded yet or are temporarily unavailable.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {predefinedPlans.map((plan: any) => (
                    <Card key={plan.id} className="overflow-hidden border border-border/60 hover:border-primary/40 hover:shadow-md transition-all duration-300 bg-card group flex flex-col justify-between pt-0">
                      <div>
                        {/* Plan Header Image */}
                        <div className="relative h-44 w-full overflow-hidden bg-muted rounded-t-xl">
                          {plan.imageUrl ? (
                            <img
                              src={plan.imageUrl}
                              alt={plan.name}
                              className="h-full w-full object-cover object-left group-hover:scale-105 transition-transform duration-500 rounded-t-xl"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5 text-primary rounded-t-xl">
                              <ShoppingBag className="size-12" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/60 font-bold text-xs text-primary shadow-sm">
                            ₦{plan.price.toLocaleString()} / {plan.frequency}
                          </div>
                        </div>

                        <CardHeader className="space-y-1 p-5 pb-3">
                          <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors text-foreground">{toTitleCase(plan.name)}</CardTitle>
                          <CardDescription className="text-sm line-clamp-2 min-h-10 text-muted-foreground">{plan.description}</CardDescription>
                        </CardHeader>

                        {/* Plan Items */}
                        <CardContent className="px-5 py-2">
                          <Separator className="mb-3 border-border/40" />
                          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Basket Includes:</p>
                          <ul className="space-y-1.5 text-sm text-foreground/80">
                            {plan.items?.slice(0, 3).map((item: any) => (
                              <li key={item.id} className="flex justify-between items-center bg-muted/30 px-2.5 py-1.5 rounded-lg border border-border/20">
                                <span className="font-medium truncate mr-2">
                                  {item.foodItem.name} {item.foodItem.brand ? `(${item.foodItem.brand})` : ""}
                                </span>
                                <span className="text-primary font-bold shrink-0 bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10">
                                  × {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {plan.items?.length > 3 && (
                            <div className="mt-2.5 text-center">
                              <span className="text-xs font-bold text-muted-foreground/90 bg-muted/60 border border-border/30 px-2.5 py-0.5 rounded-full inline-block">
                                + {plan.items.length - 3} more item{(plan.items.length - 3) > 1 ? "s" : ""}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </div>

                      <CardFooter className="p-5 pt-3 mt-auto flex gap-3">
                        <Button 
                          variant="outline"
                          className="flex-1 text-foreground border-border hover:bg-muted font-semibold transition-colors"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setIsDetailsOpen(true);
                          }}
                        >
                          Details
                        </Button>
                        <Button 
                          className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-sm transition-all duration-200"
                          asChild
                        >
                          <Link href={`/nestbaskets/baskets/new?predefinedId=${plan.id}`}>
                            Subscribe
                            <ArrowRight className="size-4 ml-1.5" />
                          </Link>
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
            <div className="space-y-6 animate-in fade-in duration-300">
              {subsLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2].map((i) => (
                      <Card key={i} className="p-5 space-y-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </Card>
                    ))}
                  </div>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center bg-card">
                  <div className="size-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 text-primary">
                    <ShoppingBag className="size-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-foreground">No Subscriptions Yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    You haven&apos;t subscribed to any regular food plans yet. Build a custom groceries loop from farm to table.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setActiveTab("plans")} className="font-semibold text-foreground border-border hover:bg-muted transition-colors">
                      Browse Bundles
                    </Button>
                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold" asChild>
                      <Link href="/nestbaskets/baskets/new">
                        Create Custom Basket
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {subscriptions.map((sub: any) => {
                    const nextDelivery = new Date(sub.nextDeliveryDate);
                    const isPaused = sub.status === "paused";
                    
                    return (
                      <Card key={sub.id} className="border border-border/60 bg-card overflow-hidden hover:border-primary/30 transition-all duration-300 flex flex-col justify-between shadow-sm">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-base font-bold text-foreground">{sub.title}</CardTitle>
                              <CardDescription className="text-xs flex items-center gap-1.5 text-muted-foreground">
                                <Calendar className="size-3.5" />
                                Every {sub.frequency} • ₦{sub.totalAmount.toLocaleString()}
                              </CardDescription>
                            </div>
                            <Badge 
                              className={`font-semibold text-xs ${
                                isPaused 
                                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100" 
                                  : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                              }`}
                            >
                              {sub.status.toUpperCase()}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent className="p-5 py-3 space-y-3 bg-muted/20 border-y border-border/40">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                              <Clock className="size-4" />
                              <span>Next Delivery:</span>
                            </div>
                            <span className="font-semibold text-foreground">
                              {nextDelivery.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground font-medium">
                              <CheckCircle2 className="size-4 text-primary" />
                              <span>Shipping Address:</span>
                            </div>
                            <span className="font-medium text-foreground truncate max-w-[200px]">
                              {sub.deliveryProfile?.address || "Default Address"}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 flex gap-3 bg-card mt-auto justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={pausingId === sub.id}
                            onClick={() => handlePauseResume(sub.id, sub.status)}
                            className="text-foreground border-border hover:bg-muted font-semibold transition-colors"
                          >
                            {pausingId === sub.id ? (
                              <RefreshCw className="size-3.5 mr-1.5 animate-spin" />
                            ) : isPaused ? (
                              <Play className="size-3.5 mr-1.5 fill-current" />
                            ) : (
                              <Pause className="size-3.5 mr-1.5 fill-current" />
                            )}
                            {isPaused ? "Resume" : "Pause"}
                          </Button>
                          <Button 
                            size="sm"
                            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
                            asChild
                          >
                            <Link href={`/nestbaskets/baskets/subscription/${sub.id}`}>
                              Manage
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVINGS GOALS */}
          {activeTab === "flexible" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {flexLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2].map((i) => (
                      <Card key={i} className="p-5 space-y-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </Card>
                    ))}
                  </div>
                </div>
              ) : flexiblePlans.length === 0 ? (
                <div className="flex flex-col items-center justify-center border border-dashed rounded-2xl p-12 text-center bg-card">
                  <div className="size-16 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center mb-4 text-primary">
                    <TrendingUp className="size-7" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 text-foreground">No Savings Goals Yet</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    You haven&apos;t set up any dynamic savings goals yet. Create custom ingredient baskets and fund them at your convenience.
                  </p>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setActiveTab("plans")} className="font-semibold text-foreground border-border hover:bg-muted transition-colors">
                      Browse Bundles
                    </Button>
                    <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold" asChild>
                      <Link href="/nestbaskets/baskets/new">
                        Create Custom Basket
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {flexiblePlans.map((plan: any) => {
                    const progress = plan.progress || 0;
                    const isFullyPaid = plan.isPaid;
                    const isPendingSelection = plan.status === "pending_selection";
                    const autoPay = plan.autoPay;

                    return (
                      <Card key={plan.id} className="border border-border/60 bg-card overflow-hidden hover:border-secondary/30 transition-all duration-300 flex flex-col justify-between shadow-sm">
                        <CardHeader className="p-5 pb-3">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <CardTitle className="text-base font-bold text-foreground">{plan.title}</CardTitle>
                              <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <TrendingUp className="size-3.5 text-secondary" />
                                Target Goal: ₦{plan.totalPrice.toLocaleString()}
                              </CardDescription>
                            </div>
                            <Badge 
                              className={`font-semibold text-xs ${
                                isFullyPaid
                                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100"
                                  : isPendingSelection
                                  ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 border border-amber-200"
                                  : "bg-secondary/10 text-secondary hover:bg-secondary/10 border border-secondary/20"
                              }`}
                            >
                              {isFullyPaid ? "FULLY PAID" : isPendingSelection ? "PENDING SELECTION" : `${progress}% SAVED`}
                            </Badge>
                          </div>
                        </CardHeader>

                        {/* Progress bar and details */}
                        <CardContent className="p-5 py-4 space-y-4 bg-muted/20 border-y border-border/40">
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="text-foreground">₦{plan.paidAmount.toLocaleString()} saved</span>
                            </div>
                            {/* Custom beautiful gold/bronze progress bar */}
                            <div className="w-full bg-muted border border-border/40 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ease-out ${
                                  isPendingSelection ? "bg-amber-500" : "bg-primary"
                                }`} 
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground font-medium">Auto-Savings:</span>
                            <span className={`font-semibold ${autoPay?.enabled ? "text-primary" : "text-muted-foreground"}`}>
                              {autoPay?.enabled ? `Active (${autoPay.frequency})` : "Disabled"}
                            </span>
                          </div>
                        </CardContent>

                        <CardFooter className="p-4 flex gap-3 bg-card mt-auto justify-end">
                          <Button 
                            size="sm"
                            className={`font-semibold ${
                              isPendingSelection
                                ? "bg-amber-600 hover:bg-amber-700 text-white"
                                : "bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                            }`}
                            asChild
                          >
                            <Link href={`/nestbaskets/baskets/flexible/${plan.id}`}>
                              {isPendingSelection ? "Resolve Expired Goal" : "Manage Goal"}
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Responsive Predefined Plan Details Viewer */}
        {selectedPlan && (
          !isMobile ? (
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent className="sm:max-w-[480px] max-h-[85vh] p-6 gap-5 bg-card border border-border/60 shadow-xl rounded-2xl flex flex-col justify-between">
                <div>
                  <DialogHeader className="p-0 mb-4">
                    <DialogTitle className="text-xl font-bold text-foreground">Basket Details</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      View the full contents and specifications of this curated food basket.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="overflow-y-auto max-h-[50vh] pr-1 pb-2 custom-scrollbar">
                    {renderPlanDetails(selectedPlan)}
                  </div>
                </div>

                <DialogFooter className="p-0 pt-3 flex sm:justify-between items-center w-full gap-3 mt-1 shrink-0 border-t border-border/20">
                  <DialogClose asChild>
                    <Button variant="outline" className="flex-1 font-semibold text-foreground border-border hover:bg-muted transition-colors">
                      Close
                    </Button>
                  </DialogClose>
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold shadow-md shadow-primary/15 hover:shadow-primary/20 transition-all duration-200"
                    asChild
                  >
                    <Link href={`/nestbaskets/baskets/new?predefinedId=${selectedPlan?.id}`}>
                      Subscribe Now
                      <ArrowRight className="size-4 ml-1.5" />
                    </Link>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Drawer open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DrawerContent className="p-6 bg-card border-t border-border/60 rounded-t-2xl max-h-[85vh] flex flex-col justify-between">
                <DrawerHeader className="p-0 text-left mb-4 shrink-0">
                  <DrawerTitle className="text-lg font-bold text-foreground">Basket Details</DrawerTitle>
                  <DrawerDescription className="text-xs text-muted-foreground">
                    View the full contents and specifications of this curated food basket.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="flex-1 overflow-y-auto min-h-0 pb-4 pr-1 custom-scrollbar">
                  {renderPlanDetails(selectedPlan)}
                </div>

                <DrawerFooter className="p-0 pt-4 border-t border-border/40 flex flex-col gap-2 shrink-0">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-md transition-all py-3.5"
                    asChild
                  >
                    <Link href={`/nestbaskets/baskets/new?predefinedId=${selectedPlan?.id}`}>
                      Subscribe Now
                      <ArrowRight className="size-4 ml-1.5" />
                    </Link>
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="w-full font-semibold text-foreground border-border py-3.5">
                      Close
                    </Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          )
        )}
      </SidebarInset>
    </SidebarProvider>
  );
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
