"use client"

import * as React from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"

export function NavSecondary({
  items,
  onSelectSubmenu,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ReactNode
    items?: { title: string; url: string; badge?: React.ReactNode }[]
  }[]
  onSelectSubmenu?: (
    title: string,
    items: { title: string; url: string; badge?: React.ReactNode }[],
    icon: React.ReactNode
  ) => void
  className?: string
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu className="gap-1">
          {items.map((item) => {
            const hasItems = item.items && item.items.length > 0;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild={!hasItems} 
                  onClick={(e) => {
                    if (hasItems) {
                      e.preventDefault()
                      onSelectSubmenu?.(item.title, item.items!, item.icon)
                    } else {
                      setOpenMobile(false)
                    }
                  }}
                >
                  {hasItems ? (
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
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
