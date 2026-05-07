// app/savings/group/[id]/page.tsx
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PlusCircleIcon, Trash2Icon, TrophyIcon } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { SemiProgressRing } from "@/components/nesteggs/progress-ring"
import { MemberList } from "@/components/group-nestegg/member-list"
import { Scoreboard } from "@/components/group-nestegg/scoreboard"
import { GroupContributionList } from "@/components/group-nestegg/group-contribution-list"
import { GroupAutoSaveCard } from "@/components/group-nestegg/group-autosave-card"
import { GroupContributeModal } from "@/components/group-nestegg/group-contribute-modal"
import { InvitePanel } from "@/components/group-nestegg/invite-panel"
import type { GroupNestEgg, GroupMember, WeeklyScoreboard } from "@/types/group-nestegg"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)

type Tab = "overview" | "contributions" | "scoreboard"

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [group, setGroup] = React.useState<GroupNestEgg | null>(null)
  const [scoreboard, setScoreboard] = React.useState<WeeklyScoreboard | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isScoreboardLoading, setIsScoreboardLoading] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<Tab>("overview")
  const [contributeOpen, setContributeOpen] = React.useState(false)
  const [contributionRefreshKey, setContributionRefreshKey] = React.useState(0)
  const [isDeleting, setIsDeleting] = React.useState(false)

  const fetchGroup = React.useCallback(async () => {
    const { data, error } = await groupNestEggApi.get(id)
    if (error) { toast.error("Failed to load group"); return }
    if (data) setGroup(data.group)
    setIsLoading(false)
  }, [id])

  const fetchScoreboard = React.useCallback(async () => {
    setIsScoreboardLoading(true)
    const { data } = await groupNestEggApi.scoreboard(id)
    if (data) setScoreboard(data)
    setIsScoreboardLoading(false)
  }, [id])

  React.useEffect(() => { fetchGroup() }, [fetchGroup])

  React.useEffect(() => {
    if (activeTab === "scoreboard" && !scoreboard) fetchScoreboard()
  }, [activeTab, scoreboard, fetchScoreboard])

  const handleContributeSuccess = (savedAmount: number, progress: number) => {
    setGroup((prev) => prev ? { ...prev, savedAmount, progress } : prev)
    setContributionRefreshKey((k) => k + 1)
  }

  const handleAutoSaveUpdate = (updated: Partial<GroupMember>) => {
    if (!group || !user) return
    setGroup((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        members: prev.members.map((m) =>
          m.profileId === user.userId ? { ...m, ...updated } : m
        ),
      }
    })
  }

  const handleDelete = async () => {
    if (!group) return
    setIsDeleting(true)
    const { error } = await groupNestEggApi.delete(group.id)
    setIsDeleting(false)
    if (error) { toast.error(error); return }
    toast.success("Group deleted")
    router.push("/savings/group")
  }

  if (isLoading || !group) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            </div>
          </header>
          <div className="flex flex-1 gap-6 p-4 md:p-6">
            <div className="flex-1 flex flex-col gap-6">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
            <div className="hidden lg:flex flex-col gap-4 w-72">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-48 rounded-2xl" />
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  const isOwner = group.ownerId === user?.userId
  const myMember = group.members.find((m) => m.profileId === user?.userId)
  const hasContributions = group.members.some((m) => m.totalContributed > 0)
  const isActive = group.status === "active"

  const statRows = [
    { label: "Target", value: formatCurrency(group.targetAmount) },
    { label: "Total Saved", value: formatCurrency(group.savedAmount) },
    { label: "Remaining", value: formatCurrency(Math.max(0, group.targetAmount - group.savedAmount)) },
    { label: "Members", value: `${group.memberCount} / ${group.maxMembers}` },
    { label: "End Date", value: new Date(group.endDate).toLocaleDateString("en-NG") },
    { label: "Days Left", value: String(group.daysRemaining) },
  ]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-vertical:h-4 data-vertical:self-auto" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="/">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="/savings/group">Group Nest</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="truncate max-w-40">{group.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 gap-6 p-4 md:p-6 overflow-y-auto">

          {/* ── Left column ──────────────────────────────────── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Progress ring card */}
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-4">
              <SemiProgressRing
                progress={group.progress}
                savedAmount={group.savedAmount}
                targetAmount={group.targetAmount}
                formatCurrency={formatCurrency}
              />
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-xl">{group.cover ?? "👥"}</span>
                <h1 className="text-xl font-bold">{group.title}</h1>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground text-center max-w-sm">{group.description}</p>
              )}
              <div className="flex gap-6 text-center text-sm">
                <div>
                  <p className="font-bold text-foreground text-base">{group.daysRemaining}</p>
                  <p className="text-xs text-muted-foreground">days left</p>
                </div>
                <Separator orientation="vertical" className="h-8 self-center" />
                <div>
                  <p className="font-bold text-foreground text-base">{group.progress.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">progress</p>
                </div>
                <Separator orientation="vertical" className="h-8 self-center" />
                <div>
                  <p className="font-bold text-foreground text-base">{group.memberCount}/{group.maxMembers}</p>
                  <p className="text-xs text-muted-foreground">members</p>
                </div>
              </div>
            </div>

            {/* Mobile: contribute button */}
            {isActive && (
              <div className="flex gap-2 lg:hidden">
                <Button className="flex-1 gap-1.5" onClick={() => setContributeOpen(true)}>
                  <PlusCircleIcon className="w-4 h-4" /> Contribute
                </Button>
              </div>
            )}

            {/* Maturity banner */}
            {group.isMature && isActive && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                <TrophyIcon className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-sm">Goal period ended!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Saved {formatCurrency(group.savedAmount)} of {formatCurrency(group.targetAmount)}.
                    Contact the group owner to process payout.
                  </p>
                </div>
              </div>
            )}

            {/* Tab bar */}
            <div className="flex bg-muted rounded-xl p-1 gap-1">
              {(["overview", "contributions", "scoreboard"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                    activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === "overview" && (
              <div className="flex flex-col gap-4">
                <MemberList
                  members={group.members}
                  formatCurrency={formatCurrency}
                  currentUserId={user?.userId}
                />
                {/* Mobile auto-save card */}
                {myMember && isActive && (
                  <div className="lg:hidden">
                    <GroupAutoSaveCard
                      groupId={group.id}
                      myMember={myMember}
                      onUpdate={handleAutoSaveUpdate}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === "contributions" && (
              <GroupContributionList
                groupId={group.id}
                formatCurrency={formatCurrency}
                refreshKey={contributionRefreshKey}
              />
            )}

            {activeTab === "scoreboard" && (
              <Scoreboard
                data={scoreboard}
                isLoading={isScoreboardLoading}
                formatCurrency={formatCurrency}
              />
            )}
          </div>

          {/* ── Right column — desktop only ──────────────────── */}
          <div className="hidden lg:flex flex-col gap-4 w-72 xl:w-80 shrink-0">

            {/* Contribute action */}
            {isActive && (
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
                <Button className="w-full gap-1.5" onClick={() => setContributeOpen(true)}>
                  <PlusCircleIcon className="w-4 h-4" /> Contribute
                </Button>
              </div>
            )}

            {/* Quick stats */}
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {statRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className="font-medium">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Invite panel — owner only */}
            {isOwner && isActive && (
              <InvitePanel groupId={group.id} groupTitle={group.title} />
            )}

            {/* Per-member auto-save */}
            {myMember && isActive && (
              <GroupAutoSaveCard
                groupId={group.id}
                myMember={myMember}
                onUpdate={handleAutoSaveUpdate}
              />
            )}

            {/* Delete group — owner, no contributions */}
            {isOwner && !hasContributions && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive gap-1.5 self-start">
                    <Trash2Icon className="w-4 h-4" /> Delete Group
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete &quot;{group.title}&quot;?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This group has no contributions. All members and pending invitations will be removed. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </SidebarInset>

      <GroupContributeModal
        open={contributeOpen}
        onClose={() => setContributeOpen(false)}
        groupId={group.id}
        groupTitle={group.title}
        onSuccess={handleContributeSuccess}
      />
    </SidebarProvider>
  )
}
