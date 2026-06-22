'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Receipt,
  ClipboardList,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Dashboard',   href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Referrals',   href: '/dashboard/referrals',  icon: Users },
  { label: 'Commissions', href: '/dashboard/commissions', icon: Receipt },
  { label: 'Apply',       href: '/apply',                 icon: ClipboardList },
];

export function AffiliateSidebar() {
  const pathname = usePathname();

  // Normalise pathname — strip the /affiliate-portal prefix that the proxy adds
  const clean = pathname.replace(/^\/affiliate-portal/, '') || '/';

  const isActive = (href: string) => {
    if (href === '/dashboard') return clean === '/dashboard';
    return clean.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border py-4 px-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/d_icon.png"
            alt="GrowNest"
            width={32}
            height={32}
            className="rounded-lg shrink-0"
          />
          <div className="min-w-0 overflow-hidden">
            <p className="text-sm font-bold text-sidebar-foreground truncate leading-tight">GrowNest</p>
            <p className="text-[10px] text-sidebar-foreground/60 truncate leading-tight">Affiliate Portal</p>
          </div>
        </Link>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map(({ label, href, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(href)}
                    tooltip={label}
                  >
                    <Link href={href} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </span>
                      {isActive(href) && (
                        <ChevronRight className="size-3.5 text-sidebar-primary opacity-70" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border py-3 px-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Link href="/login">
                <LogOut className="size-4" />
                <span>Sign out</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
