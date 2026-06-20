// app/affiliate-portal/dashboard/referrals/page.tsx
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { affiliateApi } from '@/lib/affiliate-api';
import { AffiliateStatusBadge } from '@/components/affiliate/AffiliateStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function ReferralsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useSWR(`affiliate/referrals/${page}`, () => affiliateApi.getReferrals(page));
  const referrals = data?.data?.referrals ?? [];
  const total = data?.data?.total ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Your Referrals</h1>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No referrals yet — share your link!
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Signed up</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-right">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrals.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3 font-medium text-foreground">{r.displayName}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(r.signedUpAt), { addSuffix: true })}
                    </td>
                    <td className="px-5 py-3">
                      <AffiliateStatusBadge status={r.qualified ? 'ACTIVE' : 'PENDING'} />
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">
                      {r.commission ? formatNaira(r.commission.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > 20 && (
              <div className="flex justify-between items-center px-5 py-3 border-t border-border text-sm text-muted-foreground">
                <span>Page {page} of {Math.ceil(total / 20)}</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="min-h-[36px]">Previous</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page * 20 >= total} className="min-h-[36px]">Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
