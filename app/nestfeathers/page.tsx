"use client"

import { DashboardHeader } from "@/components/dashboard-header"

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
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useNestFeathers } from "@/hooks/use-nestfeathers"
import { useProfile } from "@/hooks/use-profile"
import { 
  Loader2, 
  Trophy, 
  ChevronRight, 
  ArrowRight,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { AirtimeDialog } from "@/components/purse/airtime-dialog"
import { 
  getFeatherIcon, 
  getFeatherTheme, 
  getUserRank, 
  QUOTES, 
  getMotivationMessage 
} from "@/components/nestfeathers/utils"
import { MilestoneCardStack } from "@/components/nestfeathers/milestone-card-stack"
import { UserRankFeatherStack } from "@/components/nestfeathers/user-rank-feather-stack"
import { FeatherMilestonesList } from "@/components/nestfeathers/feather-milestones-list"

export function NestFeathersDashboard() {
  const isMobile = useIsMobile()
  const { feathers, isLoading, error, mutate } = useNestFeathers()
  const { profile, mutate: mutateProfile } = useProfile()
  const [selectedFeather, setSelectedFeather] = React.useState<any>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [quote, setQuote] = React.useState("")

  const [isAirtimeDialogOpen, setIsAirtimeDialogOpen] = React.useState(false)

  const handleCloseFeather = () => {
    setSelectedFeather(null)
  }

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length)
    setQuote(QUOTES[randomIndex])
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await mutate()
    setIsRefreshing(false)
  }

  // Calculate motivation message for selected feather
  const motivationMessage = selectedFeather ? getMotivationMessage(selectedFeather) : ""

  // Calculate scores
  const totalLevel = feathers.reduce((sum: number, f: any) => sum + (f.level || 0), 0)
  const totalCount = feathers.reduce((sum: number, f: any) => sum + (f.count || 0), 0)
  const rank = getUserRank(totalLevel)

  // Skeleton UI
  if (isLoading && feathers.length === 0) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader>
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nest Feathers</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </DashboardHeader>
          <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-muted/20">
            <div className="space-y-4">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-72 bg-muted rounded animate-pulse" />
            </div>
            <div className="h-44 w-full bg-muted rounded-2xl animate-pulse" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Nest Feathers</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </DashboardHeader>

        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-muted/20">
          
          {/* Header Action Section */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Nest Feathers</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Earn feathers by completing savings goals, interacting with the market, and supporting other Nesters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 self-start sm:self-auto rounded-xl"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </section>

          {error && (
            <Card className="border-destructive/20 bg-destructive/5 p-4 text-center">
              <p className="text-sm font-medium text-destructive">Failed to load achievements. Please check your network connection.</p>
            </Card>
          )}

          {/* Bubble Comment & Quoted Stats Card (Social Inspo) */}
          <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">
            {/* 1. Comment Bubble */}
            <div className="relative bg-card border border-border rounded-3xl p-5 shadow-xs transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-3 mb-3">
                {profile?.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt={profile.fullName || "User"}
                    className="h-10 w-10 min-w-10 rounded-full object-cover border"
                  />
                ) : (
                  <div className="h-10 w-10 min-w-10 rounded-full bg-primary/10 border flex items-center justify-center text-primary font-bold text-sm">
                    {profile?.fullName
                      ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                      : "GN"}
                  </div>
                )}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5">
                    <span className="font-bold text-sm text-foreground leading-none truncate max-w-[160px] sm:max-w-none">
                      {profile?.fullName || "GrowNester"}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal truncate max-w-[140px] sm:max-w-none">
                      @{profile?.email?.split("@")[0] || "nester"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground font-medium block mt-0.5">
                    just now
                  </span>
                </div>
              </div>
              <p className="text-sm text-foreground font-medium leading-relaxed">
                {quote || "Consistency beats intensity. Earning feathers isn't just a game; it's a measure of our financial intelligence."}
              </p>
              
              {/* Comment bubble tip */}
              <div className="w-3.5 h-3.5 bg-card border-b border-r border-border rotate-45 absolute -bottom-1.5 left-10 z-10" />
            </div>

            {/* 2. Quoted Stats Card */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col gap-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left w-full">
                  <UserRankFeatherStack feathers={feathers} />
                  <div className="space-y-1.5 flex-1 min-w-0 w-full">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black tracking-wide">
                      <Trophy className="h-3 w-3" />
                      Achievements Rank
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground">{rank.title}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {rank.desc} Do you really think you can unlock all 6 golden feathers? Keep saving and spending wisely to find out! 🤖
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Width Progress Bar (on its own line) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold leading-none text-muted-foreground">
                  <span>Rank Progress</span>
                  <span>{totalLevel} / 30 Lvl</span>
                </div>
                <div className="relative w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (totalLevel / 30) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Bottom Reaction Stats Footer */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between border-t border-muted/40 pt-4 text-xs font-bold text-muted-foreground">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    🔥 <span className="text-foreground">{totalCount}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    👍 <span className="text-foreground">{totalLevel}</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted/50 hover:bg-muted transition-colors">
                    ✨ <span className="text-foreground">{feathers.filter((f: any) => f.level > 0).length} Unlocked</span>
                  </div>
                </div>

                <button 
                  onClick={() => document.getElementById('feathers-grid')?.scrollIntoView({ behavior: 'smooth' })}
                  className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer text-xs self-start sm:self-auto"
                >
                  {feathers.length} Categories <ChevronRight className="h-4 w-4 rotate-90" />
                </button>
              </div>
            </div>
          </div>

          {/* Feathers Grid */}
          <div id="feathers-grid" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {feathers.map((feather: any) => {
              const theme = getFeatherTheme(feather.type)
              const maxLevel = feather.milestones.length
              const currentLevel = feather.level || 0
              const nextThreshold = feather.nextMilestone?.threshold || 0
              const prevThreshold = currentLevel > 0 
                ? feather.milestones[currentLevel - 1]?.threshold || 0 
                : 0
              const progressRange = nextThreshold - prevThreshold
              const progressCurrent = (feather.count || 0) - prevThreshold
              const percent = nextThreshold > 0
                ? Math.min(100, Math.max(0, (progressCurrent / progressRange) * 100))
                : 100

              return (
                <Card 
                  key={feather.type} 
                  className={cn(
                    "flex flex-col border shadow-none transition-all duration-300 group hover:shadow-md cursor-pointer rounded-2xl relative overflow-hidden bg-card",
                    "p-4 sm:p-6 gap-4 border-muted/60"
                  )}
                  onClick={() => setSelectedFeather(feather)}
                >
                  {/* Card stack left + details right */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left w-full">
                    <MilestoneCardStack 
                      type={feather.type} 
                      currentLevel={currentLevel} 
                      milestones={feather.milestones} 
                    />
                    
                    <div className="flex-1 min-w-0 space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                        <h3 className="font-bold text-sm text-foreground truncate leading-tight group-hover:text-primary transition-colors">
                          {feather.label}
                        </h3>
                        <span className={cn("text-xs font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0", theme.badge)}>
                          Lvl {currentLevel}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {currentLevel > 0 
                          ? feather.milestones[currentLevel - 1]?.label || "Unlocked"
                          : "Not started"
                        }
                      </p>
                      {feather.nextMilestone ? (
                        <p className="text-xs text-muted-foreground/80 font-semibold truncate leading-none pt-0.5">
                          Next target: <span className="font-bold text-foreground">{feather.nextMilestone.label}</span> ({feather.nextMilestone.threshold})
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-600 font-bold leading-none pt-0.5">
                          🎉 Max level reached!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs font-black tracking-tight text-muted-foreground">
                      <span>Progress</span>
                      <span>{feather.count} / {nextThreshold || "Max"}</span>
                    </div>
                    <div className="relative w-full h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={cn("h-full rounded-full transition-all duration-500", theme.progressColor)}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom reaction bar & actions */}
                  <div className="flex items-center justify-between border-t border-muted/40 pt-3.5 mt-auto text-xs font-bold text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted transition-colors text-xs">
                        🔥 <span className="text-foreground">{feather.count}</span>
                      </div>
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted transition-colors text-xs">
                        👍 <span className="text-foreground">{currentLevel}/{maxLevel}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-xs font-extrabold group-hover:text-primary transition-colors hover:bg-transparent p-0"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link href={theme.route} className="flex items-center gap-0.5">
                        {theme.actionText} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Milestone Detail Dialog/Drawer */}
        {isMobile ? (
          <Drawer open={!!selectedFeather} onOpenChange={(open) => !open && handleCloseFeather()}>
            <DrawerContent className="max-h-[85vh]">
              {selectedFeather && (
                <div className="mx-auto w-full max-w-lg flex flex-col h-[80vh] max-h-[85vh]">
                  <DrawerHeader className="flex flex-col gap-3 items-center text-center p-5 pb-3 border-b shrink-0">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs", getFeatherTheme(selectedFeather.type).iconBg)}>
                      {getFeatherIcon(selectedFeather.type, "h-6.5 w-6.5")}
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col items-center gap-1.5">
                        <DrawerTitle className="text-xl font-black">{selectedFeather.label}</DrawerTitle>
                        <span className={cn("text-xs font-black uppercase px-2 py-0.5 rounded-full tracking-wider", getFeatherTheme(selectedFeather.type).badge)}>
                          Level {selectedFeather.level || 0}
                        </span>
                      </div>
                      <DrawerDescription className="text-xs max-w-xs mx-auto leading-relaxed mt-0.5">
                        You have completed <span className="font-bold text-foreground">{selectedFeather.count}</span> total actions in this category. Explore milestones below.
                      </DrawerDescription>
                    </div>
                  </DrawerHeader>

                  {/* Motivation Banner */}
                  {motivationMessage && (
                    <div className="px-6 pt-2 shrink-0">
                      <div className={cn(
                        "p-2 rounded-xl text-center text-xs font-bold border",
                        selectedFeather.nextMilestone 
                          ? "bg-primary/5 border-primary/15 text-primary" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {motivationMessage}
                      </div>
                    </div>
                  )}
                  
                  <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto bg-muted/10 relative">
                    <FeatherMilestonesList feather={selectedFeather} />
                  </div>

                  <DrawerFooter className="px-6 pb-6 gap-2 border-t pt-4 shrink-0">
                    {selectedFeather.type === "AIRTIME_PURCHASE" ? (
                      <Button 
                        className={cn("w-full h-10 rounded-full font-bold gap-2 text-xs cursor-pointer", getFeatherTheme(selectedFeather.type).btnColor)}
                        onClick={() => {
                          setSelectedFeather(null)
                          setIsAirtimeDialogOpen(true)
                        }}
                      >
                        Buy Airtime
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button className={cn("w-full h-10 rounded-full font-bold gap-2 text-xs", getFeatherTheme(selectedFeather.type).btnColor)} asChild>
                        <Link href={getFeatherTheme(selectedFeather.type).route}>
                          {getFeatherTheme(selectedFeather.type).actionText}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                    <DrawerClose asChild>
                      <Button variant="ghost" className="h-10 rounded-full font-semibold text-xs cursor-pointer">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              )}
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={!!selectedFeather} onOpenChange={(open) => !open && handleCloseFeather()}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-3xl border h-[580px] max-h-[85vh] flex flex-col">
              {selectedFeather && (
                <>
                  <DialogHeader className="flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left p-5 pb-3 border-b shrink-0">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs", getFeatherTheme(selectedFeather.type).iconBg)}>
                      {getFeatherIcon(selectedFeather.type, "h-6.5 w-6.5")}
                    </div>
                    <div className="space-y-1 w-full">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 justify-center sm:justify-start">
                        <DialogTitle className="text-lg font-black">{selectedFeather.label}</DialogTitle>
                        <span className={cn("text-xs font-black uppercase px-2 py-0.5 rounded-full tracking-wider mt-1 sm:mt-0 self-center sm:self-auto", getFeatherTheme(selectedFeather.type).badge)}>
                          Level {selectedFeather.level || 0}
                        </span>
                      </div>
                      <DialogDescription className="text-xs max-w-sm mx-auto sm:mx-0 leading-relaxed mt-0.5">
                        You have completed <span className="font-bold text-foreground">{selectedFeather.count}</span> total actions in this category. Explore milestones below.
                      </DialogDescription>
                    </div>
                  </DialogHeader>

                  {/* Motivation Banner */}
                  {motivationMessage && (
                    <div className="px-6 pt-2 shrink-0">
                      <div className={cn(
                        "p-2 rounded-xl text-center text-xs font-bold border",
                        selectedFeather.nextMilestone 
                          ? "bg-primary/5 border-primary/15 text-primary" 
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      )}>
                        {motivationMessage}
                      </div>
                    </div>
                  )}

                  <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto bg-muted/10 relative">
                    <FeatherMilestonesList feather={selectedFeather} />
                  </div>

                  <DialogFooter className="px-6 pb-6 pt-4 border-t shrink-0 flex items-center justify-center">
                    {selectedFeather.type === "AIRTIME_PURCHASE" ? (
                      <Button 
                        className={cn("w-full px-8 h-10 rounded-full font-bold gap-2 text-xs mx-auto cursor-pointer", getFeatherTheme(selectedFeather.type).btnColor)}
                        onClick={() => {
                          setSelectedFeather(null)
                          setIsAirtimeDialogOpen(true)
                        }}
                      >
                        Buy Airtime
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button className={cn("w-full px-8 h-10 rounded-full font-bold gap-2 text-xs mx-auto", getFeatherTheme(selectedFeather.type).btnColor)} asChild>
                        <Link href={getFeatherTheme(selectedFeather.type).route}>
                          {getFeatherTheme(selectedFeather.type).actionText}
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    )}
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}

        <AirtimeDialog 
          open={isAirtimeDialogOpen} 
          onOpenChange={setIsAirtimeDialogOpen} 
          colorTheme="sky" 
        />
      </SidebarInset>
    </SidebarProvider>
  )
}



export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NestFeathersDashboard />
    </React.Suspense>
  )
}
