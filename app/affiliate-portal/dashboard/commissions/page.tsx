// app/affiliate-portal/dashboard/commissions/page.tsx
'use client';
import useSWR from 'swr';
import { affiliateApi } from '@/lib/affiliate-api';
import { AffiliateStatusBadge } from '@/components/affiliate/AffiliateStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function CommissionsPage() {
  const { data, isLoading } = useSWR('affiliate/commissions', () => affiliateApi.getCommissions());
  const commissions = data?.data?.commissions ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Commission History</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : commissions.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No commissions yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-5 py-3 text-left">Amount</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Earned on</th>
                <th className="px-5 py-3 text-left">Available from</th>
                <th className="px-5 py-3 text-left">Paid on</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-bold tabular-nums text-foreground">
                    {formatNaira(c.amount)}
                  </td>
                  <td className="px-5 py-3">
                    <AffiliateStatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {format(new Date(c.pendingSince), 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {format(new Date(c.availableAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {c.paidAt ? format(new Date(c.paidAt), 'dd MMM yyyy') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
