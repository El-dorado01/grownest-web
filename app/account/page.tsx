"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  BadgeCheck, 
  ShieldCheck, 
  ArrowRight, 
  Info, 
  Check,
  Loader2,
  ChevronRight,
  User,
  Building2,
  FileText,
  Lock,
  ExternalLink,
  Search
} from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { authApi } from "@/lib/auth-api"
import { cn } from "@/lib/utils"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { 
  Drawer, 
  DrawerContent, 
  DrawerClose, 
  DrawerDescription, 
  DrawerHeader, 
  DrawerTitle, 
  DrawerTrigger, 
  DrawerFooter 
} from "@/components/ui/drawer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { useIsMobile } from "@/hooks/use-mobile"

const TIER_FEATURES = [
  { label: "Daily Transaction Limit", values: ["₦50,000", "₦200,000", "₦1,000,000"] },
  { label: "Withdrawal Frequency", values: ["Weekly", "Daily", "Unlimited"] },
  { label: "Group Savings Access", values: ["Basic", "Standard", "Premium"] },
  { label: "Virtual Account", values: ["Yes", "Yes", "Yes"] },
  { label: "Interest Rate Bonus", values: ["No", "No", "Yes (2%)"] },
]

export default function AccountPage() {
  const { profile, mutate, isLoading: isProfileLoading } = useProfile()
  const currentTier = profile?.tier || 1
  const isMobile = useIsMobile()
  
  const [nin, setNin] = React.useState("")
  const [bvn, setBvn] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false)

  const getTierBadgeColor = (tier: number) => {
    switch (tier) {
      case 1: return "text-amber-700" // Bronze
      case 2: return "text-slate-400" // Silver
      case 3: return "text-yellow-500" // Gold
      default: return "text-muted-foreground"
    }
  }

  const handleUpgradeTier2 = async () => {
    if (nin.length < 11) {
      toast.error("Please enter a valid 11-digit NIN")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await authApi.upgradeTier2({ id: nin })
      if (res.data) {
        toast.success("Account upgraded to Tier 2!")
        await mutate()
        setNin("")
        setIsDrawerOpen(false)
      } else {
        toast.error(res.error || "Verification failed")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpgradeTier3 = async () => {
    if (bvn.length < 11) {
      toast.error("Please enter a valid 11-digit BVN")
      return
    }
    setIsSubmitting(true)
    try {
      const res = await authApi.upgradeTier3({ id: bvn })
      if (res.data) {
        toast.success("Account upgraded to Tier 3!")
        await mutate()
        setBvn("")
        setIsDrawerOpen(false)
      } else {
        toast.error(res.error || "Verification failed")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const UpgradeForm = () => (
    <div className="px-6 space-y-6 py-4">
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">
          {currentTier === 1 ? "National Identity Number (NIN)" : "Bank Verification Number (BVN)"}
        </label>
        <Input 
          value={currentTier === 1 ? nin : bvn}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').substring(0, 11)
            currentTier === 1 ? setNin(val) : setBvn(val)
          }}
          placeholder="00000000000"
          className="h-14 text-lg bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary/20"
          maxLength={11}
        />
        <p className="text-[10px] text-muted-foreground italic">
          * Your data is strictly used for verification with official databases only.
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 text-xs text-muted-foreground border border-primary/10">
        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
        <p>
          We use banking-grade encryption to ensure your details are protected. Verification usually takes less than 30 seconds.
        </p>
      </div>
    </div>
  )

  const UpgradeButton = () => (
    <Button 
      className="h-14 text-lg font-bold w-full"
      disabled={isSubmitting || (currentTier === 1 ? nin.length < 11 : bvn.length < 11)}
      onClick={currentTier === 1 ? handleUpgradeTier2 : handleUpgradeTier3}
    >
      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
      {isSubmitting ? "Verifying..." : "Verify & Upgrade"}
    </Button>
  )

  // Removed UpgradeTrigger to inline it directly for better ref handling with asChild


  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:inline-flex">
                <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:inline-flex" />
              <BreadcrumbItem>
                <BreadcrumbPage>Account Verification</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </DashboardHeader>
        
        <div className="flex flex-1 flex-col p-6 md:p-10 max-w-6xl mx-auto w-full gap-10">
          
          {isProfileLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              <p className="text-sm text-muted-foreground font-medium">Loading account details...</p>
            </div>
          ) : (
            <>
              {/* Profile Overview Section */}
              <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-background ring-2 ring-muted/50 relative shrink-0">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      <BadgeCheck className={cn("h-5 w-5", getTierBadgeColor(currentTier))} />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight truncate">{profile?.fullName || "User"}</h1>
                      <BadgeCheck className={cn("h-5 w-5 min-w-5 shrink-0", getTierBadgeColor(currentTier))} />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium truncate">{profile?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Status:</span>
                    <span className="text-sm font-black text-primary">Tier {currentTier}</span>
                  </div>
                </div>
              </section>

              {/* Tiers Comparison Table Section */}
              <section className="space-y-6">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">Verification Tiers</h2>
                  <p className="text-sm text-muted-foreground">Compare features and limits across different account levels.</p>
                </div>
                
                <div className="overflow-x-auto rounded-xl border bg-card scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b w-[250px]">Features</th>
                        <th className={cn(
                          "p-4 text-xs font-bold uppercase tracking-wider border-b text-center",
                          currentTier === 1 ? "bg-primary/5 text-primary" : "text-muted-foreground"
                        )}>
                          Tier 1
                        </th>
                        <th className={cn(
                          "p-4 text-xs font-bold uppercase tracking-wider border-b text-center",
                          currentTier === 2 ? "bg-primary/5 text-primary" : "text-muted-foreground"
                        )}>
                          Tier 2
                        </th>
                        <th className={cn(
                          "p-4 text-xs font-bold uppercase tracking-wider border-b text-center",
                          currentTier === 3 ? "bg-primary/5 text-primary" : "text-muted-foreground"
                        )}>
                          Tier 3
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {TIER_FEATURES.map((feature, idx) => (
                        <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-muted-foreground border-b">{feature.label}</td>
                          {feature.values.map((val, vIdx) => (
                            <td key={vIdx} className={cn(
                              "p-4 border-b text-center",
                              currentTier === (vIdx + 1) && "bg-primary/2"
                            )}>
                              {val === "Yes" ? (
                                <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                              ) : val === "No" ? (
                                <span className="text-muted-foreground/50">None</span>
                              ) : (
                                <span>{val}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                      <tr className="bg-muted/20">
                        <td className="p-4 text-xs font-bold uppercase text-muted-foreground">Requirement</td>
                        <td className="p-4 text-center text-xs font-bold">Registration</td>
                        <td className="p-4 text-center text-xs font-bold">NIN Verification</td>
                        <td className="p-4 text-center text-xs font-bold">BVN Verification</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Upgrade Action Section */}
              {currentTier < 3 && (
                <section className="space-y-4">
                  {isMobile ? (
                    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                      <DrawerTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full h-auto p-4 rounded-2xl flex items-center justify-between bg-card hover:bg-muted/30 transition-all active:scale-[0.98] group overflow-hidden border-border"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <BadgeCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-bold text-base leading-tight truncate">Upgrade to Tier {currentTier + 1}</p>
                              <p className="text-xs text-muted-foreground truncate">Unlock higher limits and more features</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent>
                        <div className="mx-auto w-full max-w-lg">
                          <DrawerHeader className="text-left px-6">
                            <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                              {currentTier === 1 ? <Building2 className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}
                              Verify Your Identity
                            </DrawerTitle>
                            <DrawerDescription>
                              {currentTier === 1 
                                ? "Enter your 11-digit NIN to upgrade to Tier 2." 
                                : "Enter your 11-digit BVN to upgrade to Tier 3."
                              }
                            </DrawerDescription>
                          </DrawerHeader>
                          <UpgradeForm />
                          <DrawerFooter className="px-6 pb-10">
                            <UpgradeButton />
                            <DrawerClose asChild>
                              <Button variant="ghost" className="h-12">Cancel</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full h-auto p-4 rounded-2xl flex items-center justify-between bg-card hover:bg-muted/30 transition-all active:scale-[0.98] group overflow-hidden border-border"
                        >
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <BadgeCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div className="text-left min-w-0 flex-1">
                              <p className="font-bold text-base leading-tight truncate">Upgrade to Tier {currentTier + 1}</p>
                              <p className="text-xs text-muted-foreground truncate">Unlock higher limits and more features</p>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md p-0 overflow-hidden">
                        <DialogHeader className="px-6 pt-6 text-left">
                          <DialogTitle className="text-xl font-bold flex items-center gap-2">
                            {currentTier === 1 ? <Building2 className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5 text-primary" />}
                            Verify Your Identity
                          </DialogTitle>
                          <DialogDescription>
                            {currentTier === 1 
                              ? "Enter your 11-digit NIN to upgrade to Tier 2." 
                              : "Enter your 11-digit BVN to upgrade to Tier 3."
                            }
                          </DialogDescription>
                        </DialogHeader>
                        <UpgradeForm />
                        <DialogFooter className="px-6 pb-6">
                          <UpgradeButton />
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </section>
              )}

              {/* Information Section */}
              <section className="grid md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    Why Verify My Identity?
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Identity verification is a mandatory regulatory requirement for financial institutions in Nigeria. It helps us prevent fraud, money laundering, and ensure that your account remains secure. Higher tiers provide you with the flexibility to move larger sums of money and access our full range of investment and savings products.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Info className="h-4 w-4 text-primary" />
                    Need Assistance?
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If you encounter any issues during the verification process, or if your name doesn't match your government ID record, please contact our support team.
                  </p>
                  <Button variant="outline" size="sm" className="h-9 font-bold text-xs" asChild>
                    <Link href="/support">
                      Contact Support <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </section>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
