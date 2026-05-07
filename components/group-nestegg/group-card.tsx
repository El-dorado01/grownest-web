// components/group-nestegg/group-card.tsx
"use client"

import Link from "next/link"
import { ProgressRing } from "@/components/nesteggs/progress-ring"
import type { GroupListItem } from "@/types/group-nestegg"

interface GroupCardProps {
  group: GroupListItem
  formatCurrency: (n: number) => string
}

export function GroupCard({ group, formatCurrency }: GroupCardProps) {
  const visibleMembers = group.members.slice(0, 3)
  const overflow = Math.max(0, group.memberCount - 3)
  const isUrgent = group.daysRemaining <= 30

  return (
    <Link href={`/savings/group/${group.id}`}>
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">
        {/* Title */}
        <p className="text-sm font-bold text-foreground leading-tight line-clamp-2">
          {group.cover && <span className="mr-1.5">{group.cover}</span>}
          {group.title}
        </p>

        {/* Ring + Avatars row */}
        <div className="flex items-center justify-between gap-3">
          <ProgressRing progress={group.progress} size={88} strokeWidth={9} />

          {/* Stacked member avatars */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center">
              {visibleMembers.map((m, i) => (
                <div
                  key={m.profileId}
                  className="w-8 h-8 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-xs font-semibold text-primary -ml-2 first:ml-0"
                  style={{ zIndex: visibleMembers.length - i }}
                >
                  {(m.profile.fullName ?? "?").charAt(0).toUpperCase()}
                </div>
              ))}
              {overflow > 0 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground -ml-2">
                  +{overflow}
                </div>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {group.memberCount}/{group.maxMembers} members
            </p>
          </div>
        </div>

        {/* Amounts + days */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-primary">
            {formatCurrency(group.savedAmount)}{" "}
            <span className="text-muted-foreground font-normal">/ {formatCurrency(group.targetAmount)}</span>
          </p>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isUrgent
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}>
            {group.daysRemaining}d left
          </span>
        </div>
      </div>
    </Link>
  )
}
