// app/savings/locked/page.tsx
"use client"

import { DashboardHeader } from "@/components/dashboard-header"

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
import { ProgressRing } from "@/components/nesteggs/progress-ring"
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
  const isMature = egg.isMature && egg.status === "active"

  const inner = (
    <div className="relative bg-foreground text-background rounded-2xl p-5 flex flex-col gap-4 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
      {/* Top row: cover icon + badges */}
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
          <CoverIcon name={egg.cover} className="w-5 h-5 text-primary" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/30 text-primary">
            {isMature ? <LockOpenIcon className="w-2.5 h-2.5" /> : <LockIcon className="w-2.5 h-2.5" />}
            {isMature ? "Matured" : "Fixed"}
          </span>
        </div>
      </div>

      {/* Title */}
      <p className="text-sm font-semibold leading-tight line-clamp-2 text-background">{egg.title}</p>

      {/* Progress ring */}
      <div className="flex justify-center">
        <div className="[&_svg_circle.text-border]:text-white/20 [&_.text-foreground]:text-background [&_.text-muted-foreground]:text-background/60">
          <ProgressRing progress={egg.progress} size={96} strokeWidth={9} />
        </div>
      </div>

      {/* Amounts */}
      <div className="text-center">
        <p className="text-sm font-bold text-primary">
          {formatCurrency(egg.savedAmount)}{" "}
          <span className="font-normal text-xs text-background/50">/ {formatCurrency(egg.targetAmount)}</span>
        </p>
        <p className="text-xs mt-0.5 text-background/60">
          {isMature ? `+${formatCurrency(egg.expectedInterest)} interest` : `${egg.daysToMaturity} day${egg.daysToMaturity !== 1 ? "s" : ""} to maturity`}
        </p>
      </div>

      {/* Withdraw button for matured eggs */}
      {isMature && (
        <Button
          size="sm"
          onClick={(e) => { e.preventDefault(); onWithdraw(egg.id) }}
          disabled={isWithdrawing}
          className="w-full gap-1.5"
        >
          <TrophyIcon className="w-3.5 h-3.5" />
          {isWithdrawing ? "Processing..." : "Withdraw All"}
        </Button>
      )}
    </div>
  )

  if (isMature) return inner
  return <Link href={`/savings/eggs/${egg.id}`}>{inner}</Link>
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
        <DashboardHeader>
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
          </DashboardHeader>

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
