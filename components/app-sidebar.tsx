"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  LayoutDashboardIcon,
  WalletIcon,
  PiggyBankIcon,
  TruckIcon,
  LifeBuoyIcon,
  CogIcon,
  ShoppingBasketIcon,
  FeatherIcon,
  Users2Icon,
  ArrowLeftIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

interface NavSubItem {
  title: string
  url: string
  badge?: React.ReactNode
}

interface UserProfile {
  fullName: string | null
  email: string | null
  profilePhoto: string | null
}

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "NestPurse",
      url: "/nestpurse",
      icon: <WalletIcon />,
      items: [
        {
          title: "Overview",
          url: "/nestpurse",
        },
        {
          title: "Transactions",
          url: "/nestpurse/transactions",
        },
      ],
    },
    {
      title: "NestEggs",
      url: "/savings",
      icon: <PiggyBankIcon />,
      items: [
        {
          title: "My Eggs",
          url: "/savings/eggs",
        },
        {
          title: "Group Nest",
          url: "/savings/group",
        },
        {
          title: "Campaigns",
          url: "/savings/campaigns",
        },
      ],
    },
    {
      title: "NestBaskets",
      url: "/nestbaskets/baskets",
      icon: <ShoppingBasketIcon />,
      items: [
        {
          title: "Explore Predefined Plans",
          url: "/nestbaskets/baskets",
        },
        {
          title: "Custom Builder",
          url: "/nestbaskets/baskets/new",
        },
      ],
    },
    // {
    //   title: "NestMarket",
    //   url: "/marketplace",
    //   icon: <ShoppingBagIcon />,
    //   items: [
    //     {
    //       title: "Explore",
    //       url: "/marketplace",
    //     },
    //     {
    //       title: "Vendors",
    //       url: "/marketplace/vendors",
    //     },
    //     {
    //       title: "My Cart",
    //       url: "/marketplace/cart",
    //     },
    //     {
    //       title: "My Orders",
    //       url: "/marketplace/orders",
    //     },
    //     {
    //       title: "Market Chat",
    //       url: "/marketplace/chat",
    //       badge: <ChatNavBadge />,
    //     },
    //   ],
    // },
  ],
  projects: [
    {
      name: "NestTrails",
      url: "/deliveries",
      icon: <TruckIcon />,
    },
    {
      name: "Nest Feathers",
      url: "/nestfeathers",
      icon: <FeatherIcon />,
    },
    {
      name: "NestCircle",
      url: "/nestcircle",
      icon: <Users2Icon />,
    },
  ],
  navSecondary: [
    // {
    //   title: "Sell on NestMarket",
    //   url: "/seller",
    //   icon: <StoreIcon />,
    //   items: [
    //     {
    //       title: "Dashboard",
    //       url: "/seller",
    //     },
    //     {
    //       title: "Products",
    //       url: "/seller/products",
    //     },
    //     { title: "Orders", url: "/seller/orders" },
    //     { title: "Earnings", url: "/seller/earnings" },
    //     {
    //       title: "Messages",
    //       url: "/seller/chat",
    //       badge: <SellerChatNavBadge />,
    //     },
    //   ],
    // },
    {
      title: "Support",
      url: "/support",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Settings",
      url: "?settings=true",
      icon: <CogIcon />,
    },
  ],
}

const navMainItems = data.navMain;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  const [activeSubmenu, setActiveSubmenu] = React.useState<{ title: string; items: NavSubItem[]; icon?: React.ReactNode } | null>(null);
  const lastPathname = React.useRef("");

  React.useEffect(() => {
    if (isAuthenticated) {
      authApi.getProfile().then(({ data }) => {
        if (data?.profile) {
          setProfile(data.profile);
        }
      });
    }
  }, [isAuthenticated]);

  const userData = profile ? {
    name: profile.fullName || "User",
    email: profile.email || authUser?.email || "",
    avatar: profile.profilePhoto || "",
  } : {
    name: authUser?.email?.split("@")[0] || "User",
    email: authUser?.email || "",
    avatar: "",
  };

  const projectsWithBadges = data.projects;

  const navSecondaryItems = data.navSecondary;

  React.useEffect(() => {
    const isNavigated = lastPathname.current !== pathname;
    if (isNavigated) {
      lastPathname.current = pathname;
      setTimeout(() => {
        setActiveSubmenu(null);
      }, 0);
    }
  }, [pathname]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <Image src="/d_icon.png" alt="GrowNest" width={32} height={32} className="rounded-lg size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">GrowNest.Africa</span>
                  <span className="truncate text-xs text-muted-foreground">App Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {activeSubmenu ? (
          <>
            <SidebarGroup>
              <div className="px-2 py-1.5 flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-foreground select-none [&_svg]:size-4 [&_svg]:shrink-0">
                {activeSubmenu.icon}
                <span className="truncate max-w-[170px]">{activeSubmenu.title}</span>
              </div>
              <SidebarMenu className="gap-1 mt-2.5">
                {activeSubmenu.items.map((subItem) => {
                  const isActive = pathname === subItem.url || (subItem.url !== "/" && pathname.startsWith(subItem.url))
                  return (
                    <SidebarMenuItem key={subItem.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive} 
                        onClick={() => setOpenMobile(false)}
                      >
                        <Link href={subItem.url} className="flex justify-between items-center w-full">
                          <span>{subItem.title}</span>
                          {subItem.badge}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroup>
            <NavSecondary
              items={navSecondaryItems}
              onSelectSubmenu={(title, items, icon) => setActiveSubmenu({ title, items, icon })}
              className="mt-auto"
            />
            <div className="px-3 pb-3 pt-0">
              <Button 
                onClick={() => setActiveSubmenu(null)}
                variant="outline" 
                size="sm"
                className="w-full justify-center gap-1.5 font-medium text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <ArrowLeftIcon className="w-3.5 h-3.5" />
                <span>Back to Main Menu</span>
              </Button>
            </div>
          </>
        ) : (
          <>
            <React.Suspense fallback={<div className="h-10 px-4 flex items-center text-xs text-muted-foreground">Loading...</div>}>
              <NavMain items={navMainItems} />
            </React.Suspense>
            <NavProjects projects={projectsWithBadges} />
            <NavSecondary 
              items={navSecondaryItems} 
              onSelectSubmenu={(title, items, icon) => setActiveSubmenu({ title, items, icon })}
              className="mt-auto" 
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
