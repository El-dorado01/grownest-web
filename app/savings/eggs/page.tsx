// app/savings/eggs/page.tsx
"use client"

import * as React from "react"
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
import { Loader2, PlusIcon, Search } from "lucide-react"
import { nestEggsApi } from "@/lib/nesteggs-api"
import { BalanceSummaryCards } from "@/components/nesteggs/balance-summary"
import { GoalCard } from "@/components/nesteggs/goal-card"
import { CreateGoalSheet } from "@/components/nesteggs/create-goal-sheet"
import type { NestEgg, BalanceSummary } from "@/types/nesteggs"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

type Filter = "all" | "active" | "fixed" | "autosave" | "completed"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "fixed", label: "Fixed" },
  { key: "autosave", label: "Auto-Save" },
  { key: "completed", label: "Completed" },
]

export default function MyEggsPage() {
  const [eggs, setEggs] = React.useState<NestEgg[]>([])
  const [summary, setSummary] = React.useState<BalanceSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [showCreate, setShowCreate] = React.useState(false)
  const [filter, setFilter] = React.useState<Filter>("all")

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    const [eggsRes, summaryRes] = await Promise.all([
      nestEggsApi.list(),
      nestEggsApi.balanceSummary(),
    ])
    if (eggsRes.data) setEggs(eggsRes.data.nestEggs)
    if (summaryRes.data) setSummary(summaryRes.data)
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreated = (egg: NestEgg) => {
    setEggs((prev) => [egg, ...prev])
    fetchData()
  }

  const filtered = eggs.filter((egg) => {
    if (filter === "all") return true
    if (filter === "active") return egg.status === "active"
    if (filter === "fixed") return egg.isFixed
    if (filter === "autosave") return egg.isAutoSave
    if (filter === "completed") return egg.status === "completed"
    return true
  })

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
                  <BreadcrumbPage>My Eggs</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          {/* Balance summary */}
          <BalanceSummaryCards
            summary={summary}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />

          {/* Goals section header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">My Savings Goals</h2>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">
                  {eggs.length} goal{eggs.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              size="sm"
              className="gap-1.5 text-foreground h-11"
            >
              <PlusIcon className="w-4 h-4" />
              New Goal
            </Button>
          </div>

          {/* Filter tabs */}
          {!isLoading && eggs.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {/* Goal grid */}
          {isLoading ? (       
        <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
        Getting your eggs...
        </p>
      </div>
          ) : eggs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">🥚</span>
              <p className="text-lg font-semibold">No savings goals yet</p>
              <p className="text-sm text-muted-foreground">Create your first goal to start saving</p>
              <Button onClick={() => setShowCreate(true)} className="mt-2 gap-1.5 text-foreground">
                <PlusIcon className="w-4 h-4" /> Create Goal
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl"><Search /></span>
              <p className="text-base font-semibold">No {FILTERS.find(f => f.key === filter)?.label.toLowerCase()} goals</p>
              <button onClick={() => setFilter("all")} className="text-sm text-primary underline-offset-2 hover:underline">
                Show all goals
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
              {filtered.map((egg, i) => (
                <GoalCard
                  key={egg.id}
                  egg={egg}
                  variant={i % 2 === 1 ? "dark" : "light"}
                  formatCurrency={formatCurrency}
                />
              ))}
            </div>
          )}
        </div>
      </SidebarInset>

      <CreateGoalSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </SidebarProvider>
  )
}
