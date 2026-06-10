"use client";

import * as React from "react";
import Link from "next/link";
import { usePublicTracking } from "@/hooks/use-nesttrails";
import { Button } from "@/components/ui/button";
import { DeliveryStatus } from "@/types/nesttrails";
import {
  Truck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  User,
  MapPin,
  Loader2,
  Copy,
  Check,
  Package,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

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

interface PublicTrackingPageProps {
  params: Promise<{ trackingCode: string }>;
}

export default function PublicTrackingPage({ params }: PublicTrackingPageProps) {
  const resolvedParams = React.use(params);
  const trackingCode = resolvedParams.trackingCode;

  const { trackingData, isLoading, error } = usePublicTracking(trackingCode);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (trackingCode) {
      navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success("Tracking code copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const steps = [
    { key: "scheduled", label: "Scheduled", desc: "Delivery reservation created" },
    { key: "dispatched", label: "Dispatched", desc: "Rider has been assigned" },
    { key: "in_transit", label: "In Transit", desc: "Package is on the way" },
    { key: "delivered", label: "Delivered", desc: "Package safely dropped off" },
  ] as const;

  const currentStep = trackingData ? STATUS_CONFIG[trackingData.status]?.stepIndex || 0 : 0;
  const isFailed = trackingData ? trackingData.status === "failed" : false;

  return (
    <div className="min-h-screen bg-slate-50/60 dark:bg-zinc-950 flex flex-col select-none">
      {/* Public Header */}
      <header className="border-b border-muted bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/d_icon.png" alt="GrowNest Logo" width={28} height={28} className="rounded-lg" />
            <span className="font-black text-sm tracking-tight">GrowNest.Africa</span>
          </Link>
          <Link href="/deliveries">
            <Button variant="ghost" size="sm" className="rounded-full text-xs font-bold gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Track Section */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground font-semibold animate-pulse">Locating shipment route...</p>
          </div>
        ) : error || !trackingData ? (
          <div className="text-center space-y-4 max-w-md mx-auto">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto text-rose-500">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-black text-foreground">Tracking code not found</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We couldn&apos;t load details for tracking code <strong className="font-mono text-foreground">{trackingCode}</strong>. 
              Please verify the characters or contact your shipper.
            </p>
            <div className="pt-2">
              <Link href="/deliveries">
                <Button className="rounded-full px-6 text-xs font-bold">Return to Deliveries</Button>
              </Link>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status Summary Banner */}
            <div className="bg-linear-to-br from-primary/95 to-primary/75 text-primary-foreground rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">NestTrails Live Track</span>
                  <h2 className="text-lg md:text-xl font-black leading-tight">{trackingData.title}</h2>
                  <p className="text-[11px] text-primary-foreground/80 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Scheduled for {new Date(trackingData.deliveryDate).toLocaleDateString("en-NG", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 bg-white/10 p-2 rounded-2xl backdrop-blur-md">
                  <span className="text-[10px] font-mono font-bold tracking-wider mr-1 text-white">{trackingData.trackingCode}</span>
                  <button onClick={handleCopy} className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Split */}
            <div className="grid md:grid-cols-5 gap-6">
              {/* Timeline Card */}
              <Card className="rounded-3xl border border-muted shadow-xs md:col-span-3 py-0">
                <CardContent className="p-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-6">Delivery Progress</h3>
                  
                  {/* Timeline logic */}
                  <div className="relative space-y-6">
                    {/* Line */}
                    <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-muted rounded-full">
                      <div
                        className={cn("w-full bg-primary transition-all duration-500 rounded-full", isFailed ? "bg-rose-500" : "")}
                        style={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
                      />
                    </div>

                    {steps.map((step, idx) => {
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep && !isFailed;
                      const isFinalFailed = step.key === "delivered" && isFailed;

                      return (
                        <div key={step.key} className="relative flex gap-4 items-start pl-12 group">
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

                          <div className="space-y-0.5">
                            <h4 className={cn("text-sm font-black uppercase tracking-wider transition-colors", isCompleted || isActive ? "text-foreground" : isFinalFailed ? "text-rose-500" : "text-muted-foreground/50")}>
                              {isFinalFailed ? "Delivery Failed" : step.label}
                            </h4>
                            <p className="text-xs font-medium text-muted-foreground/80 leading-normal">
                              {isFinalFailed
                                ? "Delivery attempt unsuccessful. Please check details."
                                : step.key === "dispatched" && isActive && trackingData.riderName
                                ? `Rider ${trackingData.riderName} is preparing package`
                                : step.desc}
                            </p>
                            {step.key === "dispatched" && (isActive || isCompleted) && trackingData.riderName && (
                              <div className="flex gap-2 pt-2">
                                <a href={`tel:${trackingData.riderPhone}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-black uppercase tracking-wider hover:bg-emerald-500/15">
                                  <Phone className="w-3 h-3" /> Call Rider
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Info Cards */}
              <div className="md:col-span-2 space-y-6">
                {/* Rider Details */}
                {trackingData.riderName && (
                  <Card className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 shadow-xs overflow-hidden py-0">
                    <CardContent className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest block">Assigned Courier</span>
                        <p className="font-black text-sm text-foreground truncate mt-0.5">{trackingData.riderName}</p>
                        <a href={`tel:${trackingData.riderPhone}`} className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> Call {trackingData.riderPhone}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Destination */}
                <Card className="rounded-3xl border border-muted shadow-xs py-0">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-primary" /> Destination Address
                    </h3>
                    {trackingData.address ? (
                      <div className="text-xs space-y-1 font-semibold text-muted-foreground leading-relaxed">
                        <p className="font-bold text-foreground text-sm">{trackingData.address.fullName}</p>
                        <p>{trackingData.address.address}, {trackingData.address.city}, {trackingData.address.state}</p>
                        <p className="text-[10px] text-muted-foreground/70">Phone: {trackingData.address.phone}</p>
                        {trackingData.address.landmark && <p className="text-[10px] bg-muted/60 p-1.5 rounded-lg text-foreground/80 mt-1">Landmark: {trackingData.address.landmark}</p>}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No address stored</p>
                    )}
                  </CardContent>
                </Card>

                {/* Cargo Checklist */}
                <Card className="rounded-3xl border border-muted shadow-xs py-0">
                  <CardContent className="p-5 space-y-3">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-primary" /> Cargo Snapshot
                    </h3>
                    <div className="divide-y divide-muted/30 max-h-[180px] overflow-y-auto pr-1">
                      {trackingData.items.map((i) => (
                        <div key={i.id} className="flex justify-between items-center py-2 text-xs font-semibold">
                          <span className="text-foreground">{i.foodItem.name}</span>
                          <span className="text-muted-foreground font-black text-[10px] bg-muted px-1.5 py-0.5 rounded-md">x{i.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer support notice */}
      <footer className="border-t border-muted bg-background py-6 mt-12 text-center text-xs text-muted-foreground">
        <div className="max-w-3xl mx-auto px-4">
          <p>GrowNest NestTrails Delivery System • Having troubles? Reach support@grownest.africa</p>
        </div>
      </footer>
    </div>
  );
}
