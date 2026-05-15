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
import { Loader2, PlusIcon, UsersIcon, LayoutGrid, List } from "lucide-react"
import { GroupCard } from "@/components/group-nestegg/group-card"
import { CreateGroupSheet } from "@/components/group-nestegg/create-group-sheet"
import { MyInvitations } from "@/components/group-nestegg/my-invitations"
import { useGroupNest } from "@/hooks/use-group-nest"
import { cn } from "@/lib/utils"
import Link from "next/link"

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount)

type Tab = "groups" | "invitations"
type ViewMode = "grid" | "table"

export default function MyGroupsPage() {
  const router = useRouter()
  const { groups, pendingInvites, isLoading, mutate, hasMore, isLoadingMore, loadMore } = useGroupNest()
  const [activeTab, setActiveTab] = React.useState<Tab>("groups")
  const [showCreate, setShowCreate] = React.useState(false)
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid")

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Group Savings</h2>
                  {!isLoading && (
                    <p className="text-sm text-muted-foreground">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-muted/50 rounded-xl p-1 border border-border/50 shadow-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "grid" 
                        ? "bg-card text-primary shadow-md ring-1 ring-black/5" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      viewMode === "table" 
                        ? "bg-card text-primary shadow-md ring-1 ring-black/5" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    title="Table View"
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
                <Button 
                  onClick={() => setShowCreate(true)} 
                  size="sm" 
                  className="gap-2 text-foreground h-12 px-5 rounded-xl shadow-lg shadow-primary/10 transition-transform active:scale-95"
                >
                  <PlusIcon className="w-4 h-4" /> 
                  <span className="font-bold">Create Group</span>
                </Button>
              </div>
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-[200px] rounded-2xl" />
                  ))}
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
                <>
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-in fade-in duration-500">
                      {groups.map((group) => (
                        <GroupCard key={group.id} group={group} formatCurrency={formatCurrency} />
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border bg-card animate-in fade-in duration-500">
                      <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                          <tr className="bg-muted/50 border-b">
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Group Name</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Members</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Saved</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Progress</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                          {groups.map((group) => {
                            const progress = group.progress
                            return (
                              <tr key={group.id} className="hover:bg-muted/30 border-b last:border-0 transition-colors">
                                <td className="p-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold">{group.title}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{group.description || "Group savings goal"}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-1.5">
                                    <UsersIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>{group.memberCount}/{group.maxMembers}</span>
                                  </div>
                                </td>
                                <td className="p-4">{formatCurrency(group.targetAmount)}</td>
                                <td className="p-4">{formatCurrency(group.savedAmount)}</td>
                                <td className="p-4 w-[120px]">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-bold">
                                      <span>{Math.round(progress)}%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-primary rounded-full" 
                                        style={{ width: `${progress}%` }} 
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 text-right">
                                  <Button variant="ghost" size="sm" className="h-8 font-bold" asChild>
                                    <Link href={`/savings/group/${group.id}`}>Enter Room</Link>
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {hasMore && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="outline"
                        onClick={loadMore}
                        disabled={isLoadingMore}
                        className="gap-2 h-10 px-6 bg-card"
                      >
                        {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {isLoadingMore ? "Loading..." : "Load more groups"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Invitations tab */}
          {activeTab === "invitations" && (
            <>
              <h2 className="text-lg font-semibold">Pending Invitations</h2>
              {isLoading ? (
                // <div className="flex flex-col gap-3">
                //   {[0, 1].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
                // </div>
                     
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-medium animate-pulse">
                  Getting your invitations...
                  </p>
                </div>
              ) : (
                <MyInvitations pending={pendingInvites} onResponded={() => mutate()} />
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
