// app/affiliate-portal/dashboard/page.tsx
'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { affiliateApi } from '@/lib/affiliate-api';
import { EarningsCard } from '@/components/affiliate/EarningsCard';
import { ReferralTools } from '@/components/affiliate/ReferralTools';
import { AffiliateStatusBadge } from '@/components/affiliate/AffiliateStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function AffiliateDashboardPage() {
  const { data: meData, isLoading: meLoading } = useSWR('affiliate/me', () => affiliateApi.getMe());
  const { data: summaryData, isLoading: summaryLoading } = useSWR(
    'affiliate/earnings-summary',
    () => affiliateApi.getEarningsSummary()
  );
  const { data: referralsData } = useSWR('affiliate/referrals/1', () => affiliateApi.getReferrals(1));

  const affiliate = meData?.data?.affiliate;
  const summary = summaryData?.data;
  const isPending = affiliate?.status === 'PENDING';

  if (meLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-4">No affiliate account found.</p>
        <Button asChild className="min-h-[44px]">
          <Link href="/apply">Apply now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Affiliate Dashboard</h1>
        <AffiliateStatusBadge status={affiliate.status} />
      </div>

      {isPending && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">Application under review</p>
          <p className="text-sm text-amber-700 mt-1">
            Our team is reviewing your application. You will be notified within 48 hours.
          </p>
        </div>
      )}

      {!isPending && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <EarningsCard label="Total Earned" value={summary?.totalEarned ?? null} isLoading={summaryLoading} />
            <EarningsCard label="Available" value={summary?.available ?? null} isLoading={summaryLoading} highlight />
            <EarningsCard label="Pending" value={summary?.pending ?? null} isLoading={summaryLoading} />
            <div className="rounded-xl border bg-white p-4 flex flex-col gap-1">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Next Payout</p>
              {summaryLoading ? (
                <Skeleton className="h-6 w-24 mt-1" />
              ) : (
                <p className="text-sm font-semibold text-gray-700 mt-1">
                  {summary?.nextPayoutDate
                    ? new Date(summary.nextPayoutDate).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white p-5 space-y-3">
              <p className="text-sm font-semibold text-gray-900">Performance</p>
              {[
                { label: 'Total Signups', value: summary?.totalReferrals ?? 0 },
                { label: 'Qualified Deposits', value: summary?.qualifiedReferrals ?? 0 },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="font-bold tabular-nums text-gray-900">{value}</span>
                </div>
              ))}
            </div>
            {affiliate.campaign && (
              <div className="rounded-xl border bg-white p-5 space-y-2">
                <p className="text-sm font-semibold text-gray-900">Active Campaign</p>
                <p className="text-base font-bold text-primary">{affiliate.campaign.name}</p>
                <p className="text-sm text-gray-600">
                  Commission:{' '}
                  {affiliate.campaign.commissionType === 'FIXED'
                    ? formatNaira(affiliate.campaign.commissionValue)
                    : `${affiliate.campaign.commissionValue}%`}{' '}
                  per qualified deposit
                </p>
                <p className="text-xs text-gray-400">
                  Min deposit: {formatNaira(affiliate.campaign.minDepositAmount)} · Hold:{' '}
                  {affiliate.campaign.holdDays} days
                </p>
              </div>
            )}
          </div>

          <ReferralTools affiliateCode={affiliate.affiliateCode} />

          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <p className="font-semibold text-gray-900">Recent Referrals</p>
              <Link
                href="/dashboard/referrals"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {!referralsData?.data?.referrals || referralsData.data.referrals.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                No referrals yet — share your link to get started!
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Signed up</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {referralsData.data.referrals.slice(0, 5).map((r) => (
                    <tr key={r.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{r.displayName}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {formatDistanceToNow(new Date(r.signedUpAt), { addSuffix: true })}
                      </td>
                      <td className="px-5 py-3">
                        <AffiliateStatusBadge status={r.qualified ? 'AVAILABLE' : 'PENDING'} />
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums font-medium">
                        {r.commission ? formatNaira(r.commission.amount) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="text-center">
            <Link href="/dashboard/commissions" className="text-sm text-primary hover:underline">
              View full commission history →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
