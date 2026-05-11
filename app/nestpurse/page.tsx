"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import useSWR from "swr"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus,
  SendIcon,
  ArrowDownIcon,
  EyeIcon,
  EyeOffIcon,
  ClockIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  RotateCcw,
  WalletIcon,
  PiggyBankIcon,
  PieChartIcon,
  ChevronRight,
  ShieldCheck,
  CreditCardIcon,
  ArrowUpRight,
} from "lucide-react"

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorState } from "@/components/error-state"
import { AddMoneyDialog } from "@/components/purse/add-money-dialog"
import { SendMoneyDialog } from "@/components/purse/send-money-dialog"
import { WithdrawDialog } from "@/components/purse/withdraw-dialog"
import { useProfile } from "@/hooks/use-profile"
import { nestEggsApi } from "@/lib/nesteggs-api"
import { cn } from "@/lib/utils"
import { SettingsDialog } from "@/components/settings-dialog"

function NestPursePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showBalance, setShowBalance] = React.useState(true)
  const [showAddMoney, setShowAddMoney] = React.useState(false)
  const [showSendMoney, setShowSendMoney] = React.useState(false)
  const [showWithdraw, setShowWithdraw] = React.useState(false)
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const {
    profile,
    balance: walletBalance,
    recentActivity,
    isLoading: isProfileLoading,
    error: profileError,
    mutate: mutateProfile,
  } = useProfile()

  const {
    data: eggSummaryRes,
    isLoading: isEggLoading,
    mutate: mutateEgg,
  } = useSWR("nestegg-summary", () => nestEggsApi.balanceSummary())

  const eggBalance = eggSummaryRes?.data?.grandTotal || 0
  const totalAssets = walletBalance + eggBalance

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([mutateProfile(), mutateEgg()])
    setIsRefreshing(false)
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

  const openSettings = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("settings", "true")
    params.set("tab", tab)
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const isLoading = isProfileLoading || isEggLoading

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>NestPurse</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Header Section */}
          <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">NestPurse</h1>
              <p className="mt-1 text-muted-foreground">
                Manage your wallet, track assets, and handle transactions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 rounded-xl"
              >
                <RotateCcw
                  className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowBalance(!showBalance)}
                className="h-10 w-10 rounded-xl"
              >
                {showBalance ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </section>

          {/* Asset Overview Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Total Assets Card - Hero */}
            <Card className="relative overflow-hidden border-none bg-linear-to-br from-[#cca751] via-[#b89543] to-[#8a6d2f] text-white shadow-2xl md:col-span-3 dark:from-[#b89543] dark:via-[#8a6d2f] dark:to-[#5c4a1f]">
              <div className="pointer-events-none absolute top-0 right-0 p-8 text-white opacity-20 transition-opacity group-hover:opacity-30">
                <PieChartIcon size={180} />
              </div>
              <CardHeader>
                <CardTitle className="text-sm font-bold tracking-wider text-black uppercase opacity-80 dark:text-white/90">
                  Total Net Worth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-14 overflow-hidden text-5xl font-black tracking-tighter text-black dark:text-white">
                  {isLoading ? (
                    <Skeleton className="h-12 w-64 bg-white/20" />
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showBalance ? "visible" : "hidden"}
                        initial={{ opacity: 0, filter: "blur(10px)", y: 10 }}
                        animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                        exit={{ opacity: 0, filter: "blur(10px)", y: -10 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      >
                        {showBalance
                          ? formatCurrency(totalAssets)
                          : "••••••••••••"}
                      </motion.div>
                    </AnimatePresence>
                  )}
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    <WalletIcon className="h-4 w-4 text-black dark:text-white/90" />
                    <span className="text-xs font-bold text-black dark:text-white">
                      Wallet:{" "}
                      {showBalance ? formatCurrency(walletBalance) : "••••"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 backdrop-blur-md">
                    <PiggyBankIcon className="h-4 w-4 text-black dark:text-white/90" />
                    <span className="text-xs font-bold text-black dark:text-white">
                      Savings:{" "}
                      {showBalance ? formatCurrency(eggBalance) : "••••"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Individual Wallets */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <WalletIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : showBalance ? (
                    formatCurrency(walletBalance)
                  ) : (
                    "••••••••"
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ready to spend or send
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="w-full rounded-lgd"
                    onClick={() => setShowAddMoney(true)}
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" /> Top-up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full rounded-lg"
                    onClick={() => setShowWithdraw(true)}
                  >
                    <ArrowDownIcon className="mr-1 h-3.5 w-3.5" /> Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Savings
                </CardTitle>
                <PiggyBankIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : showBalance ? (
                    formatCurrency(eggBalance)
                  ) : (
                    "••••••••"
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Locked in NestEggs & Groups
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-4 w-full justify-between rounded-lg px-2"
                  asChild
                >
                  <a href="/savings/eggs">
                    View My Eggs <ChevronRight className="h-3.5 w-3.5" />
                  </a>
                </Button>
              </CardContent>
            </Card>

            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Security Status
                </CardTitle>
                <ShieldCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={cn("h-2 w-2 rounded-full", (profile?.is2FAEnabled && profile?.hasPin) ? "bg-green-500" : "bg-yellow-500")} />
                  <span className="font-bold">
                    {(profile?.is2FAEnabled && profile?.hasPin) ? "Account Secure" : "Action Required"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {profile?.is2FAEnabled ? "2FA Active" : "2FA Disabled"} • {profile?.hasPin ? "PIN Set" : "No PIN"}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full rounded-lg"
                  onClick={() => openSettings("security")}
                >
                  Manage Security
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Transactions Section */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Recent Transactions</CardTitle>
                  <CardDescription>
                    Your latest financial activities
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href="/nestpurse/transactions">View All</a>
                </Button>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-xl" />
                    ))}
                  </div>
                ) : recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.slice(0, 5).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between rounded-xl border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/50"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                            {getTransactionIcon(activity)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate pr-4 text-sm font-bold capitalize">
                              {activity.narration ||
                                activity.method?.replace("_", " ") ||
                                "Transaction"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.date
                                ? format(
                                    new Date(activity.date),
                                    "MMM dd, hh:mm a"
                                  )
                                : "Date unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-sm font-bold",
                              activity.type === "credit"
                                ? "text-green-500"
                                : "text-foreground"
                            )}
                          >
                            {activity.type === "credit" ? "+" : "-"}
                            {formatCurrency(activity.amount)}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            {activity.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClockIcon className="mb-3 h-12 w-12 text-muted-foreground/20" />
                    <p className="font-medium text-muted-foreground">
                      No transactions found
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Side Column: Bank & Cards Summary */}
            <div className="space-y-6">
              <Card className="border-none bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-medium">
                    <CreditCardIcon className="h-4 w-4" />
                    Saved Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-xs opacity-70">
                    You have multiple accounts linked for easy withdrawals.
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full rounded-xl border-none bg-white/10 text-white hover:bg-white/20"
                    onClick={() => openSettings("billing")}
                  >
                    Manage Banks
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">
                    Quick Transfer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Send money instantly to any bank account in Nigeria.
                  </p>
                  <Button
                    className="w-full gap-2 rounded-xl"
                    onClick={() => setShowSendMoney(true)}
                  >
                    <SendIcon className="h-4 w-4" /> Send Money Now
                  </Button>
                  <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                      <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[10px] leading-relaxed text-blue-800 dark:text-blue-300">
                      Transfer money to other banks within seconds. Secure and
                      reliable.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Dialogs */}
        <AddMoneyDialog
          open={showAddMoney}
          onOpenChange={setShowAddMoney}
          profile={profile}
        />
        <SendMoneyDialog
          open={showSendMoney}
          onOpenChange={setShowSendMoney}
          profile={profile}
        />
        <WithdrawDialog
          open={showWithdraw}
          onOpenChange={setShowWithdraw}
          profile={profile}
        />
        <SettingsDialog />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default NestPursePage
