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
import { useSearchParams } from "next/navigation"
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

function Dashboard() {
  const searchParams = useSearchParams()
  const { user: authUser, isAuthenticated } = useAuth()
  const [isInitialLoad, setIsInitialLoad] = React.useState(true)
  const [showBalance, setShowBalance] = React.useState(true)
  const [dashboardData, setDashboardData] = React.useState<{
    balance: number
    recentActivity: any[]
    profile: any
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    setIsInitialLoad(false)

    if (isAuthenticated) {
      authApi
        .getProfile()
        .then(({ data }) => {
          if (data) {
            setDashboardData({
              balance: data.balance || 0,
              recentActivity: data.recentActivity || [],
              profile: data.profile || {},
            })
          }
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    } else {
      // If we're not authenticated after initial load, stop loading
      setIsLoading(false)
    }
  }, [isAuthenticated])

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
          {/* Greeting Section */}
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">
              Hello,{" "}
              {dashboardData?.profile?.firstName ||
                authUser?.firstName ||
                "GrowNester"}
              ! 👋
            </h1>
            <p className="text-muted-foreground">
              Welcome back. Here's what's happening with your account today.
            </p>
          </section>

          {/* Balance & Quick Actions Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Balance Card */}
            <Card className="relative overflow-hidden lg:col-span-2">
              <div className="pointer-events-none absolute top-0 right-0 p-4 opacity-10">
                <TrendingUpIcon size={120} />
              </div>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Balance
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowBalance(!showBalance)}
                  className="h-8 w-8"
                >
                  {showBalance ? (
                    <EyeOffIcon size={16} />
                  ) : (
                    <EyeIcon size={16} />
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex h-10 items-center gap-2">
                    <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="text-4xl font-bold">
                    <span
                      key={showBalance ? "show" : "hide"}
                      className="inline-block animate-in fade-in slide-in-from-bottom-1 duration-300"
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

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-medium">Quick Actions</h3>
              <Button
                className="h-14 justify-start gap-3 rounded-xl text-base text-black dark:text-white"
                size="lg"
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
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <ArrowDownIcon size={18} />
                </div>
                Withdraw
              </Button>
            </div>
          </div>

          {/* Recent Activity Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Recent Activity
              </h2>
              <Button variant="link" className="px-0">
                View all
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
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                        {getTransactionIcon(activity)}
                      </div>
                      <div>
                        <p className="font-medium capitalize">
                          {activity.narration ||
                            activity.method?.replace("_", " ") ||
                            "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.date
                            ? format(
                                new Date(activity.date),
                                "MMM dd, yyyy • hh:mm a"
                              )
                            : "Date unknown"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
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
        </div>
      </SidebarInset>
      <SettingsDialog />
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
