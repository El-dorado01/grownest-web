"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"
import { notificationsApi } from "@/lib/notifications-api"
import { cn } from "@/lib/utils"

interface DashboardHeaderProps {
  children?: React.ReactNode
  rightActions?: React.ReactNode
}

export function DashboardHeader({ children, rightActions }: DashboardHeaderProps) {
  const { isAuthenticated } = useAuth()
  const pathname = usePathname()

  const { data: notificationsData } = useSWR(
    isAuthenticated ? "notifications_badge" : null,
    async () => {
      const res = await notificationsApi.getNotifications()
      return res.data
    },
    { refreshInterval: 60000 }
  )

  const unreadCount = notificationsData?.unreadCount || 0
  const isNotificationsPage = pathname === "/notifications"

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 w-full bg-background select-none gap-4">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 shrink-0"
        />
        <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none flex items-center pr-2 [&>nav>ol]:flex-nowrap [&>nav>ol]:whitespace-nowrap">
          {children}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {rightActions}
        <Link 
          href="/notifications" 
          className={cn(
            "relative p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer",
            isNotificationsPage && "bg-primary/10 text-primary hover:bg-primary/15"
          )}
          title="Notifications"
        >
          <Bell className={cn("h-5 w-5", isNotificationsPage && "fill-primary/10")} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-black text-primary-foreground border-2 border-background">
              {unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
