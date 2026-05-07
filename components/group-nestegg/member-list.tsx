// components/group-nestegg/member-list.tsx
"use client"

import { ZapIcon, CrownIcon } from "lucide-react"
import type { GroupMember } from "@/types/group-nestegg"

interface MemberListProps {
  members: GroupMember[]
  formatCurrency: (n: number) => string
  currentUserId?: string
}

export function MemberList({ members, formatCurrency, currentUserId }: MemberListProps) {
  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">No members yet.</p>
  }

  return (
    <div className="flex flex-col">
      {members.map((member) => {
        const initials = (member.fullName ?? member.email)
          .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
        const isYou = member.profileId === currentUserId

        return (
          <div key={member.id} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary overflow-hidden">
                {member.profilePhoto ? (
                  <img src={member.profilePhoto} alt={member.fullName ?? ""} className="w-full h-full object-cover" />
                ) : initials}
              </div>
              {/* Auto-save badge */}
              {member.isAutoSaveEnabled && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <ZapIcon className="w-2.5 h-2.5 text-primary-foreground" />
                </div>
              )}
            </div>

            {/* Name + role */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-medium truncate">
                  {member.fullName ?? member.email}
                  {isYou && <span className="text-xs text-muted-foreground ml-1">(you)</span>}
                </p>
                {member.role === "owner" && (
                  <CrownIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {member.role}
                {member.isAutoSaveEnabled && !member.isAutoSavePaused && (
                  <span className="ml-2 text-primary">· Auto-save on</span>
                )}
                {member.isAutoSaveEnabled && member.isAutoSavePaused && (
                  <span className="ml-2 text-amber-600">· Auto-save paused</span>
                )}
              </p>
            </div>

            {/* Total contributed */}
            <p className="text-sm font-bold tabular-nums shrink-0">
              {formatCurrency(member.totalContributed)}
            </p>
          </div>
        )
      })}
    </div>
  )
}
