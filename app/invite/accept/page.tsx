// app/invite/accept/page.tsx
"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircleIcon, XCircleIcon, UsersIcon } from "lucide-react"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { useAuth } from "@/context/auth-context"

type State = "loading" | "not_logged_in" | "accepting" | "success" | "error"

export default function InviteAcceptPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const token = searchParams.get("token") ?? ""

  const [state, setState] = React.useState<State>("loading")
  const [groupInfo, setGroupInfo] = React.useState<{ id: string; title: string } | null>(null)
  const [errorMsg, setErrorMsg] = React.useState("")

  const acceptInvite = React.useCallback(async () => {
    if (!token) { setState("error"); setErrorMsg("Invalid invitation link."); return }
    setState("accepting")
    const { data, error } = await groupNestEggApi.acceptInvite(token)
    if (error) { setState("error"); setErrorMsg(error); return }
    setGroupInfo(data!.group)
    setState("success")
  }, [token])

  React.useEffect(() => {
    if (isAuthLoading) return
    if (!token) { setState("error"); setErrorMsg("No invitation token found in link."); return }
    if (!isAuthenticated) { setState("not_logged_in"); return }
    acceptInvite()
  }, [isAuthenticated, isAuthLoading, token, acceptInvite])

  const loginUrl = `/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`

  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">
        <Link href="/">
          <Image src="/logo.png" alt="GrowNest" width={120} height={40} className="w-auto h-10" />
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8 w-full flex flex-col items-center gap-5 text-center">
          {/* Loading */}
          {(state === "loading" || state === "accepting") && (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div>
                <p className="text-lg font-semibold">Joining group...</p>
                <p className="text-sm text-muted-foreground mt-1">Please wait a moment.</p>
              </div>
            </>
          )}

          {/* Not logged in */}
          {state === "not_logged_in" && (
            <>
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center">
                <UsersIcon className="w-7 h-7 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">You&apos;ve been invited!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Sign in to your GrowNest account to accept this group savings invitation.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={loginUrl}>Sign in to Accept</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={`/signup?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
                  className="text-primary hover:underline"
                >
                  Sign up free
                </Link>
              </p>
            </>
          )}

          {/* Success */}
          {state === "success" && groupInfo && (
            <>
              <CheckCircleIcon className="w-14 h-14 text-green-500" />
              <div>
                <p className="text-lg font-semibold">You&apos;re in!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You&apos;ve successfully joined <strong>{groupInfo.title}</strong>. Start saving with your group!
                </p>
              </div>
              <Button asChild className="w-full">
                <Link href={`/savings/group/${groupInfo.id}`}>View Group</Link>
              </Button>
            </>
          )}

          {/* Error */}
          {state === "error" && (
            <>
              <XCircleIcon className="w-14 h-14 text-destructive" />
              <div>
                <p className="text-lg font-semibold">Couldn&apos;t join group</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link href="/savings/group">Back to Groups</Link>
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          © 2026 GrowNest ·{" "}
          <Link href="/terms" className="hover:underline">Terms</Link>
        </p>
      </div>
    </div>
  )
}
