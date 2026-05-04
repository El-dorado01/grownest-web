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
} from "@/components/ui/sidebar"
import { 
  LayoutDashboardIcon, 
  WalletIcon, 
  PiggyBankIcon, 
  StoreIcon, 
  ShoppingCartIcon, 
  MessageSquareIcon, 
  TruckIcon, 
  BellIcon,
  UsersIcon,
  TrendingUpIcon,
  LifeBuoyIcon, 
  CogIcon,
  TerminalIcon
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
    },
    {
      title: "NestPurse",
      url: "/purse",
      icon: <WalletIcon />,
      items: [
        {
          title: "Overview",
          url: "/purse",
        },
        {
          title: "Transactions",
          url: "/purse/transactions",
        },
        {
          title: "Withdrawals",
          url: "/purse/withdrawals",
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
          title: "Locked Savings",
          url: "/savings/locked",
        },
      ],
    },
    {
      title: "NestMarket",
      url: "/marketplace",
      icon: <StoreIcon />,
      items: [
        {
          title: "Explore",
          url: "/marketplace",
        },
        {
          title: "My Baskets",
          url: "/marketplace/baskets",
        },
        {
          title: "Market Chat",
          url: "/marketplace/chat",
        },
      ],
    },
  ],
  projects: [
    {
      name: "My Deliveries",
      url: "/deliveries",
      icon: <TruckIcon />,
    },
    {
      name: "Notifications",
      url: "/notifications",
      icon: <BellIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Settings",
      url: "?settings=true",
      icon: <CogIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = React.useState<any>(null);

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
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
