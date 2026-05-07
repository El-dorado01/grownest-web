"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PlusIcon, UsersIcon } from "lucide-react"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { GroupCard } from "@/components/group-nestegg/group-card"
import { CreateGroupSheet } from "@/components/group-nestegg/create-group-sheet"
import { MyInvitations } from "@/components/group-nestegg/my-invitations"
import type { GroupListItem, ReceivedInvitation } from "@/types/group-nestegg"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)

type Tab = "groups" | "invitations"

export default function MyGroupsPage() {
  const router = useRouter()
  const [groups, setGroups] = React.useState<GroupListItem[]>([])
  const [pendingInvites, setPendingInvites] = React.useState<ReceivedInvitation[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState<Tab>("groups")
  const [showCreate, setShowCreate] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    const [groupsRes, invitesRes] = await Promise.all([
      groupNestEggApi.myGroups(),
      groupNestEggApi.myInvitations(),
    ])
    if (groupsRes.data) setGroups(groupsRes.data.groups)
    if (invitesRes.data) setPendingInvites(invitesRes.data.pending)
    setIsLoading(false)
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  const handleCreated = (groupId: string) => {
    router.push(`/savings/group/${groupId}`)
  }

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
                <BreadcrumbItem><BreadcrumbPage>Group Nest</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-5 p-4 md:p-6">
          {/* Tab bar */}
          <div className="flex bg-muted rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "groups" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              My Groups
              {!isLoading && groups.length > 0 && (
                <span className="ml-2 text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                  {groups.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("invitations")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "invitations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Invitations
              {!isLoading && pendingInvites.length > 0 && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-semibold">
                  {pendingInvites.length}
                </span>
              )}
            </button>
          </div>

          {/* Groups tab */}
          {activeTab === "groups" && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Group Savings</h2>
                  {!isLoading && (
                    <p className="text-sm text-muted-foreground">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
                <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
                  <PlusIcon className="w-4 h-4" /> Create Group
                </Button>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                </div>
              ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <UsersIcon className="w-12 h-12 text-muted-foreground" />
                  <p className="text-lg font-semibold">No group savings yet</p>
                  <p className="text-sm text-muted-foreground text-center max-w-xs">
                    Create a group and invite friends, family, or colleagues to save together.
                  </p>
                  <Button onClick={() => setShowCreate(true)} className="mt-2 gap-1.5">
                    <PlusIcon className="w-4 h-4" /> Create Group
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} formatCurrency={formatCurrency} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Invitations tab */}
          {activeTab === "invitations" && (
            <>
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                </div>
              ) : (
                <MyInvitations pending={pendingInvites} onResponded={fetchData} />
              )}
            </>
          )}
        </div>
      </SidebarInset>

      <CreateGroupSheet
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={handleCreated}
      />
    </SidebarProvider>
  )
}
