"use client"

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
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { SettingsDialog } from "@/components/settings-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useSearchParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import {
  Plus,
  SendIcon,
  ArrowDownIcon,
  EyeIcon,
  EyeOffIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  Loader2Icon,
  RotateCcw,
  WalletIcon,
  ArrowUpRight
} from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import * as React from "react"
import { format } from "date-fns"
import { ErrorState } from "@/components/error-state"
import { AddMoneyDialog } from "@/components/purse/add-money-dialog"
import { SendMoneyDialog } from "@/components/purse/send-money-dialog"
import { WithdrawDialog } from "@/components/purse/withdraw-dialog"

import { useProfile } from "@/hooks/use-profile"
import Link from "next/link"

export function Dashboard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [showBalance, setShowBalance] = React.useState(true)
  
  const { 
    profile, 
    balance, 
    recentActivity, 
    isLoading: isProfileLoading, 
    error, 
    mutate 
  } = useProfile()

  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [showAddMoney, setShowAddMoney] = React.useState(false)
  const [showSendMoney, setShowSendMoney] = React.useState(false)
  const [showWithdraw, setShowWithdraw] = React.useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  React.useEffect(() => {
    setIsInitialLoad(false)
  }, [])

  const isLoading = isProfileLoading || (isAuthLoading && isInitialLoad)

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && profile) {
      // 1. If email not verified, go to verify
      if (!profile.isVerified) {
        router.push("/signup/verify")
        return
      }
      
      // 2. If profile incomplete (no name), go to onboarding
      if (!profile.fullName) {
        router.push("/onboarding")
        return
      }
    }
  }, [isLoading, isAuthenticated, profile, router])

  const dashboardData = {
    balance,
    recentActivity,
    profile: profile || {}
  }

  // Detect if NestPurse needs setup (checking for virtual account)
  const needsSetup = !profile?.hasPurse

  const showSettingsAsPage =
    isInitialLoad && searchParams.get("settings") === "true"

  if (showSettingsAsPage) {
    return <SettingsDialog isPage={true} />
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount)
  }

  const getTransactionIcon = (activity: any) => {
    if (activity.type === "credit")
      return <TrendingUpIcon className="text-green-500" />
    if (activity.type === "debit") {
      if (activity.method === "withdrawal")
        return <ArrowDownIcon className="text-red-500" />
      if (
        activity.method === "bank_transfer" ||
        activity.method === "send_money"
      )
        return <SendIcon className="text-blue-500" />
      return <TrendingDownIcon className="text-red-500" />
    }
    return <ClockIcon className="text-muted-foreground" />
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {error ? (
            <div className="flex flex-1 items-center justify-center">
              <ErrorState 
                title="Couldn't load dashboard"
                onRetry={() => handleRefresh()}
                isRetrying={isLoading || isRefreshing}
              />
            </div>
          ) : (
            <>
              {/* Greeting Section */}
           <section>
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
              Hello,{" "}
              {isLoading ? (
                <Skeleton className="inline-block h-8 w-32" />
              ) : (
                <>
                  {dashboardData?.profile?.firstName ||
                    "GrowNester"}
                  ! 👋
                </>
              )}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Welcome back. Here's what's happening with your account today.
            </p>
          </section>

          {needsSetup && !isLoading && (
            <Card className="border-muted bg-muted/30 shadow-none">
              <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <WalletIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-none">Complete NestPurse Setup</h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                      Set your transaction PIN and link a bank account to start moving funds securely.
                    </p>
                  </div>
                </div>
                <Button 
                  className="w-full md:w-auto rounded-xl h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground dark:text-white whitespace-nowrap font-bold text-sm"
                  onClick={() => router.push("/onboarding")}
                >
                  Setup Now <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Balance & Quick Actions Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Balance Card */}
            {!needsSetup && (
              <Card className="relative overflow-hidden lg:col-span-2">
              <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
                <TrendingUpIcon size={120} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Balance
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRefresh()}
                    disabled={isRefreshing}
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <RotateCcw
                      className={isRefreshing ? "animate-spin" : ""}
                      size={16}
                    />
                    <span className="sr-only">Refresh Balance</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowBalance(!showBalance)}
                    className="h-8 w-8 text-muted-foreground"
                  >
                    {showBalance ? (
                      <EyeOffIcon size={16} />
                    ) : (
                      <EyeIcon size={16} />
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-10 items-center">
                    <Skeleton className="h-10 w-48" />
                  </div>
                ) : (
                  <div className="text-4xl font-bold">
                    <span
                      key={showBalance ? "show" : "hide"}
                      className="inline-block animate-in duration-300 fade-in slide-in-from-bottom-1"
                    >
                      {showBalance
                        ? formatCurrency(dashboardData?.balance || 0)
                        : "••••••••••"}
                    </span>
                  </div>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Your current available funds in NestPurse
                </p>
              </CardContent>
            </Card>
            )}

            {/* Quick Actions */}
            {!needsSetup && (
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">Quick Actions</h3>
              <Button
                className="h-14 justify-start gap-3 rounded-xl text-base text-black dark:text-white"
                size="lg"
                onClick={() => setShowAddMoney(true)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                  <Plus size={18} />
                </div>
                Add Money
              </Button>
              <Button
                variant="outline"
                className="h-14 justify-start gap-3 rounded-xl text-base"
                size="lg"
                onClick={() => setShowSendMoney(true)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                  <SendIcon size={18} />
                </div>
                Send Money
              </Button>
              <Button
                variant="outline"
                className="h-14 justify-start gap-3 rounded-xl text-base"
                size="lg"
                onClick={() => setShowWithdraw(true)}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <ArrowDownIcon size={18} />
                </div>
                Withdraw
              </Button>
            </div>
          )}
        </div>

          {/* Recent Activity Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent Activity
              </h2>
              <Button variant="link" className="px-0" asChild>
                <Link href="/nestpurse/transactions">
                  View all
                </Link>
              </Button>
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 w-full animate-pulse rounded-xl bg-muted/50"
                  />
                ))}
              </div>
            ) : dashboardData?.recentActivity &&
              dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex flex-1 items-center gap-4 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted/50">
                        {getTransactionIcon(activity)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium capitalize truncate">
                          {activity.narration ||
                            activity.method?.replace("_", " ") ||
                            "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.date
                            ? format(
                                new Date(activity.date),
                                "MMM dd, yyyy • hh:mm a"
                              )
                            : "Date unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p
                        className={`font-semibold ${activity.type === "credit" ? "text-green-500" : "text-foreground"}`}
                      >
                        {activity.type === "credit" ? "+" : "-"}
                        {formatCurrency(activity.amount)}
                      </p>
                      <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                        {activity.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
                <ClockIcon className="mb-3 h-10 w-10 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground">No recent activity yet.</p>
              </div>
            )}
          </section>
            </>
          )}
        </div>
        <AddMoneyDialog 
          open={showAddMoney} 
          onOpenChange={setShowAddMoney} 
          profile={profile}
        />
        <SendMoneyDialog
          open={showSendMoney}
          onOpenChange={setShowSendMoney}
          profile={profile}
          balance={balance}
        />
        <WithdrawDialog
          open={showWithdraw}
          onOpenChange={setShowWithdraw}
          profile={profile}
          balance={balance}
        />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <Dashboard />
    </React.Suspense>
  )
}
