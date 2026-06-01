"use client"

import * as React from "react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    isActive?: boolean
    items?: NavSubItem[]
  }[]
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

  const [openItem, setOpenItem] = React.useState<string | null>(null)

  React.useEffect(() => {
    const activeItem = items.find((item) => {
      const matchParent = item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)
      const matchSub = item.items?.some((sub) => {
        return isSubItemActive(sub.url)
      })
      return matchParent || matchSub
    })
    if (activeItem) {
      setOpenItem(activeItem.title)
    }
  }, [pathname, items, isSubItemActive])

  return (

    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const isItemActive =
            (item.url === "/" ? pathname === "/" : pathname.startsWith(item.url)) ||
            (item.items ? item.items.some((sub) => isSubItemActive(sub.url)) : false)
          const isOpen = openItem === item.title
          
          return (
            <Collapsible
              key={item.title}
              asChild
              open={isOpen}
              onOpenChange={(open) => {
                if (open) {
                  setOpenItem(item.title)
                } else if (isOpen) {
                  setOpenItem(null)
                }
              }}
              className="group/collapsible"
            >
              <SidebarMenuItem className="group/collapsible">
                {item.items?.length ? (
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title} isActive={isItemActive}>
                      {item.icon}
                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url} onClick={() => setOpenMobile(false)}>
                    <Link href={item.url}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>

                )}
                {item.items?.length ? (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={isSubItemActive(subItem.url)} onClick={() => setOpenMobile(false)}>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                              {subItem.badge}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>

                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                ) : null}
              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
