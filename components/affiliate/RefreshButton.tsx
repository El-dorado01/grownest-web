'use client';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RefreshButtonProps {
  isRefreshing: boolean;
  onRefresh: () => void;
  label?: string;
  className?: string;
}

export function RefreshButton({ isRefreshing, onRefresh, label, className }: RefreshButtonProps) {
  return (
    <button
      onClick={onRefresh}
      disabled={isRefreshing}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 min-h-[32px]',
        isRefreshing
          ? 'border-primary/40 bg-primary/5 text-primary cursor-not-allowed'
          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5',
        className
      )}
      aria-label={isRefreshing ? 'Refreshing data…' : 'Refresh data'}
    >
      <RefreshCw className={cn('w-3.5 h-3.5 transition-transform', isRefreshing && 'animate-spin')} />
      {label && <span>{isRefreshing ? 'Refreshing…' : label}</span>}
    </button>
  );
}
