// app/affiliate-portal/dashboard/referrals/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { affiliateApi } from '@/lib/affiliate-api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, CheckCircle2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshButton } from '@/components/affiliate/RefreshButton';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);


export default function ReferralsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isValidating, mutate } = useSWR(`affiliate/referrals/${page}`, () => affiliateApi.getReferrals(page));

  const referrals = data?.data?.referrals ?? [];
  const total     = data?.data?.total     ?? 0;

  const qualified  = referrals.filter(r => r.qualified).length;
  const pending    = referrals.filter(r => !r.qualified).length;

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Your Referrals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Everyone who signed up using your affiliate link.</p>
        </div>
        <RefreshButton isRefreshing={isValidating && !isLoading} onRefresh={() => mutate()} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',      value: total,     icon: Users,        color: 'text-foreground' },
          { label: 'Qualified',  value: qualified,  icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending',    value: pending,    icon: Clock,        color: 'text-amber-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`w-4 h-4 shrink-0 ${color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="px-5 py-4 border-b border-border space-y-0">
          <CardTitle className="text-sm font-semibold text-foreground">All Referrals</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No referrals yet — share your link to get started!</p>
            </div>
          ) : (
            <>
              <table className="min-w-full text-sm">
                <thead className="bg-muted/60 text-xs text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="px-5 py-3 text-left whitespace-nowrap">Person</th>
                    <th className="px-5 py-3 text-left">Joined</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                    <th className="px-5 py-3 text-right">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {referrals.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {r.displayName.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground">{r.displayName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(r.signedUpAt), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-xs ${
                          r.qualified
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                            : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {r.qualified ? 'Qualified' : 'Pending deposit'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-semibold text-foreground">
                        {r.commission ? fmt(r.commission.amount) : '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {r.commission ? (
                          <Badge variant="outline" className={`text-xs ${
                            r.commission.status === 'PAID'
                              ? 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              : 'border-primary/30 bg-primary/5 text-primary'
                          }`}>
                            {r.commission.status === 'PAID' ? 'Paid' : 'Available'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {total > 20 && (
                <div className="flex justify-between items-center px-5 py-3 border-t border-border text-sm text-muted-foreground">
                  <span>Page {page} of {Math.ceil(total / 20)}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8">Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 20 >= total} className="h-8">Next</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
