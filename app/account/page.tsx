"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
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

const TIER_FEATURES = [
  { label: "Daily Transaction Limit", values: ["₦50,000", "₦100,000", "₦500,000"] },
  { label: "Bank Transfers", values: ["No", "Yes", "Yes"] },
  { label: "External Withdrawals", values: ["No", "Yes", "Yes"] },
  { label: "Group Savings", values: ["Yes", "Yes", "Yes"] },
  { label: "NestBaskets Access", values: ["Yes", "Yes", "Yes"] },
  { label: "Investment Products", values: ["No", "Limited", "Full Access"] },
]

export default function AccountPage() {
  const { profile, mutate, isLoading: isProfileLoading } = useProfile()
  const currentTier = profile?.tier || 1
  
  const [nin, setNin] = React.useState("")
  const [bvn, setBvn] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
      } else {
        toast.error(res.error || "Verification failed")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Account Verification</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
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
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border-2 border-background ring-2 ring-muted/50 relative">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                      <BadgeCheck className={cn("h-5 w-5", getTierBadgeColor(currentTier))} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight line-clamp-1">{profile?.fullName || "User"}</h1>
                      <BadgeCheck className={cn("h-5 w-5 min-w-5", getTierBadgeColor(currentTier))} />
                    </div>
                    <p className="text-muted-foreground text-sm font-medium">{profile?.email}</p>
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
                <section className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-lg font-bold">Upgrade Your Account</h2>
                    <p className="text-sm text-muted-foreground">Complete the verification below to unlock higher limits.</p>
                  </div>

                  <Card className="shadow-sm border-2 border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        {currentTier === 1 ? <Building2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                        {currentTier === 1 ? "Upgrade to Tier 2 (NIN)" : "Upgrade to Tier 3 (BVN)"}
                      </CardTitle>
                      <CardDescription>
                        {currentTier === 1 
                          ? "Enter your National Identity Number to enable bank transfers and withdrawals." 
                          : "Provide your Bank Verification Number for maximum account limits."
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold uppercase text-muted-foreground tracking-tight">
                            {currentTier === 1 ? "11-Digit NIN" : "11-Digit BVN"}
                          </label>
                          <Input 
                            value={currentTier === 1 ? nin : bvn}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '').substring(0, 11)
                              currentTier === 1 ? setNin(val) : setBvn(val)
                            }}
                            placeholder={currentTier === 1 ? "Enter NIN" : "Enter BVN"}
                            className="h-12 bg-muted/30 border-0 focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button 
                            className="h-12 px-8 font-bold min-w-[160px]"
                            disabled={isSubmitting || (currentTier === 1 ? nin.length < 11 : bvn.length < 11)}
                            onClick={currentTier === 1 ? handleUpgradeTier2 : handleUpgradeTier3}
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Verify ID
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 text-xs text-muted-foreground leading-relaxed">
                        <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                        <p>
                          Your information is processed securely. We use banking-grade encryption and only use these details for one-time identity verification with government databases. By verifying, you agree to our <span className="text-primary font-bold cursor-pointer underline underline-offset-2">Terms of Service</span>.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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
