// app/savings/eggs/[id]/page.tsx
"use client"

import { DashboardHeader } from "@/components/dashboard-header"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import confetti from "canvas-confetti"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  PlusCircleIcon,
  ArrowDownCircleIcon,
  RotateCcwIcon,
  TrophyIcon,
  Trash2Icon,
  LockIcon,
  ZapIcon,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { nestEggsApi } from "@/lib/nesteggs-api"
import useSWR from "swr"
import { SemiProgressRing } from "@/components/nesteggs/progress-ring"
import { ContributionList } from "@/components/nesteggs/contribution-list"
import { AutoSaveCard } from "@/components/nesteggs/autosave-card"
import { ContributeModal } from "@/components/nesteggs/contribute-modal"
import {
  FlexibleWithdrawModal,
  RepayWithdrawalModal,
} from "@/components/nesteggs/withdraw-modals"
import { CoverIcon } from "@/components/nesteggs/cover-icon"
import type { NestEgg, NestEggDetailResponse } from "@/types/nesteggs"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

type Tab = "overview" | "history" | "autosave"

export default function GoalDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  
  const { data: res, isLoading, mutate } = useSWR(
    id ? ["nestegg-detail", id] : null,
    () => nestEggsApi.get(id),
    { revalidateOnFocus: true, revalidateIfStale: true, dedupingInterval: 2000 }
  )

  const egg = res?.data || null

  const updateEgg = (updates: Partial<NestEggDetailResponse>) => {
    mutate(
      (current) =>
        current?.data ? { ...current, data: { ...current.data, ...updates } } : current,
      { revalidate: false }
    )
  }

  const [activeTab, setActiveTab] = React.useState<Tab>("overview")
  const [contributeOpen, setContributeOpen] = React.useState(false)
  const [flexWithdrawOpen, setFlexWithdrawOpen] = React.useState(false)
  const [repayOpen, setRepayOpen] = React.useState(false)
  const [contributionRefreshKey, setContributionRefreshKey] = React.useState(0)
  const [isCompleteWithdrawing, setIsCompleteWithdrawing] = React.useState(false)
  const [isCancelling, setIsCancelling] = React.useState(false)
  const [isWithdrawn, setIsWithdrawn] = React.useState(false)
  const [withdrawnAmount, setWithdrawnAmount] = React.useState(0)
  const confettiFired = React.useRef(false)

  // Confetti Animation
  React.useEffect(() => {
    if (!egg || confettiFired.current) return
    if (egg.progress >= 100 && egg.status === "active") {
      confettiFired.current = true
      const colors = ["#C9A84C", "#F5D78E", "#8B6914", "#FFF8E7", "#E8C14A"]
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors, scalar: 1.1 })
      setTimeout(() => confetti({ particleCount: 50, spread: 80, origin: { y: 0.4 }, colors, angle: 60, scalar: 0.9 }), 200)
      setTimeout(() => confetti({ particleCount: 50, spread: 80, origin: { y: 0.4 }, colors, angle: 120, scalar: 0.9 }), 350)
    }
  }, [egg])

  const handleContributeSuccess = (savedAmount: number, progress: number) => {
    updateEgg({ savedAmount, progress, canWithdraw: progress >= 100 })
    setContributionRefreshKey((k) => k + 1)
  }

  const handleAutoSaveUpdate = (updated: Partial<NestEgg>) => {
    updateEgg(updated)
  }

  const handleFlexSuccess = () => {
    mutate()
    setContributionRefreshKey((k) => k + 1)
  }

  const handleCompleteWithdraw = async () => {
    if (!egg) return
    setIsCompleteWithdrawing(true)
    const { data, error } = await nestEggsApi.completeWithdraw(egg.id)
    setIsCompleteWithdrawing(false)
    if (error) { toast.error(error); return }
    const received = egg.isFixed ? (data!.totalReceived ?? data!.amount) : data!.amount
    setWithdrawnAmount(received)
    setIsWithdrawn(true)
    const colors = ["#C9A84C", "#F5D78E", "#8B6914", "#FFF8E7", "#E8C14A"]
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.5 }, colors, scalar: 1.2 })
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 }, colors, angle: 60 }), 300)
    setTimeout(() => confetti({ particleCount: 80, spread: 100, origin: { y: 0.4 }, colors, angle: 120 }), 500)
  }

  const handleCancel = async () => {
    if (!egg) return
    setIsCancelling(true)
    const { error } = await nestEggsApi.cancel(egg.id)
    setIsCancelling(false)
    if (error) { toast.error(error); return }
    toast.success("Goal deleted")
    router.push("/savings/eggs")
  }

  if (isLoading || !egg) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader>
            </DashboardHeader>
          <div className="flex flex-1 gap-6 p-4 md:p-6">
            <div className="flex-1 flex flex-col gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <div className="hidden lg:flex flex-col gap-4 w-80">
              <Skeleton className="h-40 rounded-2xl" />
              <Skeleton className="h-56 rounded-2xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const isActive = egg.status === "active"
  const hasOutstandingFlex = egg.outstanding > 0 && !egg.lastWithdrawalRepaid
  const canFlexWithdraw = isActive && !egg.isFixed && egg.totalWithdrawnPercent < 0.05

  const statRows = [
    { label: "Target", value: formatCurrency(egg.targetAmount) },
    { label: "Saved", value: formatCurrency(egg.savedAmount) },
    { label: "Remaining", value: formatCurrency(Math.max(0, egg.targetAmount - egg.savedAmount)) },
    { label: "Start Date", value: new Date(egg.startDate).toLocaleDateString("en-NG") },
    { label: "End Date", value: new Date(egg.endDate).toLocaleDateString("en-NG") },
    ...(egg.isFixed
      ? [
          { label: "Interest (1%)", value: formatCurrency(egg.targetAmount * 0.01) },
          { label: "Total on Maturity", value: formatCurrency(egg.targetAmount + egg.targetAmount * 0.01) },
        ]
      : []),
    ...(egg.totalWithdrawnPercent > 0
      ? [{ label: "Flex Used", value: `${(egg.totalWithdrawnPercent * 100).toFixed(2)}% of 5%` }]
      : []),
  ]

  const actionButtons = (
    <>
      {isActive && !egg.canWithdraw && (
        <>
          <Button className="w-full gap-1.5 h-11 text-foreground" onClick={() => setContributeOpen(true)}>
            <PlusCircleIcon className="w-4 h-4" />
            Add Money
          </Button>
          {!egg.isFixed && canFlexWithdraw && !hasOutstandingFlex && (
            <Button variant="outline" className="w-full gap-1.5 h-11 text-foreground" onClick={() => setFlexWithdrawOpen(true)}>
              <ArrowDownCircleIcon className="w-4 h-4" />
              Flexible Withdrawal
            </Button>
          )}
          {hasOutstandingFlex && (
            <Button variant="outline" className="w-full gap-1.5 h-11 text-foreground" onClick={() => setRepayOpen(true)}>
              <RotateCcwIcon className="w-4 h-4" />
              Repay Withdrawal
            </Button>
          )}
        </>
      )}
      {egg.canWithdraw && (
        <Button
          className="w-full gap-1.5 h-11 text-foreground"
          onClick={handleCompleteWithdraw}
          disabled={isCompleteWithdrawing}
        >
          <TrophyIcon className="w-4 h-4" />
          {isCompleteWithdrawing ? "Processing..." : "Withdraw All"}
        </Button>
      )}
    </>
  )

  if (isWithdrawn) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbLink href="/savings/eggs">My Eggs</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage className="truncate max-w-40">{egg.title}</BreadcrumbPage></BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </DashboardHeader>
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="flex flex-col items-center gap-6 text-center max-w-sm">
              <div className="relative flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center animate-[ping_1s_ease-out_1]" />
                <div className="absolute w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrophyIcon className="w-9 h-9 text-primary animate-[bounce_0.6s_ease-out_3]" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold">NestEgg Withdrawn!</h2>
                <p className="text-muted-foreground text-sm">
                  <span className="font-semibold text-foreground">{formatCurrency(withdrawnAmount)}</span> has been credited to your NestPurse.
                </p>
                {egg.isFixed && (
                  <p className="text-xs text-primary font-medium">Includes 1% fixed interest</p>
                )}
              </div>
              <div className="w-full h-px bg-border" />
              <p className="text-xs text-muted-foreground">Your goal <span className="font-medium text-foreground">&quot;{egg.title}&quot;</span> has been completed.</p>
              <Button className="w-full gap-2" onClick={() => router.push("/savings/eggs")}>
                Back to My Eggs
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/savings/eggs">My Eggs</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-40">{egg.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </DashboardHeader>

        {/* Two-column layout on lg+, single column on mobile */}
        <div className="flex flex-1 gap-6 p-4 md:p-6 overflow-y-auto">

          {/* ── Left column ─────────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Progress ring card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
              <SemiProgressRing
                progress={egg.progress}
                savedAmount={egg.savedAmount}
                targetAmount={egg.targetAmount}
                formatCurrency={formatCurrency}
              />
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CoverIcon name={egg.cover} className="w-5 h-5 text-primary" />
              </div>
                <h1 className="text-xl font-bold capitalize">{egg.title}</h1>
                {egg.isFixed && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    <LockIcon className="w-3 h-3" /> Fixed · 1% interest
                  </span>
                )}
                {egg.isAutoSave && !egg.isFixed && (
                  <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                    <ZapIcon className="w-3 h-3" /> Auto-Save {egg.isAutoSavePaused ? "(Paused)" : "On"}
                  </span>
                )}
              </div>
              <div className="flex gap-6 text-center text-sm">
                <div>
                  <p className="font-bold text-foreground text-base">{egg.daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">days left</p>
                </div>
                <Separator orientation="vertical" className="h-8 self-center" />
                <div>
                  <p className="font-bold text-foreground text-base">{egg.progress.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">progress</p>
                </div>
                {egg.isFixed && (
                  <>
                    <Separator orientation="vertical" className="h-8 self-center" />
                    <div>
                      <p className="font-bold text-primary text-base">{formatCurrency(egg.targetAmount * 0.01)}</p>
                      <p className="text-xs text-muted-foreground">interest</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Outstanding flex warning */}
            {hasOutstandingFlex && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex items-center justify-between gap-2">
                <p>Outstanding flexible withdrawal: <strong>{formatCurrency(egg.outstanding)}</strong></p>
                <Button size="sm" variant="outline" onClick={() => setRepayOpen(true)} className="shrink-0">
                  Repay
                </Button>
              </div>
            )}

            {/* Maturity CTA (mobile — shown below lg) */}
            {egg.canWithdraw && (
              <div className="lg:hidden bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold flex items-center gap-1.5">
                    <TrophyIcon className="w-4 h-4 text-primary" />
                    {egg.isFixed ? "Fixed savings matured!" : "Goal achieved!"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {egg.isFixed
                      ? `Withdraw ${formatCurrency(egg.savedAmount + egg.targetAmount * 0.01)} (incl. interest)`
                      : `Withdraw ${formatCurrency(egg.savedAmount)}`}
                  </p>
                </div>
                <Button onClick={handleCompleteWithdraw} disabled={isCompleteWithdrawing} size="sm" className="h-11 text-foreground">
                  {isCompleteWithdrawing ? "Processing..." : "Withdraw All"}
                </Button>
              </div>
            )}

            {/* Mobile action buttons — hidden on lg+ (shown in right column) */}
            {(isActive || egg.canWithdraw) && (
              <div className="flex flex-col gap-2 lg:hidden">
                {actionButtons}
              </div>
            )}

            {/* Tab bar — desktop: Overview + History only; mobile: + Auto-Save */}
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              {(["overview", "history"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              {/* Auto-Save tab only on mobile */}
              {!egg.isFixed && (
                <button
                  onClick={() => setActiveTab("autosave")}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors lg:hidden ${
                    activeTab === "autosave"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Auto-Save
                </button>
              )}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-3">
                <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                  {statRows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between px-4 py-3 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
                {isActive && egg.contributions.length === 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive self-start gap-1.5">
                        <Trash2Icon className="w-4 h-4" /> Delete Goal
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete &quot;{egg.title}&quot;?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This goal has no contributions and will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="h-11">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleCancel}
                          disabled={isCancelling}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-foreground"
                        >
                          {isCancelling ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <ContributionList
                nestEggId={egg.id}
                formatCurrency={formatCurrency}
                refreshKey={contributionRefreshKey}
              />
            )}

            {/* Auto-Save tab — mobile only */}
            {activeTab === "autosave" && !egg.isFixed && (
              <div className="lg:hidden">
                <AutoSaveCard egg={egg} onUpdate={handleAutoSaveUpdate} />
              </div>
            )}
          </div>

          {/* ── Right column — desktop only ──────────────────────── */}
          <div className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 shrink-0">

            {/* Maturity CTA */}
            {egg.canWithdraw && (
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col gap-3">
                <p className="font-semibold flex items-center gap-1.5 text-sm">
                  <TrophyIcon className="w-4 h-4 text-primary" />
                  {egg.isFixed ? "Fixed savings matured!" : "Goal achieved!"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {egg.isFixed
                    ? `Withdraw ${formatCurrency(egg.savedAmount + egg.targetAmount * 0.01)} incl. 1% interest`
                    : `You hit 100% — ready to collect ${formatCurrency(egg.savedAmount)}`}
                </p>
                <Button onClick={handleCompleteWithdraw} disabled={isCompleteWithdrawing} className="w-full gap-1.5 h-11 text-foreground">
                  <TrophyIcon className="w-4 h-4" />
                  {isCompleteWithdrawing ? "Processing..." : "Withdraw All"}
                </Button>
              </div>
            )}

            {/* Action buttons card */}
            {isActive && !egg.canWithdraw && (
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Actions</p>
                {actionButtons}
              </div>
            )}

            {/* Quick stats */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {statRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Auto-save card */}
            <AutoSaveCard egg={egg} onUpdate={handleAutoSaveUpdate} />

            {/* Delete goal */}
            {isActive && egg.contributions.length === 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5 self-start">
                    <Trash2Icon className="w-4 h-4" /> Delete Goal
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete &quot;{egg.title}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This goal has no contributions and will be permanently deleted. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={isCancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isCancelling ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </SidebarInset>

      <ContributeModal
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
        nestEggId={egg.id}
        nestEggTitle={egg.title}
        remaining={Math.max(0, egg.targetAmount - egg.savedAmount)}
        onSuccess={handleContributeSuccess}
      />
      <FlexibleWithdrawModal
        open={flexWithdrawOpen}
        onClose={() => setFlexWithdrawOpen(false)}
        egg={egg}
        onSuccess={handleFlexSuccess}
        formatCurrency={formatCurrency}
      />
      <RepayWithdrawalModal
        open={repayOpen}
        onClose={() => setRepayOpen(false)}
        egg={egg}
        outstanding={egg.outstanding}
        onSuccess={handleFlexSuccess}
        formatCurrency={formatCurrency}
      />
    </SidebarProvider>
  )
}
