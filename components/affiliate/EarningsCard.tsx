// components/affiliate/EarningsCard.tsx
import { Skeleton } from '@/components/ui/skeleton';

interface EarningsCardProps {
  label: string;
  value: number | null;
  isLoading?: boolean;
  highlight?: boolean;
}

const formatNaira = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export const EarningsCard = ({ label, value, isLoading, highlight }: EarningsCardProps) => (
  <div className={`rounded-xl border p-4 flex flex-col gap-1 ${highlight ? 'border-primary bg-accent/50' : 'bg-white'}`}>
    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
    {isLoading || value === null ? (
      <Skeleton className="h-8 w-28 mt-1" />
    ) : (
      <p className="text-2xl font-bold tabular-nums text-gray-900">{formatNaira(value)}</p>
    )}
  </div>
);
