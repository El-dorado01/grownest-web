// components/affiliate/AffiliateStatusBadge.tsx
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import type { AffiliateStatus, CommissionStatus } from '@/types/affiliate';
import { cn } from '@/lib/utils';

type Status = AffiliateStatus | CommissionStatus;

const CONFIG: Record<Status, { label: string; icon: React.ElementType; className: string }> = {
  PENDING:   { label: 'Pending',   icon: Clock,        className: 'bg-amber-100 text-amber-800 border-amber-200' },
  ACTIVE:    { label: 'Active',    icon: CheckCircle,  className: 'bg-green-100 text-green-800 border-green-200' },
  SUSPENDED: { label: 'Suspended', icon: XCircle,      className: 'bg-red-100 text-red-800 border-red-200' },
  REJECTED:  { label: 'Rejected',  icon: XCircle,      className: 'bg-red-100 text-red-800 border-red-200' },
  AVAILABLE: { label: 'Available', icon: CheckCircle,  className: 'bg-green-100 text-green-800 border-green-200' },
  PAID:      { label: 'Paid',      icon: CheckCircle,  className: 'bg-muted text-muted-foreground border-border' },
  REVERSED:  { label: 'Reversed',  icon: XCircle,      className: 'bg-red-100 text-red-800 border-red-200' },
};

export const AffiliateStatusBadge = ({ status }: { status: Status }) => {
  const cfg = CONFIG[status] ?? CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border', cfg.className)}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {cfg.label}
    </span>
  );
};
