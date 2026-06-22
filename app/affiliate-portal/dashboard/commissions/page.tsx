// app/affiliate-portal/dashboard/commissions/page.tsx
'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { affiliateApi } from '@/lib/affiliate-api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Banknote, Clock, CheckCircle2, Receipt } from 'lucide-react';
import { format } from 'date-fns';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

// ── MOCK DATA ─────────────────────────────────────────────────────────────────
// ── END MOCK ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING:   { label: 'Pending',   className: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400' },
  AVAILABLE: { label: 'Available', className: 'border-primary/40 bg-primary/5 text-primary' },
  PAID:      { label: 'Paid',      className: 'border-slate-300 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400' },
  REVERSED:  { label: 'Reversed',  className: 'border-red-300 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400' },
};

const [filterOptions] = [['all', 'Pending', 'Available', 'Paid', 'Reversed']];

export default function CommissionsPage() {
  const [filter, setFilter] = useState('all');
  const { data, isLoading } = useSWR('affiliate/commissions', () => affiliateApi.getCommissions());

  const allCommissions = data?.data?.commissions ?? [];
  const commissions = filter === 'all'
    ? allCommissions
    : allCommissions.filter(c => c.status === filter.toUpperCase());

  // Summaries
  const totalEarned   = allCommissions.reduce((s, c) => s + c.amount, 0);
  const available     = allCommissions.filter(c => c.status === 'AVAILABLE').reduce((s, c) => s + c.amount, 0);
  const pending       = allCommissions.filter(c => c.status === 'PENDING').reduce((s, c) => s + c.amount, 0);
  const paid          = allCommissions.filter(c => c.status === 'PAID').reduce((s, c) => s + c.amount, 0);

  return (
    <div className="w-full px-4 md:px-6 py-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-foreground">Commission History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">A record of every commission you've earned.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Earned', value: totalEarned, icon: Banknote,    accent: 'text-foreground' },
          { label: 'Available',    value: available,   icon: CheckCircle2, accent: 'text-primary' },
          { label: 'Pending',      value: pending,     icon: Clock,        accent: 'text-amber-500' },
          { label: 'Paid Out',     value: paid,        icon: Receipt,      accent: 'text-slate-500' },
        ].map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                <Icon className={`w-3.5 h-3.5 ${accent}`} />
              </div>
              <p className={`text-xl font-bold tabular-nums ${accent}`}>{fmt(value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 min-h-[32px] ${
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
            }`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-5 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 rounded" />)}
            </div>
          ) : commissions.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No commissions match this filter.</div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-xs text-muted-foreground uppercase border-b border-border">
                <tr>
                  <th className="px-5 py-3 text-right whitespace-nowrap">Amount</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Earned</th>
                  <th className="px-5 py-3 text-left">Available from</th>
                  <th className="px-5 py-3 text-left">Paid on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {commissions.map((c) => {
                  const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.PENDING;
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-3 font-bold tabular-nums text-foreground text-right">
                        {fmt(c.amount)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="outline" className={`text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {format(new Date(c.pendingSince), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {format(new Date(c.availableAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground text-xs">
                        {c.paidAt ? format(new Date(c.paidAt), 'dd MMM yyyy') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
