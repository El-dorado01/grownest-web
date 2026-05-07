// components/group-nestegg/my-invitations.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, CheckIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { formatDistanceToNow } from "date-fns"
import type { ReceivedInvitation } from "@/types/group-nestegg"

interface InvitationCardProps {
  inv: ReceivedInvitation
  onResponded: () => void
}

function InvitationCard({ inv, onResponded }: InvitationCardProps) {
  const router = useRouter()
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)

  const handleAccept = async () => {
    setIsAccepting(true)
    const { data, error } = await groupNestEggApi.acceptInvite(inv.token)
    setIsAccepting(false)
    if (error) { toast.error(error); return }
    toast.success(`You've joined "${data!.group.title}"!`)
    router.push(`/savings/group/${data!.group.id}`)
    onResponded()
  }

  const handleDecline = async () => {
    setIsDeclining(true)
    const { error } = await groupNestEggApi.declineInvite(inv.token)
    setIsDeclining(false)
    if (error) { toast.error(error); return }
    toast.success("Invitation declined")
    onResponded()
  }

  const expiryText = formatDistanceToNow(new Date(inv.expiresAt), { addSuffix: true })
  const coverInitial = inv.group.title.charAt(0).toUpperCase()

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-3">
      {/* Group cover */}
      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary shrink-0">
        {inv.group.cover ?? coverInitial}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{inv.group.title}</p>
        <p className="text-xs text-muted-foreground">
          Invited by <span className="font-medium">{inv.invitedBy}</span>
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {inv.canAccept ? `Expires ${expiryText}` : "Expired"}
        </p>

        {inv.canAccept && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleAccept}
              disabled={isAccepting || isDeclining}
              className="flex-1 gap-1"
            >
              {isAccepting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckIcon className="w-3 h-3" />}
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDecline}
              disabled={isAccepting || isDeclining}
              className="flex-1 gap-1"
            >
              {isDeclining ? <Loader2 className="w-3 h-3 animate-spin" /> : <XIcon className="w-3 h-3" />}
              Decline
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

interface MyInvitationsProps {
  pending: ReceivedInvitation[]
  onResponded: () => void
}

export function MyInvitations({ pending, onResponded }: MyInvitationsProps) {
  if (pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No pending invitations.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((inv) => (
        <InvitationCard key={inv.invitationId} inv={inv} onResponded={onResponded} />
      ))}
    </div>
  )
}
