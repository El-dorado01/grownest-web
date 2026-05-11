"use client"

import * as React from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import {
  ClockIcon, TrendingUpIcon, TrendingDownIcon, Search, ArrowDownIcon,
  SendIcon, Download, ChevronDown, X, Calendar, Loader2, CreditCard,
  RefreshCw, Filter, Copy, CheckCircle2, ArrowUpRight, Building2,
} from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { nestPurseApi } from "@/lib/nestpurse-api"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import type { DateRange } from "react-day-picker"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { ErrorState } from "@/components/error-state"
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription,
} from "@/components/ui/drawer"

const PAGE_LIMIT = 20

type Transaction = {
  id: string
  type: "credit" | "debit"
  amount: number
  status: string
  method: string
  reference: string
  date: string
  senderName?: string
  senderBankName?: string
  senderAccountNumber?: string
  narration?: string
}

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  send_money: "Send Money",
  withdrawal: "Withdrawal",
  card: "Card Top-up",
  topup: "Top-up",
}

const TYPE_COLORS = {
  credit: "text-emerald-500",
  debit: "text-foreground",
}

const STATUS_STYLES: Record<string, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

function getIcon(tx: Transaction) {
  if (tx.type === "credit") return <TrendingUpIcon className="h-4 w-4 text-emerald-500" />
  if (tx.method === "withdrawal") return <ArrowDownIcon className="h-4 w-4 text-red-500" />
  if (tx.method === "send_money" || tx.method === "bank_transfer") return <SendIcon className="h-4 w-4 text-blue-500" />
  if (tx.method === "card") return <CreditCard className="h-4 w-4 text-purple-500" />
  return <TrendingDownIcon className="h-4 w-4 text-red-500" />
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount)
}

function exportToCSV(transactions: Transaction[]) {
  const headers = ["Date", "Narration", "Type", "Method", "Amount (NGN)", "Status", "Reference"]
  const rows = transactions.map(tx => [
    format(new Date(tx.date), "yyyy-MM-dd HH:mm"),
    tx.narration || tx.method || "Transaction",
    tx.type,
    METHOD_LABELS[tx.method] || tx.method,
    tx.amount.toFixed(2),
    tx.status,
    tx.reference,
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `nestpurse-transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Transaction Detail ────────────────────────────────────────────────────
function DetailRow({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  const [copied, setCopied] = React.useState(false)
  if (!value) return null
  const copy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 w-36">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0 text-right">
        <span className={cn("text-sm font-medium break-all", mono && "font-mono text-xs")}>{value}</span>
        {mono && (
          <button onClick={copy} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}

function TransactionDetailContent({ tx }: { tx: Transaction }) {
  const isCredit = tx.type === "credit"
  return (
    <div className="space-y-4">
      {/* Amount hero */}
      <div className="flex flex-col items-center gap-2 py-4">
        <div className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center",
          isCredit ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-red-100 dark:bg-red-900/30"
        )}>
          {isCredit
            ? <ArrowUpRight className="h-7 w-7 text-emerald-600" />
            : tx.method === "withdrawal"
              ? <ArrowDownIcon className="h-7 w-7 text-red-500" />
              : <SendIcon className="h-7 w-7 text-blue-500" />
          }
        </div>
        <p className={cn("text-3xl font-bold tabular-nums", isCredit ? "text-emerald-500" : "text-foreground")}>
          {isCredit ? "+" : "−"}{new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(tx.amount)}
        </p>
        <span className={cn("text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full", STATUS_STYLES[tx.status] || STATUS_STYLES.pending)}>
          {tx.status}
        </span>
      </div>

      {/* Details */}
      <div className="rounded-xl border bg-muted/20 px-4">
        <DetailRow label="Type" value={tx.type === "credit" ? "Credit (Inflow)" : "Debit (Outflow)"} />
        <DetailRow label="Method" value={METHOD_LABELS[tx.method] || tx.method} />
        <DetailRow label="Narration" value={tx.narration} />
        <DetailRow label="Date" value={format(new Date(tx.date), "MMMM dd, yyyy")} />
        <DetailRow label="Time" value={format(new Date(tx.date), "hh:mm:ss a")} />
        <DetailRow label="Reference" value={tx.reference} mono />
      </div>

      {(tx.senderName || tx.senderBankName || tx.senderAccountNumber) && (
        <div className="rounded-xl border bg-muted/20 px-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pt-3 pb-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Sender Info
          </p>
          <DetailRow label="Sender Name" value={tx.senderName} />
          <DetailRow label="Bank" value={tx.senderBankName} />
          <DetailRow label="Account No." value={tx.senderAccountNumber} mono />
        </div>
      )}
    </div>
  )
}

function TransactionDetail({ tx, onClose }: { tx: Transaction | null; onClose: () => void }) {
  const isMobile = useIsMobile()
  const open = !!tx

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && onClose()}>
        <DrawerContent className="px-4 pb-8 max-h-[70vh]">
          <DrawerHeader className="px-0 mb-2">
            <DrawerTitle className="text-xl font-bold">Transaction Details</DrawerTitle>
            <DrawerDescription>Full breakdown of this transaction</DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto">{tx && <TransactionDetailContent tx={tx} />}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden rounded-[2rem]">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">Transaction Details</DialogTitle>
          <DialogDescription>Full breakdown of this transaction</DialogDescription>
        </DialogHeader>
        <div className="p-6 pt-2 overflow-y-auto max-h-[75vh]">{tx && <TransactionDetailContent tx={tx} />}</div>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = React.useState<Transaction[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isLoadingMore, setIsLoadingMore] = React.useState(false)
  const [hasMore, setHasMore] = React.useState(false)
  const [nextCursor, setNextCursor] = React.useState<string | undefined>()
  const [error, setError] = React.useState(false)
  const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

  // Filters
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<Set<string>>(new Set())
  const [methodFilter, setMethodFilter] = React.useState<Set<string>>(new Set())
  const [statusFilter, setStatusFilter] = React.useState<Set<string>>(new Set())
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>()
  const [calendarOpen, setCalendarOpen] = React.useState(false)

  const loadTransactions = React.useCallback(async (cursor?: string) => {
    const isInitial = !cursor
    if (isInitial) setIsLoading(true)
    else setIsLoadingMore(true)
    setError(false)

    try {
      const params: any = { limit: PAGE_LIMIT }
      if (cursor) params.cursor = cursor
      if (dateRange?.from) params.startDate = startOfDay(dateRange.from).toISOString()
      if (dateRange?.to) params.endDate = endOfDay(dateRange.to).toISOString()

      const res = await nestPurseApi.getTransactions(params)
      if (res.error) { setError(true); return }

      const txs = res.data?.transactions || []
      setTransactions(prev => isInitial ? txs : [...prev, ...txs])
      setHasMore(res.data?.pagination.hasMore || false)
      setNextCursor(res.data?.pagination.nextCursor)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [dateRange])

  React.useEffect(() => { loadTransactions() }, [loadTransactions])

  // Client-side filtering
  const filtered = React.useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter.size > 0 && !typeFilter.has(tx.type)) return false
      if (methodFilter.size > 0 && !methodFilter.has(tx.method)) return false
      if (statusFilter.size > 0 && !statusFilter.has(tx.status)) return false
      if (search) {
        const q = search.toLowerCase()
        const match = (tx.narration || "").toLowerCase().includes(q) ||
          (tx.reference || "").toLowerCase().includes(q) ||
          (tx.method || "").toLowerCase().includes(q) ||
          (tx.senderName || "").toLowerCase().includes(q) ||
          (METHOD_LABELS[tx.method] || "").toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [transactions, typeFilter, methodFilter, statusFilter, search])

  const hasActiveFilters = typeFilter.size > 0 || methodFilter.size > 0 || statusFilter.size > 0 || !!dateRange

  function clearFilters() {
    setTypeFilter(new Set())
    setMethodFilter(new Set())
    setStatusFilter(new Set())
    setDateRange(undefined)
    setSearch("")
  }

  function toggleSet(set: Set<string>, val: string): Set<string> {
    const next = new Set(set)
    next.has(val) ? next.delete(val) : next.add(val)
    return next
  }

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
                <BreadcrumbItem><BreadcrumbLink href="/nestpurse">NestPurse</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Transactions</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading ? "Loading…" : `${filtered.length} transaction${filtered.length !== 1 ? "s" : ""}${transactions.length > filtered.length ? ` (filtered from ${transactions.length})` : ""}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg h-9"
                onClick={() => loadTransactions()}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                size="sm"
                className="rounded-lg h-9"
                onClick={() => {
                  if (filtered.length === 0) { toast.error("No transactions to export"); return }
                  exportToCSV(filtered)
                  toast.success(`Exported ${filtered.length} transactions`)
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by narration, reference, sender…"
                className="pl-9 h-9 rounded-lg text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Type */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("rounded-lg h-9 gap-1.5", typeFilter.size > 0 && "border-primary text-primary")}>
                  <Filter className="h-3.5 w-3.5" />
                  Type {typeFilter.size > 0 && `(${typeFilter.size})`}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {["credit", "debit"].map(v => (
                  <DropdownMenuCheckboxItem key={v} checked={typeFilter.has(v)} onCheckedChange={() => setTypeFilter(toggleSet(typeFilter, v))} className="capitalize">{v}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Method */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("rounded-lg h-9 gap-1.5", methodFilter.size > 0 && "border-primary text-primary")}>
                  Method {methodFilter.size > 0 && `(${methodFilter.size})`}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {Object.entries(METHOD_LABELS).map(([k, v]) => (
                  <DropdownMenuCheckboxItem key={k} checked={methodFilter.has(k)} onCheckedChange={() => setMethodFilter(toggleSet(methodFilter, k))}>{v}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className={cn("rounded-lg h-9 gap-1.5", statusFilter.size > 0 && "border-primary text-primary")}>
                  Status {statusFilter.size > 0 && `(${statusFilter.size})`}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {["success", "pending", "failed"].map(v => (
                  <DropdownMenuCheckboxItem key={v} checked={statusFilter.has(v)} onCheckedChange={() => setStatusFilter(toggleSet(statusFilter, v))} className="capitalize">{v}</DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Date Range */}
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("rounded-lg h-9 gap-1.5", dateRange && "border-primary text-primary")}>
                  <Calendar className="h-3.5 w-3.5" />
                  {dateRange?.from ? (
                    dateRange.to
                      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                      : format(dateRange.from, "MMM d, yyyy")
                  ) : "Date Range"}
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                  disabled={{ after: new Date() }}
                />
                <div className="flex gap-2 p-3 border-t">
                  <Button size="sm" className="flex-1 rounded-lg" onClick={() => { setCalendarOpen(false); loadTransactions() }}>Apply</Button>
                  <Button size="sm" variant="outline" className="rounded-lg" onClick={() => { setDateRange(undefined); setCalendarOpen(false) }}>Clear</Button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Clear all */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="rounded-lg h-9 text-muted-foreground" onClick={clearFilters}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
          </div>

          {/* Table */}
          <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1.2fr_auto] gap-4 px-4 py-2.5 border-b bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Transaction</span>
              <span>Method</span>
              <span>Date</span>
              <span className="text-right">Amount</span>
              <span>Status</span>
            </div>

            {isLoading ? (
              <div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-40" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="py-20">
                <ErrorState
                  title="Couldn't load transactions"
                  message="We ran into an issue while fetching your transaction history."
                  onRetry={() => loadTransactions()}
                />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-3 text-center">
                <ClockIcon className="h-12 w-12 text-muted-foreground/10" />
                <div>
                  <p className="font-semibold text-muted-foreground">No transactions found</p>
                  <p className="text-sm text-muted-foreground/60 mt-0.5 max-w-xs">Try adjusting your search or filters.</p>
                </div>
                {hasActiveFilters && <Button variant="outline" size="sm" className="rounded-lg mt-2" onClick={clearFilters}>Clear filters</Button>}
              </div>
            ) : (
              <div>
                {filtered.map((tx, idx) => (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={cn(
                      "grid grid-cols-[auto_1fr_auto] md:grid-cols-[2fr_1fr_1fr_1.2fr_auto] items-center gap-3 md:gap-4 px-4 py-3.5 transition-colors hover:bg-muted/30 cursor-pointer",
                      idx < filtered.length - 1 && "border-b"
                    )}
                  >
                    {/* Icon + Narration */}
                    <div className="flex items-center gap-3 min-w-0 col-span-2 md:col-span-1">
                      <div className="h-8 w-8 shrink-0 rounded-full bg-muted/50 flex items-center justify-center">
                        {getIcon(tx)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate capitalize">
                          {tx.narration || METHOD_LABELS[tx.method] || "Transaction"}
                        </p>
                        <p className="text-xs text-muted-foreground truncate font-mono">{tx.reference}</p>
                      </div>
                    </div>

                    {/* Method badge */}
                    <div className="hidden md:block">
                      <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">
                        {METHOD_LABELS[tx.method] || tx.method}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden md:block">
                      <p className="text-xs text-muted-foreground">{format(new Date(tx.date), "MMM dd, yyyy")}</p>
                      <p className="text-[11px] text-muted-foreground/60">{format(new Date(tx.date), "hh:mm a")}</p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={cn("text-sm font-bold tabular-nums", TYPE_COLORS[tx.type])}>
                        {tx.type === "credit" ? "+" : "−"}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[10px] text-muted-foreground md:hidden">{format(new Date(tx.date), "MMM dd")}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={cn("text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full", STATUS_STYLES[tx.status] || STATUS_STYLES.pending)}>
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && !isLoading && !error && (
            <div className="flex justify-center pt-2 pb-4">
              <Button
                variant="outline"
                className="rounded-xl px-8"
                onClick={() => loadTransactions(nextCursor)}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {isLoadingMore ? "Loading…" : "Load more transactions"}
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
      <TransactionDetail tx={selectedTx} onClose={() => setSelectedTx(null)} />
    </SidebarProvider>
  )
}
