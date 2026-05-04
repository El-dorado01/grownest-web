"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { 
  BellIcon, 
  UserIcon,
  PaintbrushIcon, 
  MapPinIcon,
  CreditCardIcon,
  KeyIcon,
  ShieldCheckIcon,
  XIcon,
  ChevronLeftIcon,
  MenuIcon
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

const data = {
  nav: [
    { name: "Notifications", icon: <BellIcon /> },
    { name: "Profile Settings", icon: <UserIcon /> },
    { name: "Appearance", icon: <PaintbrushIcon /> },
    { name: "Delivery Addresses", icon: <MapPinIcon /> },
    { name: "Bank & Cards", icon: <CreditCardIcon /> },
    { name: "Setup NestPurse pin", icon: <KeyIcon /> },
    { name: "Privacy & Security", icon: <ShieldCheckIcon /> },
  ],
}

interface SettingsDialogProps {
  isPage?: boolean
}

export function SettingsDialog({ isPage = false }: SettingsDialogProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const isMobile = useIsMobile()
  
  const [activeItem, setActiveItem] = React.useState(data.nav[1]) // Profile Settings
  const [showMobileMenu, setShowMobileMenu] = React.useState(true)

  // Reset showMobileMenu when switching to desktop
  React.useEffect(() => {
    if (!isMobile) setShowMobileMenu(false)
  }, [isMobile])
  
  // Controlled by query param if not a standalone page
  const open = isPage || searchParams.get("settings") === "true"

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      if (isPage) {
        router.back()
      } else {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("settings")
        router.push(pathname + (params.toString() ? `?${params.toString()}` : ""))
      }
    }
  }

  const content = (
    <SidebarProvider className="items-start">
      {(isMobile ? showMobileMenu : true) && (
        <Sidebar collapsible="none" className="w-full md:w-64 border-r">
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {data.nav.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton
                        onClick={() => {
                          setActiveItem(item)
                          if (isMobile) setShowMobileMenu(false)
                        }}
                        isActive={item.name === activeItem.name}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      )}
      {(isMobile ? !showMobileMenu : true) && (
      <main className={`flex flex-1 flex-col overflow-hidden ${isPage ? "h-svh" : "h-[500px]"}`}>
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
          <div className="flex items-center gap-2">
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowMobileMenu(true)}
                className="-ml-2"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </Button>
            )}
            <Breadcrumb>
              <BreadcrumbList>
                {!isMobile && (
                  <>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </>
                )}
                <BreadcrumbItem>
                  <BreadcrumbPage>{activeItem.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleOpenChange(false)}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="aspect-video max-w-3xl rounded-xl bg-muted/50"
            />
          ))}
        </div>
      </main>
      )}
    </SidebarProvider>
  )

  if (isPage) {
    return <div className="bg-background">{content}</div>
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px] sm:max-w-[100vw] sm:h-dvh md:h-auto"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        {content}
      </DialogContent>
    </Dialog>
  )
}

