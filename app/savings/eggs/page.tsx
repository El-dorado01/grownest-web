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
import { Skeleton } from "@/components/ui/skeleton"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Loader2, PlusIcon, Search, LayoutGrid, List } from "lucide-react"
import { BalanceSummaryCards } from "@/components/nesteggs/balance-summary"
import { GoalCard } from "@/components/nesteggs/goal-card"
import { CreateGoalSheet } from "@/components/nesteggs/create-goal-sheet"
import { nestEggsApi } from "@/lib/nesteggs-api"
import useSWR from "swr"
import Link from "next/link"
import { cn } from "@/lib/utils"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount)

type Filter = "all" | "active" | "fixed" | "autosave" | "completed"
type ViewMode = "grid" | "table"

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "fixed", label: "Fixed" },
  { key: "autosave", label: "Auto-Save" },
  { key: "completed", label: "Completed" },
]

export default function MyEggsPage() {
  const [showCreate, setShowCreate] = React.useState(false)
  const [filter, setFilter] = React.useState<Filter>("all")
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")

  // SWR for Eggs list
  const { 
    data: eggsRes, 
    isLoading: isEggsLoading, 
    mutate: mutateEggs 
  } = useSWR("nesteggs-list", () => nestEggsApi.list(1, 100))

  // SWR for Summary
  const { 
    data: summaryRes, 
    isLoading: isSummaryLoading, 
    mutate: mutateSummary 
  } = useSWR("nesteggs-summary", () => nestEggsApi.balanceSummary())

  const eggs = eggsRes?.data?.nestEggs ?? []
  const summary = summaryRes?.data || null
  const isLoading = isEggsLoading || isSummaryLoading

  const mutate = () => Promise.all([mutateEggs(), mutateSummary()])

  const handleCreated = () => {
    mutate()
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">My Savings Goals</h2>
              {!isLoading && (
                <p className="text-sm text-muted-foreground">
                  {eggs.length} goal{eggs.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50 shadow-sm">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    viewMode === "grid" 
                      ? "bg-card text-primary shadow-md ring-1 ring-black/5" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={cn(
                    "p-2 rounded-lg transition-all duration-200",
                    viewMode === "table" 
                      ? "bg-card text-primary shadow-md ring-1 ring-black/5" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                size="sm"
                className="gap-2 text-foreground h-10 px-5 rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-95"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="font-bold">New Goal</span>
              </Button>
            </div>
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

          {/* Goal content */}
          {isLoading ? (       
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[180px] rounded-2xl" />
              ))}
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
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-500">
                  {filtered.map((egg, i) => (
                    <GoalCard
                      key={egg.id}
                      egg={egg}
                      variant={i % 2 === 1 ? "dark" : "light"}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border bg-card animate-in fade-in duration-500">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Goal Name</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Balance</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-medium">
                      {filtered.map((egg) => {
                        const progress = egg.progress
                        return (
                          <tr key={egg.id} className="hover:bg-muted/30 border-b last:border-0 transition-colors">
                            <td className="p-4">
                              <div className="flex flex-col">
                                <span className="font-bold">{egg.title}</span>
                                <span className="text-xs text-muted-foreground line-clamp-1">{egg.startDate}</span>
                              </div>
                            </td>
                            <td className="p-4">{formatCurrency(egg.targetAmount)}</td>
                            <td className="p-4">{formatCurrency(egg.savedAmount)}</td>
                            <td className="p-4 w-[150px]">
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-primary rounded-full" 
                                    style={{ width: `${progress}%` }} 
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter",
                                egg.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                              )}>
                                {egg.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <Button variant="ghost" size="sm" className="h-8 font-bold" asChild>
                                <Link href={`/savings/eggs/${egg.id}`}>Manage</Link>
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
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
