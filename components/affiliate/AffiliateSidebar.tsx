'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Receipt, FileSearch, ChevronRight } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { NavUser } from '@/components/nav-user';
import { useProfile } from '@/hooks/use-profile';

const NAV = [
  { label: 'Dashboard',      href: '/portal',             icon: LayoutDashboard },
  { label: 'Referrals',      href: '/portal/referrals',   icon: Users },
  { label: 'Commissions',    href: '/portal/commissions',  icon: Receipt },
  { label: 'My Application', href: '/portal/application',  icon: FileSearch },
];

export function AffiliateSidebar() {
  const pathname = usePathname();
  const { profile } = useProfile();

  const clean = pathname.replace(/^\/affiliate-portal/, '') || '/';
  const isActive = (href: string) => href === '/portal' ? clean === '/portal' : clean.startsWith(href);

  const user = {
    name:   profile?.fullName  ?? profile?.email ?? 'Affiliate',
    email:  profile?.email     ?? '',
    avatar: (profile as any)?.profilePhoto ?? '',
  };

  return (
    <Sidebar collapsible="icon">
      {/* Header */}
      <SidebarHeader className="border-b border-sidebar-border py-4 px-3">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <Image src="/d_icon.png" alt="GrowNest" width={32} height={32} className="rounded-lg shrink-0" />
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
                  <SidebarMenuButton asChild isActive={isActive(href)} tooltip={label}>
                    <Link href={href} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Icon className="size-4" />
                        <span>{label}</span>
                      </span>
                      {isActive(href) && <ChevronRight className="size-3.5 text-sidebar-primary opacity-70" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer — reuses main NavUser (calls logout API, shows avatar + name) */}
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
