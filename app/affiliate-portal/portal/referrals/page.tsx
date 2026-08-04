// app/affiliate-portal/portal/referrals/page.tsx
"use client"
import { useState } from "react"
import useSWR from "swr"
import { affiliateApi } from "@/lib/affiliate-api"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, TrendingUp, CheckCircle2, Clock, Info } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { RefreshButton } from "@/components/affiliate/RefreshButton"

const fmt = (n: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n)

export default function ReferralsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading, isValidating, mutate } = useSWR(
    `affiliate/referrals/${page}`,
    () => affiliateApi.getReferrals(page)
  )

  const referrals = data?.data?.referrals ?? []
  const total = data?.data?.total ?? 0

  const qualified = referrals.filter((r) => r.qualified).length
  const pending = referrals.filter((r) => !r.qualified).length

  return (
    <div className="w-full space-y-5 px-4 py-6 md:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Your Referrals</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Everyone who signed up using your affiliate link.
          </p>
        </div>
        <RefreshButton
          isRefreshing={isValidating && !isLoading}
          onRefresh={() => mutate()}
        />
      </div>

      {/* How referrals qualify */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex gap-3 p-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="space-y-1.5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">
              How a referral turns into a commission
            </p>
            <ol className="list-inside list-decimal space-y-0.5">
              <li>They sign up using your referral link.</li>
              <li>
                They subscribe to or pay toward a NestBasket plan, payments add
                up over time, they don&apos;t need to hit the minimum in one go.
              </li>
              <li>
                Once the minimum is reached, your commission is created and
                enters a short hold period before it becomes available for
                payout.
              </li>
            </ol>
            <p className="pt-1">
              The <span className="font-medium text-foreground">Status</span>{" "}
              column below tells you how close each referral is to qualifying.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Total",
            value: total,
            icon: Users,
            color: "text-foreground",
          },
          {
            label: "Qualified",
            value: qualified,
            icon: CheckCircle2,
            color: "text-emerald-500",
          },
          {
            label: "Pending",
            value: pending,
            icon: Clock,
            color: "text-amber-500",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-border bg-card">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className={`h-4 w-4 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-foreground tabular-nums">
                  {value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-border bg-card">
        <CardHeader className="space-y-0 border-b border-border px-5 py-4">
          <CardTitle className="text-base font-semibold text-foreground">
            All Referrals
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 rounded" />
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="space-y-3 py-16 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No referrals yet. Share your link to get started!
              </p>
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead className="border-b border-border bg-muted/60 text-xs text-muted-foreground uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left whitespace-nowrap">
                      Person
                    </th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((r) => (
                    <tr
                      key={r.id}
                      className="transition-colors hover:bg-muted/30"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-primary">
                            {r.displayName.charAt(0)}
                          </div>
                          <span className="text-base font-medium text-foreground">
                            {r.displayName}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(r.signedUpAt), {
                          addSuffix: true,
                        })}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            r.qualification.status === "qualified"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400"
                          }`}
                        >
                          {r.qualification.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right font-semibold text-foreground tabular-nums">
                        {r.commission
                          ? fmt(r.commission.amount)
                          : "No commission"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.commission ? (
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              r.commission.status === "PAID"
                                ? "border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                : "border-primary/30 bg-primary/5 text-primary"
                            }`}
                          >
                            {r.commission.status === "PAID"
                              ? "Paid"
                              : "Available"}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Not available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > 20 && (
                <div className="flex items-center justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
                  <span>
                    Page {page} of {Math.ceil(total / 20)}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="h-8"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * 20 >= total}
                      className="h-8"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
