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
import { 
  Drawer, 
  DrawerContent, 
  DrawerHeader, 
  DrawerTitle,
  DrawerDescription
} from "@/components/ui/drawer"
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
  MenuIcon,
  SmartphoneIcon
} from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { ProfileSettings } from "./settings/profile-settings"
import { UpdatePhoneNumber } from "./settings/update-phone-number"
import { AppearanceSettings } from "./settings/appearance-settings"
import { PrivacySecurity } from "./settings/privacy-security"
import { SetupNestPursePin } from "./settings/setup-nestpurse-pin"
import { BankCardsSettings } from "./settings/bank-cards"

const data = {
  nav: [
    { name: "Notifications", slug: "notifications", icon: <BellIcon /> },
    { name: "Profile Settings", slug: "profile", icon: <UserIcon /> },
    { name: "Update Phone Number", slug: "phone", icon: <SmartphoneIcon /> },
    { name: "Appearance", slug: "appearance", icon: <PaintbrushIcon /> },
    { name: "Delivery Addresses", slug: "addresses", icon: <MapPinIcon /> },
    { name: "Bank & Cards", slug: "billing", icon: <CreditCardIcon /> },
    { name: "Setup NestPurse pin", slug: "nestpurse", icon: <KeyIcon /> },
    { name: "Privacy & Security", slug: "security", icon: <ShieldCheckIcon /> },
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
  
  const [activeItem, setActiveItem] = React.useState<typeof data.nav[0] | null>(null)
  const [showMobilePanel, setShowMobilePanel] = React.useState(false)

  // Sync active item with query param
  React.useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab) {
      const item = data.nav.find(i => i.slug === tab)
      if (item) {
        setActiveItem(item)
        if (isMobile) setShowMobilePanel(true)
      }
    } else if (!isMobile && !activeItem && isMobile !== undefined) {
      // Default to Profile Settings on desktop if nothing is selected
      setActiveItem(data.nav[1])
    }
  }, [searchParams, isMobile, activeItem])

  const updateTabParam = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", slug)
    // Only set settings=true if we're not on a standalone settings page
    if (!isPage) params.set("settings", "true")
    router.push(pathname + "?" + params.toString(), { scroll: false })
  }

  // Controlled by query param if not a standalone page
  const open = isPage || searchParams.get("settings") === "true"

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowMobilePanel(false)
      if (isPage) {
        router.back()
      } else {
        const params = new URLSearchParams(searchParams.toString())
        params.delete("settings")
        params.delete("tab")
        router.push(pathname + (params.toString() ? `?${params.toString()}` : ""))
      }
    }
  }

  const sidebarContent = (
    <SidebarMenu className="gap-1">
      {data.nav.map((item) => (
        <SidebarMenuItem key={item.name}>
          <SidebarMenuButton
            onClick={() => {
              setActiveItem(item)
              updateTabParam(item.slug)
              if (isMobile) setShowMobilePanel(true)
            }}
            isActive={activeItem?.name === item.name}
          >
            {item.icon}
            <span>{item.name}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  )

  const mainContent = (
    <main className={`flex flex-1 flex-col overflow-hidden ${isPage ? "h-svh" : "h-[500px]"}`}>
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 px-4 border-b">
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowMobilePanel(false)}
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
                <BreadcrumbPage>{activeItem?.name || "Settings"}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={() => handleOpenChange(false)}
          >
            <XIcon className="h-5 w-5" />
          </Button>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 md:p-6">
        {activeItem?.name === "Profile Settings" ? (
          <ProfileSettings onNavigate={(view) => {
            const target = data.nav.find(i => i.name === view)
            if (target) {
              setActiveItem(target)
              updateTabParam(target.slug)
            }
          }} />
        ) : activeItem?.name === "Update Phone Number" ? (
          <UpdatePhoneNumber />
        ) : activeItem?.name === "Privacy & Security" ? (
          <PrivacySecurity />
        ) : activeItem?.name === "Appearance" ? (
          <AppearanceSettings />
        ) : activeItem?.name === "Setup NestPurse pin" ? (
          <SetupNestPursePin />
        ) : activeItem?.name === "Bank & Cards" ? (
          <BankCardsSettings />
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video max-w-3xl rounded-xl bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )

  // Mobile Flow
  if (isMobile && !isPage) {
    if (showMobilePanel) {
      return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent 
            showCloseButton={false}
            className="fixed inset-0 z-50 flex h-dvh w-full! max-w-none! flex-col border-none p-0 bg-background translate-x-0! translate-y-0! left-0! top-0! rounded-none!"
          >
            <DialogTitle className="sr-only">{activeItem?.name || "Settings"}</DialogTitle>
            <DialogDescription className="sr-only">
              Configure your {(activeItem?.name || "settings").toLowerCase()} settings.
            </DialogDescription>
            {mainContent}
          </DialogContent>
        </Dialog>
      )
    }

    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="outline-none h-[80dvh]">
          <DrawerHeader className="p-4 border-b">
            <DrawerTitle>Settings</DrawerTitle>
            <DrawerDescription>Select a setting to configure.</DrawerDescription>
          </DrawerHeader>
          <div className="p-2 overflow-y-auto">
            <SidebarProvider className="min-h-0">
              <Sidebar collapsible="none" className="w-full">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupContent>
                      {sidebarContent}
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
            </SidebarProvider>
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop Flow
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]"
      >
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="w-64 border-r">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  {sidebarContent}
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          {mainContent}
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  )
}
