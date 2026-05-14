// components/group-nestegg/group-card.tsx
"use client"

import Link from "next/link"
import { ProgressRing } from "@/components/nesteggs/progress-ring"
import { CoverIcon } from "@/components/nesteggs/cover-icon"
import type { GroupListItem } from "@/types/group-nestegg"

interface GroupCardProps {
  group: GroupListItem
  formatCurrency: (n: number) => string
}

function MemberAvatars({ group }: { group: GroupListItem }) {
  const visibleMembers = group.members.slice(0, 3)
  const overflow = Math.max(0, group.memberCount - 3)
  return (
    <div className="flex items-center">
      {visibleMembers.map((m, i) => (
        <div
          key={m.profileId}
          className="w-6 h-6 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[10px] font-semibold text-primary -ml-1.5 first:ml-0"
          style={{ zIndex: visibleMembers.length - i }}
        >
          {(m.profile.fullName ?? "?").charAt(0).toUpperCase()}
        </div>
      ))}
      {overflow > 0 && (
        <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-bold text-muted-foreground -ml-1.5">
          +{overflow}
        </div>
      )}
    </div>
  )
}

export function GroupCard({ group, formatCurrency }: GroupCardProps) {
  const isUrgent = group.daysRemaining <= 30

  return (
    <Link href={`/savings/group/${group.id}`}>
      {/* Mobile: horizontal list row */}
      <div className="sm:hidden bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 cursor-pointer transition-transform active:scale-[0.98]">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <CoverIcon name={group.cover} className="w-5 h-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p className="text-sm font-bold text-foreground capitalize leading-tight truncate">
            {group.title}
          </p>
          <div className="h-1.5 rounded-full w-full bg-border">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(group.progress, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <MemberAvatars group={group} />
              <span className="text-[10px] text-muted-foreground">{group.memberCount}/{group.maxMembers}</span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isUrgent ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            }`}>
              {group.daysRemaining}d left
            </span>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-primary">{group.progress}%</p>
        </div>
      </div>

      {/* sm+: grid card */}
      <div className="hidden sm:flex bg-card border border-border rounded-2xl p-4 flex-col gap-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CoverIcon name={group.cover} className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 capitalize">
            {group.title}
          </p>
        </div>

        <div className="flex justify-center">
          <ProgressRing progress={group.progress} size={80} strokeWidth={8} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <MemberAvatars group={group} />
          <p className="text-[10px] text-muted-foreground">{group.memberCount}/{group.maxMembers} members</p>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-xs font-bold text-primary text-center">
            {formatCurrency(group.savedAmount)}
            <span className="text-muted-foreground font-normal"> / {formatCurrency(group.targetAmount)}</span>
          </p>
          <div className="flex justify-center">
            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
              isUrgent ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
            }`}>
              {group.daysRemaining}d left
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
