// app/savings/locked/page.tsx
"use client"

import * as React from "react"
import Link from "next/link"
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
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { LockIcon, LockOpenIcon, TrophyIcon } from "lucide-react"
import { toast } from "sonner"
import { CoverIcon } from "@/components/nesteggs/cover-icon"
import { nestEggsApi } from "@/lib/nesteggs-api"
import type { FixedNestEgg } from "@/types/nesteggs"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

interface LockedEggCardProps {
  egg: FixedNestEgg
  isWithdrawing: boolean
  onWithdraw: (id: string) => void
}

function LockedEggCard({ egg, isWithdrawing, onWithdraw }: LockedEggCardProps) {
  const progressPct = Math.min(100, egg.progress)
  const isMature = egg.isMature

  return (
    <div className="bg-foreground text-background rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            {isMature ? (
              <LockOpenIcon className="w-4 h-4 text-primary" />
            ) : (
              <LockIcon className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CoverIcon name={egg.cover} className="w-4 h-4 text-primary" />
              <p className="font-semibold text-sm leading-tight truncate">{egg.title}</p>
            </div>
          </div>
        </div>
        {isMature && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/30 text-primary shrink-0">
            Matured
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-background/60">Progress</span>
          <span className="font-medium">{progressPct.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-background/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-background/60">Saved</p>
          <p className="font-semibold">{formatCurrency(egg.savedAmount)}</p>
        </div>
        <div>
          <p className="text-background/60">Target</p>
          <p className="font-semibold">{formatCurrency(egg.targetAmount)}</p>
        </div>
        <div>
          <p className="text-background/60">{isMature ? "Status" : "Days left"}</p>
          <p className="font-semibold">{isMature ? "Matured ✓" : `${egg.daysToMaturity} days`}</p>
        </div>
        <div>
          <p className="text-background/60">Interest (1%)</p>
          <p className="font-semibold text-primary">{formatCurrency(egg.expectedInterest)}</p>
        </div>
      </div>

      {/* Total payout row */}
      <div className="bg-background/10 rounded-xl p-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-background/60">Total on maturity</p>
          <p className="font-bold text-primary">{formatCurrency(egg.totalOnMaturity)}</p>
        </div>
        {isMature && egg.status === "active" ? (
          <Button
            size="sm"
            onClick={() => onWithdraw(egg.id)}
            disabled={isWithdrawing}
            className="gap-1.5 shrink-0"
          >
            <TrophyIcon className="w-3.5 h-3.5" />
            {isWithdrawing ? "Processing..." : "Withdraw"}
          </Button>
        ) : (
          <Link href={`/savings/eggs/${egg.id}`}>
            <Button
              size="sm"
              variant="ghost"
              className="text-background/70 hover:text-background text-xs shrink-0"
            >
              Details →
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

export default function LockedSavingsPage() {
  const [eggs, setEggs] = React.useState<FixedNestEgg[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [withdrawingId, setWithdrawingId] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    const { data } = await nestEggsApi.fixed()
    if (data) setEggs(data.fixedNestEggs)
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleWithdraw = async (id: string) => {
    setWithdrawingId(id)
    const { data, error } = await nestEggsApi.completeWithdraw(id)
    setWithdrawingId(null)
    if (error) {
      toast.error(error)
      return
    }
    const interest = data?.interest ?? 0
    const total = data?.totalReceived ?? data?.amount ?? 0
    toast.success(
      `${formatCurrency(total)} credited to NestPurse!` +
        (interest > 0 ? ` (incl. ${formatCurrency(interest)} interest)` : "")
    )
    setEggs((prev) => prev.filter((e) => e.id !== id))
  }

  const totalLocked = eggs.reduce((sum, e) => sum + e.savedAmount, 0)
  const totalInterest = eggs.reduce((sum, e) => sum + e.expectedInterest, 0)
  const matureCount = eggs.filter((e) => e.isMature && e.status === "active").length

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
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Locked Savings</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">

          {/* Summary banner — always visible, skeleton amounts while loading */}
          <div className="bg-foreground text-background rounded-2xl p-5 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-background/60">Total Locked</p>
              {isLoading
                ? <Skeleton className="h-7 w-24 mt-1 bg-background/20" />
                : <p className="text-lg font-bold">{formatCurrency(totalLocked)}</p>
              }
            </div>
            <div>
              <p className="text-xs text-background/60">Expected Interest</p>
              {isLoading
                ? <Skeleton className="h-7 w-20 mt-1 bg-background/20" />
                : <p className="text-lg font-bold text-primary">{formatCurrency(totalInterest)}</p>
              }
            </div>
            <div>
              <p className="text-xs text-background/60">Ready to Withdraw</p>
              {isLoading
                ? <Skeleton className="h-7 w-8 mt-1 bg-background/20" />
                : <p className="text-lg font-bold">{matureCount}</p>
              }
            </div>
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Fixed Savings</h2>
            <Link href="/savings/eggs">
              <Button size="sm" variant="outline">+ New Goal</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Loading your locked savings...</p>
            </div>
          ) : eggs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <LockIcon className="w-12 h-12 text-muted-foreground" />
              <p className="text-lg font-semibold">No locked savings</p>
              <p className="text-sm text-muted-foreground text-center max-w-xs">
                Create a Fixed savings goal to lock in your money and earn 1% interest on maturity.
              </p>
              <Link href="/savings/eggs">
                <Button className="mt-2">Create Fixed Goal</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in duration-500">
              {eggs.map((egg) => (
                <LockedEggCard
                  key={egg.id}
                  egg={egg}
                  isWithdrawing={withdrawingId === egg.id}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
