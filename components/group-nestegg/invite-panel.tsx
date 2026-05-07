// components/group-nestegg/invite-panel.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, MailIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { format } from "date-fns"
import type { PendingInvite } from "@/types/group-nestegg"

interface InvitePanelProps {
  groupId: string
  groupTitle: string
}

export function InvitePanel({ groupId, groupTitle }: InvitePanelProps) {
  const [email, setEmail] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [pending, setPending] = useState<PendingInvite[]>([])
  const [isLoadingInvites, setIsLoadingInvites] = useState(true)

  const fetchPending = useCallback(async () => {
    const { data } = await groupNestEggApi.pendingInvites(groupId)
    if (data) setPending(data.pendingInvites)
    setIsLoadingInvites(false)
  }, [groupId])

  useEffect(() => { fetchPending() }, [fetchPending])

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) { toast.error("Enter a valid email address"); return }
    setIsSending(true)
    const { error } = await groupNestEggApi.invite({ groupNestEggId: groupId, email: email.trim() })
    setIsSending(false)
    if (error) { toast.error(error); return }
    toast.success(`Invitation sent to ${email}`)
    setEmail("")
    fetchPending()
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
      {/* Invite by email */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold">Invite by email</p>
        <div className="relative">
          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            disabled={isSending}
            className="pl-9"
          />
        </div>
        <Button onClick={handleInvite} disabled={isSending || !email} className="w-full gap-1.5">
          {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Send invite
        </Button>
      </div>

      {/* Pending invites */}
      {(isLoadingInvites || pending.length > 0) && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-muted-foreground">Pending Invites</p>
          {isLoadingInvites ? (
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="h-10 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            pending.map((invite) => {
              const initials = (invite.fullName ?? invite.email).charAt(0).toUpperCase()
              return (
                <div key={invite.id} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
                    {invite.profilePhoto ? (
                      <img src={invite.profilePhoto} alt="" className="w-full h-full object-cover" />
                    ) : initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{invite.fullName ?? invite.email}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Expires {format(new Date(invite.expiresAt), "MMM d")}
                    </p>
                  </div>
                  <button
                    onClick={() => toast.info("Ask the invitee to decline the invitation.")}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
