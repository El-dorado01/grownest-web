"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SupportSettings } from "@/components/settings/support-settings"
import { Loader2Icon } from "lucide-react"

export function SupportDashboard() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Support</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 overflow-y-auto">
          <section>
            <h1 className="text-2xl font-semibold tracking-tight">Support & Help</h1>
            <p className="mt-1 text-muted-foreground">
              Find answers to your questions and get in touch with our team.
            </p>
          </section>

          <div className="mx-auto w-full max-w-5xl">
            <SupportSettings />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <SupportDashboard />
    </React.Suspense>
  )
}
