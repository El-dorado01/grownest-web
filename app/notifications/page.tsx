"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { Loader2Icon, Bell, CheckCircle2, MoreVertical, Settings, Info, CreditCard, ShieldAlert, KeyRound, Smartphone, PiggyBank, ArrowDownToLine, Users, Flame, RefreshCw } from "lucide-react"
import useSWRInfinite from "swr/infinite"
import { mutate as globalMutate } from "swr"
import { notificationsApi } from "@/lib/notifications-api"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function getIconForNotification(notification: any) {
  const type = (notification.type || "").toUpperCase()
  const title = (notification.title || "").toLowerCase()

  if (title.includes("pin") || title.includes("password") || title.includes("security")) {
    return <KeyRound className="h-4 w-4 text-amber-500" />
  }
  if (title.includes("verification") || title.includes("code") || title.includes("otp")) {
    return <Smartphone className="h-4 w-4 text-blue-500" />
  }
  if (title.includes("nest feather") || title.includes("savings") || title.includes("nestegg")) {
    return <PiggyBank className="h-4 w-4 text-emerald-500" />
  }
  if (title.includes("auto top") || title.includes("auto save") || title.includes("recurring")) {
    return <RefreshCw className="h-4 w-4 text-indigo-500" />
  }
  if (title.includes("contribution") || title.includes("group")) {
    return <Users className="h-4 w-4 text-purple-500" />
  }
  if (title.includes("top up") || title.includes("deposit") || title.includes("received")) {
    return <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
  }
  if (title.includes("streak") || title.includes("fire")) {
    return <Flame className="h-4 w-4 text-orange-500" />
  }

  switch (type) {
    case 'SUCCESS':
    case 'NEST_EGG_MATURED':
    case 'TRANSFER_SUCCESS':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'WARNING':
    case 'SECURITY_ALERT':
      return <ShieldAlert className="h-4 w-4 text-amber-500" />
    case 'BILLING':
    case 'PAYMENT':
      return <CreditCard className="h-4 w-4 text-blue-500" />
    case 'INFO':
    default:
      return <Bell className="h-4 w-4 text-primary" />
  }
}

export function NotificationsDashboard() {
  const isMobile = useIsMobile()
  const [selectedNotification, setSelectedNotification] = React.useState<any>(null)

  const getKey = (pageIndex: number, previousPageData: any) => {
    if (previousPageData && !previousPageData.hasMore) return null
    if (pageIndex === 0) return "notifications"
    return `notifications?cursor=${previousPageData.nextCursor}`
  }

  const { data, error, isLoading, mutate, size, setSize, isValidating } = useSWRInfinite(
    getKey,
    async (key) => {
      const cursor = key.includes("cursor=") ? key.split("cursor=")[1] : undefined
      const res = await notificationsApi.getNotifications(cursor)
      if (res.error) throw new Error(res.error)
      return res.data
    }
  )

  const notifications = data ? data.flatMap(page => page?.notifications || []) : []
  const unreadCount = data?.[0]?.unreadCount || 0
  const hasMore = data?.[data.length - 1]?.hasMore || false
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined")

  const handleMarkAsRead = async (id: string) => {
    if (!data) return
    
    // Optimistic update across all pages
    const optimisticData = data.map((page, index) => {
      if (!page) return page;
      if (index === 0) {
        return {
          ...page,
          notifications: page.notifications?.map((n: any) => 
            n.id === id ? { ...n, isRead: true } : n
          ) || [],
          unreadCount: Math.max(0, (page.unreadCount || 0) - 1)
        }
      }
      return {
        ...page,
        notifications: page.notifications?.map((n: any) => 
          n.id === id ? { ...n, isRead: true } : n
        ) || []
      }
    })
    
    mutate(optimisticData, false)
    
    const { error } = await notificationsApi.markAsRead(id)
    if (error) {
      toast.error("Failed to mark as read")
      mutate() // rollback
    } else {
      globalMutate("notifications_badge")
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!data || unreadCount === 0) return

    const optimisticData = data.map((page, index) => {
      if (!page) return page;
      return {
        ...page,
        notifications: page.notifications?.map((n: any) => ({ ...n, isRead: true })) || [],
        unreadCount: index === 0 ? 0 : page.unreadCount
      }
    })

    mutate(optimisticData, false)
    toast.success("All notifications marked as read")

    const { error } = await notificationsApi.markAllAsRead()
    if (error) {
      toast.error("Failed to mark all as read")
      mutate() // rollback
    } else {
      globalMutate("notifications_badge")
    }
  }

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification)
    if (!notification.isRead) {
      handleMarkAsRead(notification.id)
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Notifications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto bg-muted/20">
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Stay updated with your account activity and alerts.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={!unreadCount || unreadCount === 0}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          </section>

          <div className="mx-auto w-full space-y-3">
            {isLoading && !data && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2Icon className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground animate-pulse">Loading notifications...</p>
              </div>
            )}

            {error && !data && (
              <Card className="p-8 flex flex-col items-center justify-center text-center gap-2">
                <ShieldAlert className="h-10 w-10 text-destructive/80" />
                <p className="font-medium">Failed to load notifications</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
                <Button variant="outline" className="mt-4" onClick={() => mutate()}>Try again</Button>
              </Card>
            )}

            {!isLoading && !error && notifications.length === 0 && (
              <Card className="p-12 flex flex-col items-center justify-center text-center gap-4 bg-card/50 border-dashed">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bell className="h-8 w-8 text-primary/60" />
                </div>
                <div>
                  <p className="font-medium text-lg">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">You don't have any notifications yet.</p>
                </div>
              </Card>
            )}

            {notifications.map((notification: any) => (
              <div 
                key={notification.id} 
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  "group relative flex gap-3 p-3 sm:p-4 rounded-xl border transition-all duration-300 cursor-pointer",
                  notification.isRead 
                    ? "bg-card hover:bg-muted/40" 
                    : "bg-card shadow-sm border-primary/20"
                )}
              >
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-full" />
                )}

                <div className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors",
                  notification.isRead ? "bg-muted" : "bg-primary/10"
                )}>
                  {getIconForNotification(notification)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between gap-4">
                    <p className={cn(
                      "text-[13px] tracking-tight",
                      notification.isRead ? "font-medium text-foreground/80" : "font-semibold text-foreground"
                    )}>
                      {notification.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap pt-0.5 shrink-0">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <p className={cn(
                    "text-[13px] leading-relaxed line-clamp-2",
                    notification.isRead ? "text-muted-foreground" : "text-foreground/90"
                  )}>
                    {notification.content}
                  </p>
                </div>

                <div className="shrink-0 -mr-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100">
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {!notification.isRead && (
                        <DropdownMenuItem onClick={() => handleMarkAsRead(notification.id)}>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Mark as read
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => toast.info("Settings opened")} className="text-muted-foreground">
                        <Settings className="mr-2 h-4 w-4" />
                        Notification settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}

            {hasMore && (
              <div className="pt-4 flex justify-center">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="rounded-xl px-6"
                  onClick={() => setSize(size + 1)}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load more"
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Notification Details Dialog/Drawer */}
          {isMobile ? (
            <Drawer open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
              <DrawerContent>
                <DrawerHeader className="text-center">
                  <div className="flex flex-col items-center gap-3 mb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      {selectedNotification && getIconForNotification(selectedNotification)}
                    </div>
                    <DrawerTitle className="text-lg">{selectedNotification?.title}</DrawerTitle>
                  </div>
                  <DrawerDescription className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedNotification?.content}
                  </DrawerDescription>
                  <p className="mt-4 text-xs text-muted-foreground">
                    {selectedNotification && formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                  </p>
                </DrawerHeader>
                <div className="p-4 pb-8">
                  <Button className="w-full" onClick={() => setSelectedNotification(null)}>Close</Button>
                </div>
              </DrawerContent>
            </Drawer>
          ) : (
            <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {selectedNotification && getIconForNotification(selectedNotification)}
                    </div>
                    <DialogTitle>{selectedNotification?.title}</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="py-4">
                  <DialogDescription className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedNotification?.content}
                  </DialogDescription>
                  <p className="mt-6 text-xs text-muted-foreground">
                    {selectedNotification && formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}

        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NotificationsDashboard />
    </React.Suspense>
  )
}
