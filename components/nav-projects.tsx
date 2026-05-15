"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MoreHorizontalIcon, ExternalLinkIcon, LinkIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: React.ReactNode
    badge?: number
  }[]
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(window.location.origin + url)
    toast.success("Link copied to clipboard")
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Quick Links</SidebarGroupLabel>
      <SidebarMenu className="gap-1">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild onClick={() => setOpenMobile(false)}>
              <Link href={item.url} className="flex w-full items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {!!item.badge && item.badge > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground mr-1">
                    {item.badge}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="aria-expanded:bg-muted"
                >
                  <MoreHorizontalIcon />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem asChild className="cursor-pointer py-2">
                  <Link href={item.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                    <ExternalLinkIcon className="text-muted-foreground mr-2 h-4 w-4" />
                    <span>Open in new tab</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyLink(item.url)} className="cursor-pointer py-2">
                  <LinkIcon className="text-muted-foreground mr-2 h-4 w-4" />
                  <span>Copy link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
