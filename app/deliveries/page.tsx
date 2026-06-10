"use client";

import * as React from "react";
import Image from "next/image";
import { AppSidebar } from "@/components/app-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMyDeliveries, usePublicTracking } from "@/hooks/use-nesttrails";
import { DeliveryStatus, UserDelivery } from "@/types/nesttrails";
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  Phone,
  User,
  MapPin,
  Loader2,
  Copy,
  Check,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<
  DeliveryStatus,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    stepIndex: number;
  }
> = {
  scheduled: {
    label: "Scheduled",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    icon: Calendar,
    stepIndex: 0,
  },
  dispatched: {
    label: "Dispatched",
    color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
    icon: Package,
    stepIndex: 1,
  },
  in_transit: {
    label: "In Transit",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    icon: Truck,
    stepIndex: 2,
  },
  delivered: {
    label: "Delivered",
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    icon: CheckCircle2,
    stepIndex: 3,
  },
  failed: {
    label: "Failed",
    color: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    icon: AlertTriangle,
    stepIndex: 3,
  },
};

export default function DeliveriesPage() {
  const isMobile = useIsMobile();
  const { deliveriesData, isLoading } = useMyDeliveries();
  const [activeTab, setActiveTab] = React.useState<"today" | "upcoming" | "past" | "search">("today");
  const [selectedTrackingCode, setSelectedTrackingCode] = React.useState<string | null>(null);
  const [searchCode, setSearchCode] = React.useState("");
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  // For Search tab tracking details
  const { trackingData, isLoading: isTrackingLoading, error: trackingError } = usePublicTracking(
    activeTab === "search" && searchCode.trim().length >= 6 ? searchCode.trim() : null
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Tracking code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) {
      toast.error("Please enter a tracking code");
      return;
    }
  };

  const summary = deliveriesData?.summary || { total: 0, upcoming: 0, today: 0, past: 0 };
  const todayList = deliveriesData?.today || [];
  const upcomingList = deliveriesData?.upcoming || [];
  const pastList = deliveriesData?.past || [];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Deliveries</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 select-none">
          {/* Header Section */}
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">NestTrails</h1>
              <p className="mt-1 text-muted-foreground">
                Real-time monitoring of your custom food plans, basket subscriptions, and one-off deliveries.
              </p>
            </div>
          </section>

          {/* Metrics Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Today's Runs", value: summary.today, desc: "Active deliveries today", icon: Truck },
              { label: "Upcoming Schedules", value: summary.upcoming, desc: "Scheduled future deliveries", icon: Calendar },
              { label: "Past Shipments", value: summary.past, desc: "Completed and failed logs", icon: Clock },
              { label: "Total Runs", value: summary.total, desc: "All delivery history items", icon: CheckCircle2 },
            ].map((stat, idx) => {
              const IconComp = stat.icon;
              return (
                <Card key={idx} className="transition-all hover:shadow-md border border-border/60">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <IconComp className="size-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {isLoading ? "..." : stat.value}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 font-medium">
                      {stat.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-muted shrink-0 gap-1 overflow-x-auto pb-px">
            {[
              { id: "today", label: "Today's Deliveries", count: todayList.length },
              { id: "upcoming", label: "Upcoming Schedules", count: upcomingList.length },
              { id: "past", label: "Past Shipments", count: pastList.length },
              { id: "search", label: "Track with Code", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "relative pb-3 pt-1 px-4 font-bold text-xs tracking-wider uppercase border-b-2 text-center transition-all cursor-pointer whitespace-nowrap",
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
                {tab.count !== null && !isLoading && (
                  <Badge variant="secondary" className="ml-2 font-black rounded-full text-[9px] px-1.5 py-0">
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Main Tab Panels */}
          <div className="min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground font-medium animate-pulse">Retrieving delivery schedule...</p>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {activeTab === "today" && (
                  <TabPanel key="today">
                    {todayList.length === 0 ? (
                      <EmptyState illustration="/undraw_delivery-truck_mjui.svg" title="No deliveries scheduled for today" desc="When deliveries are dispatched today, they will show up here." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {todayList.map((d) => (
                          <DeliveryCard key={d.id} delivery={d} onTrack={() => setSelectedTrackingCode(d.trackingCode)} onCopy={() => handleCopyCode(d.trackingCode)} copied={copiedCode === d.trackingCode} />
                        ))}
                      </div>
                    )}
                  </TabPanel>
                )}

                {activeTab === "upcoming" && (
                  <TabPanel key="upcoming">
                    {upcomingList.length === 0 ? (
                      <EmptyState illustration="/undraw_deliveries_qutl.svg" title="No upcoming deliveries scheduled" desc="Explore NestBaskets to schedule future subscriptions or plans." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {upcomingList.map((d) => (
                          <DeliveryCard key={d.id} delivery={d} onTrack={() => setSelectedTrackingCode(d.trackingCode)} onCopy={() => handleCopyCode(d.trackingCode)} copied={copiedCode === d.trackingCode} />
                        ))}
                      </div>
                    )}
                  </TabPanel>
                )}

                {activeTab === "past" && (
                  <TabPanel key="past">
                    {pastList.length === 0 ? (
                      <EmptyState illustration="/undraw_order-delivered_puaw.svg" title="No delivery history found" desc="Your completed and failed deliveries will accumulate here." />
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {pastList.map((d) => (
                          <DeliveryCard key={d.id} delivery={d} onTrack={() => setSelectedTrackingCode(d.trackingCode)} onCopy={() => handleCopyCode(d.trackingCode)} copied={copiedCode === d.trackingCode} />
                        ))}
                      </div>
                    )}
                  </TabPanel>
                )}

                {activeTab === "search" && (
                  <TabPanel key="search" className="max-w-2xl mx-auto space-y-6">
                    {/* Live Tracking Result */}
                    {searchCode.trim().length >= 6 ? (
                      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
                        {/* Search Input on Result view */}
                        <div className="max-w-md mx-auto">
                          <form onSubmit={handleSearchSubmit} className="flex gap-3">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter tracking code (e.g. DEL-123456)"
                                className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm font-semibold transition-all"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                              />
                            </div>
                            <Button 
                              type="submit" 
                              className="h-11 rounded-xl px-5 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg"
                            >
                              Track
                            </Button>
                            {searchCode.trim().length > 0 && (
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSearchCode("")}
                                className="h-11 rounded-xl px-3 text-xs font-bold uppercase tracking-wider hover:bg-muted text-muted-foreground"
                              >
                                Clear
                              </Button>
                            )}
                          </form>
                        </div>

                        {isTrackingLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-2">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Locating shipment details...</p>
                          </div>
                        ) : trackingError || !trackingData ? (
                          <div className="rounded-2xl border border-dashed border-rose-500/20 bg-rose-500/5 p-6 text-center space-y-2 max-w-md mx-auto">
                            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
                            <h4 className="text-sm font-bold text-rose-700">Shipment not found</h4>
                            <p className="text-xs text-muted-foreground">We couldn&apos;t find any delivery details matching code &quot;{searchCode}&quot;.</p>
                          </div>
                        ) : (
                          <Card className="rounded-3xl overflow-hidden border border-muted shadow-md py-0">
                            <div className="bg-primary/5 p-5 border-b border-muted flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-primary">Live Tracking Status</span>
                                <h3 className="text-lg font-black text-foreground mt-0.5">{trackingData.title}</h3>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider border pointer-events-none", STATUS_CONFIG[trackingData.status]?.color)}>
                                  {STATUS_CONFIG[trackingData.status]?.label}
                                </Badge>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCopyCode(trackingData.trackingCode)}>
                                  {copiedCode === trackingData.trackingCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </Button>
                              </div>
                            </div>
                            <CardContent className="p-5 space-y-6">
                              {/* Inline Tracking Timeline */}
                              <TrackingTimeline status={trackingData.status} riderName={null} riderPhone={null} />
                              <div className="border-t border-muted/55 pt-5 grid sm:grid-cols-2 gap-5">
                                {/* Destination address snapshot */}
                                <div className="space-y-2">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4 text-primary" /> Delivery Destination
                                  </h4>
                                  {trackingData.address ? (
                                    <div className="text-xs space-y-1 font-semibold leading-relaxed">
                                      <p className="font-bold text-foreground text-sm">{trackingData.address.fullName}</p>
                                      <p className="text-muted-foreground">{trackingData.address.address}, {trackingData.address.city}, {trackingData.address.state}</p>
                                      <p className="text-muted-foreground/85 text-xs">Contact: {trackingData.address.phone}</p>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No address details stored</p>
                                  )}
                                </div>

                                {/* Items checklist */}
                                <div className="space-y-2">
                                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-primary" /> Cargo Snapshot
                                  </h4>
                                  <div className="divide-y divide-muted/30 max-h-[160px] overflow-y-auto pr-1">
                                    {trackingData.items.map((i) => (
                                      <div key={i.id} className="flex justify-between items-center py-2 text-xs">
                                        <span className="font-semibold text-foreground">{i.foodItem.name}</span>
                                        <span className="font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md text-[10px]">x{i.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      /* Initial State Centered Container */
                      <div className="flex flex-col items-center justify-center min-h-[360px] md:min-h-[400px] py-4 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
                        {/* Elegant background glow behind SVG to pop the gold elements */}
                        <div className="absolute w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10 top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        
                        {/* Delivery Location Illustration */}
                        <div className="relative w-52 h-32 md:w-64 md:h-40 hover:scale-[1.02] transition-transform duration-500 shrink-0">
                          <Image
                            src="/undraw_delivery-location_um5t.svg?v=2"
                            alt="Track Delivery Location"
                            fill
                            className="object-contain"
                            priority
                          />
                        </div>

                        {/* Title and Description */}
                        <div className="space-y-1.5 max-w-sm">
                          <h3 className="font-black text-base md:text-lg text-foreground tracking-tight">Awaiting Tracking Code</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Enter your shipment tracking code below or select one of your active shipments to monitor your progress in real-time.
                          </p>
                        </div>

                        {/* Centered Compact Form - Same width (max-w-sm) as the text above */}
                        <div className="w-full max-w-sm space-y-4">
                          <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                placeholder="Enter tracking code (e.g. DEL-123456)"
                                className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus-visible:ring-1 focus-visible:ring-primary text-sm font-semibold transition-all"
                                value={searchCode}
                                onChange={(e) => setSearchCode(e.target.value)}
                              />
                            </div>
                            <Button 
                              type="submit" 
                              className="h-11 rounded-xl px-5 text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 shrink-0"
                            >
                              Track
                            </Button>
                          </form>

                          {/* Quick suggestions from user's actual deliveries */}
                          {(() => {
                            const allUserDeliveries = [...todayList, ...upcomingList, ...pastList];
                            if (allUserDeliveries.length === 0) return null;
                            return (
                              <div className="flex flex-col items-center gap-2 pt-3 border-t border-muted/30 w-full animate-in fade-in duration-300">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
                                  Quick Track from Your Shipments:
                                </span>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                  {allUserDeliveries.slice(0, 3).map((d) => (
                                    <button
                                      key={d.trackingCode}
                                      type="button"
                                      onClick={() => setSearchCode(d.trackingCode)}
                                      className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-muted/60 hover:bg-primary/10 hover:text-primary transition-all cursor-pointer border border-transparent hover:border-primary/20"
                                    >
                                      {d.trackingCode}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </TabPanel>
                )}
              </AnimatePresence>
            )}
          </div>
        </main>
      </SidebarInset>

      {/* Global Interactive Tracking Drawer / Dialog */}
      <TrackingDetailModal
        open={!!selectedTrackingCode}
        onOpenChange={(open) => {
          if (!open) setSelectedTrackingCode(null);
        }}
        trackingCode={selectedTrackingCode}
        isMobile={isMobile}
      />
    </SidebarProvider>
  );
}

/* Tab Animation Wrapper */
function TabPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Empty State Component */
function EmptyState({ title, desc, illustration }: { title: string; desc: string; illustration: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[360px] md:min-h-[400px] py-8 px-6 text-center rounded-3xl border-2 border-dashed border-muted-foreground/20 bg-muted/5 bg-clip-padding relative overflow-hidden">
      {/* Golden background glow to pop the illustration */}
      <div className="absolute w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10" />
      
      <div className="relative w-52 h-32 md:w-64 md:h-40 mb-4 hover:scale-105 transition-transform duration-300">
        <Image
          src={`${illustration}?v=2`}
          alt={title}
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-1.5 max-w-sm">
        <h3 className="font-black text-base md:text-lg text-foreground tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* Delivery Card Component */
function DeliveryCard({
  delivery,
  onTrack,
  onCopy,
  copied,
}: {
  delivery: UserDelivery;
  onTrack: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const statusLabel = STATUS_CONFIG[delivery.status]?.label || delivery.status;

  return (
    <Card className="group rounded-3xl overflow-hidden border border-muted bg-card hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full py-0">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              {delivery.isRecurring ? "Recurring Plan" : "One-Time Order"}
            </span>
            <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {delivery.title}
            </h3>
          </div>
          <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border shrink-0 pointer-events-none", STATUS_CONFIG[delivery.status]?.color)}>
            {statusLabel}
          </Badge>
        </div>

        {/* Date and Tracking Code */}
        <div className="grid grid-cols-2 gap-3 bg-muted/30 p-2.5 rounded-2xl text-xs font-bold text-muted-foreground">
          <div className="space-y-0.5">
            <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60">Delivery Date</span>
            <span className="text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary/70 shrink-0" />
              {new Date(delivery.deliveryDate).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="space-y-0.5 relative">
            <span className="block text-[9px] uppercase tracking-widest text-muted-foreground/60">Tracking Code</span>
            <div className="flex items-center gap-1.5">
              <span className="text-foreground font-mono font-bold">{delivery.trackingCode}</span>
              <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-1 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Cargo Summary */}
        <div className="space-y-1">
          <span className="block text-[9px] uppercase font-bold tracking-widest text-muted-foreground/60">Items Snapshot</span>
          <div className="flex flex-wrap gap-1.5">
            {delivery.items.slice(0, 3).map((item, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs font-semibold border-muted/80 rounded-lg py-0.5 px-2 bg-muted/40 dark:bg-zinc-900/40 text-muted-foreground hover:bg-muted/40 dark:hover:bg-zinc-900/60 transition-colors">
                {item.name} <strong className="text-foreground ml-1">x{item.quantity}</strong>
              </Badge>
            ))}
            {delivery.items.length > 3 && (
              <Badge variant="outline" className="text-xs font-black border-primary/20 rounded-lg py-0.5 px-2 bg-primary/5 text-primary hover:bg-primary/5">
                +{delivery.items.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Rider (if assigned) */}
        {(delivery.status === "dispatched" || delivery.status === "in_transit") && delivery.riderName && (
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-2 text-sm">
            <div className="w-8.5 h-8.5 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-xs truncate">Rider: {delivery.riderName}</p>
              <a href={`tel:${delivery.riderPhone}`} className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3" /> Call Rider ({delivery.riderPhone})
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Card Actions */}
      <div className="border-t border-muted/50 p-3 bg-muted/15 flex justify-end">
        <Button size="sm" variant="default" className="w-full sm:w-auto rounded-full font-bold text-xs gap-1 cursor-pointer shadow-sm" onClick={onTrack}>
          Track shipment
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}

/* Interactive Tracking Timeline component */
function TrackingTimeline({
  status,
  riderName,
  riderPhone,
}: {
  status: DeliveryStatus;
  riderName: string | null;
  riderPhone: string | null;
}) {
  const steps = [
    { key: "scheduled", label: "Scheduled", desc: "Delivery reservation created" },
    { key: "dispatched", label: "Dispatched", desc: "Rider has been assigned" },
    { key: "in_transit", label: "In Transit", desc: "Package is on the way" },
    { key: "delivered", label: "Delivered", desc: "Package safely dropped off" },
  ] as const;

  const currentConfig = STATUS_CONFIG[status];
  const currentStep = currentConfig ? currentConfig.stepIndex : 0;
  const isFailed = status === "failed";

  return (
    <div className="py-4 select-none">
      <div className="relative space-y-6">
        {/* Timeline vertical bar */}
        <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-muted rounded-full">
          <div
            className={cn(
              "w-full bg-primary transition-all duration-500 rounded-full",
              isFailed ? "bg-rose-500" : ""
            )}
            style={{
              height: `${(currentStep / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep && !isFailed;
          const isFinalFailed = step.key === "delivered" && isFailed;

          return (
            <div key={step.key} className="relative flex gap-4 items-start pl-12 group">
              {/* Timeline Indicator Dot */}
              <div
                className={cn(
                  "absolute left-3 top-1 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-background border-2 transition-all duration-300 z-10 pointer-events-none",
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isActive
                    ? "bg-background border-primary text-primary scale-110 shadow-xs"
                    : isFinalFailed
                    ? "bg-rose-500 border-rose-500 text-white animate-pulse"
                    : "bg-muted border-muted text-muted-foreground/60"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" />
                ) : isFinalFailed ? (
                  <AlertTriangle className="w-3 h-3" />
                ) : (
                  <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-primary" : "bg-muted-foreground/40")} />
                )}
              </div>

              {/* Step Info */}
              <div className="space-y-0.5">
                <h4
                  className={cn(
                    "text-sm font-black uppercase tracking-wider transition-colors",
                    isCompleted || isActive
                      ? "text-foreground"
                      : isFinalFailed
                      ? "text-rose-500"
                      : "text-muted-foreground/50"
                  )}
                >
                  {isFinalFailed ? "Delivery Failed" : step.label}
                </h4>
                <p className="text-xs font-medium text-muted-foreground/80 leading-normal">
                  {isFinalFailed
                    ? "Delivery attempt was unsuccessful. Please check with support."
                    : step.key === "dispatched" && isActive && riderName
                    ? `Assigned to: ${riderName}`
                    : step.desc}
                </p>
                {step.key === "dispatched" && (isActive || isCompleted) && riderName && (
                  <div className="flex gap-2.5 pt-1.5">
                    <a href={`tel:${riderPhone}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider hover:bg-emerald-500/15">
                      <Phone className="w-3 h-3" /> Call Rider
                    </a>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Modal wrapper that loads public details */
function TrackingDetailModal({
  open,
  onOpenChange,
  trackingCode,
  isMobile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingCode: string | null;
  isMobile: boolean;
}) {
  const { trackingData, isLoading, error } = usePublicTracking(trackingCode);
  const [copied, setCopied] = React.useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setCopied(false);
    }
    onOpenChange(newOpen);
  };

  const handleCopy = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success("Tracking code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground font-medium animate-pulse">Locating package routing info...</p>
        </div>
      );
    }

    if (error || !trackingData) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 p-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
          <h4 className="text-sm font-bold text-foreground">Failed to resolve tracking details</h4>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
            Please check the tracking code or try again later. If the issue persists, contact GrowNest support.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 py-2 select-none">
        {/* Header Summary */}
        <div className="bg-muted/40 rounded-2xl p-4 flex items-center justify-between border border-muted">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Tracking Code</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-sm font-bold text-foreground">{trackingData.trackingCode}</span>
              <button onClick={handleCopy} className="p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-colors hover:bg-muted">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <Badge variant="outline" className={cn("rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider border pointer-events-none", STATUS_CONFIG[trackingData.status]?.color)}>
            {STATUS_CONFIG[trackingData.status]?.label}
          </Badge>
        </div>

        {/* Tracking timeline */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">Routing Steps</h4>
          <TrackingTimeline status={trackingData.status} riderName={trackingData.riderName || null} riderPhone={trackingData.riderPhone || null} />
        </div>

        {/* Destination Details */}
        <div className="space-y-3 pt-3 border-t border-muted/50">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Delivery Destination
          </h4>
          {trackingData.address ? (
            <div className="bg-muted/20 border border-muted/50 rounded-2xl p-3.5 text-xs font-semibold text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Receiver:</span>
                <span className="text-foreground">{trackingData.address.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span>Phone:</span>
                <span className="text-foreground font-mono">{trackingData.address.phone}</span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span>Address:</span>
                <span className="text-foreground text-right">{trackingData.address.address}, {trackingData.address.city}, {trackingData.address.state}</span>
              </div>
              {trackingData.address.landmark && (
                <div className="flex justify-between">
                  <span>Landmark:</span>
                  <span className="text-foreground text-right">{trackingData.address.landmark}</span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No address information available</p>
          )}
        </div>

        {/* Deliveries checklist */}
        <div className="space-y-3 pt-3 border-t border-muted/50">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-primary" /> Included Items
          </h4>
          <div className="divide-y divide-muted/30 border border-muted/50 rounded-2xl overflow-hidden bg-muted/20 max-h-[160px] overflow-y-auto">
            {trackingData.items.map((i) => (
              <div key={i.id} className="flex justify-between items-center px-4 py-2.5 text-xs font-semibold">
                <span className="text-foreground">{i.foodItem.name}</span>
                <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-lg text-[10px] font-bold">x{i.quantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Support */}
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/10 p-3 text-[11px] font-medium leading-relaxed text-amber-700/80 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>If you experience issues with your delivery scheduling, please contact our support team.</span>
        </div>
      </div>
    );
  };

  const title = trackingData ? trackingData.title : "Shipment Details";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="max-h-[92vh] px-4 pb-8 flex flex-col">
          <DrawerHeader className="mb-2 px-0 shrink-0 text-left">
            <DrawerTitle className="text-xl font-black">{title}</DrawerTitle>
            <DrawerDescription>Real-time delivery progress updates.</DrawerDescription>
          </DrawerHeader>
          <div className="px-1 py-1 flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden rounded-[2rem] sm:max-w-[460px] max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="pb-3 shrink-0">
          <DialogTitle className="text-2xl font-black">{title}</DialogTitle>
          <DialogDescription>Real-time delivery progress updates.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
