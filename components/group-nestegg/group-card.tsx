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

export function GroupCard({ group, formatCurrency }: GroupCardProps) {
  const visibleMembers = group.members.slice(0, 3)
  const overflow = Math.max(0, group.memberCount - 3)
  const isUrgent = group.daysRemaining <= 30

  return (
    <Link href={`/savings/group/${group.id}`}>
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]">

        {/* Top row: icon + title */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <CoverIcon name={group.cover} className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground leading-tight line-clamp-2 capitalize">
            {group.title}
          </p>
        </div>

        {/* Progress ring — centered */}
        <div className="flex justify-center">
          <ProgressRing progress={group.progress} size={88} strokeWidth={9} />
        </div>

        {/* Member avatars — centered */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center">
            {visibleMembers.map((m, i) => (
              <div
                key={m.profileId}
                className="w-7 h-7 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center text-[11px] font-semibold text-primary -ml-2 first:ml-0"
                style={{ zIndex: visibleMembers.length - i }}
              >
                {(m.profile.fullName ?? "?").charAt(0).toUpperCase()}
              </div>
            ))}
            {overflow > 0 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground -ml-2">
                +{overflow}
              </div>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {group.memberCount}/{group.maxMembers} members
          </p>
        </div>

        {/* Amounts + days */}
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
