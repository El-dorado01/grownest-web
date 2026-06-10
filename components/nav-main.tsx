"use client"

import * as React from "react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

type NavSubItem = {
  title: string
  url: string
  badge?: React.ReactNode
}

export function NavMain({
  items,
  onSelectSubmenu,
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: NavSubItem[]
  }[]
  onSelectSubmenu?: (title: string, items: NavSubItem[], icon: React.ReactNode) => void
}) {
  const { setOpenMobile } = useSidebar()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get("tab")

  const isSubItemActive = React.useCallback((subUrl: string) => {
    // Exact match
    if (pathname === subUrl) return true;

    // Check with query parameters
    const [subPath, subQuery] = subUrl.split("?")
    if (subPath === pathname) {
      if (!subQuery) {
        return !currentTab || currentTab === "plans"
      }
      const subQueryObj = new URLSearchParams(subQuery)
      const tabValue = subQueryObj.get("tab")
      return currentTab === tabValue
    }

    // Check nested routes
    if (subUrl.includes("tab=subscriptions") && pathname.startsWith("/nestbaskets/baskets/subscription")) {
      return true;
    }
    if (subUrl.includes("tab=flexible") && pathname.startsWith("/nestbaskets/baskets/flexible")) {
      return true;
    }

    return false;
  }, [pathname, currentTab])

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isItemActive =
            (item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)) ||
            (item.items ? item.items.some((sub) => isSubItemActive(sub.url)) : false)

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isItemActive}
                onClick={(e) => {
                  if (item.items && item.items.length > 0) {
                    e.preventDefault()
                    onSelectSubmenu?.(item.title, item.items, item.icon)
                  } else {
                    setOpenMobile(false)
                  }
                }}
                asChild={!item.items?.length}
              >
                {item.items?.length ? (
                  <button className="flex items-center w-full text-left gap-2 cursor-pointer">
                    {item.icon}
                    <span>{item.title}</span>
                    <ChevronRightIcon className="ml-auto w-4 h-4 text-muted-foreground/60 shrink-0" />
                  </button>
                ) : (
                  <Link href={item.url}>
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
