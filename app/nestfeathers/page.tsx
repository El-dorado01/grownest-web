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
  Award, 
  ShoppingCart, 
  Wallet, 
  Users, 
  TrendingUp, 
  Compass, 
  ChevronRight, 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  ArrowRight,
  RefreshCw,
  Feather
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Icon mapping based on feather types
function getFeatherIcon(type: string, className?: string) {
  switch (type) {
    case "MARKET_PURCHASE":
      return <ShoppingCart className={cn("text-violet-500", className)} />
    case "EGG_GOAL_MET":
      return <Award className={cn("text-amber-500", className)} />
    case "PURSE_FUNDING":
      return <Wallet className={cn("text-emerald-500", className)} />
    case "GROUP_EGG_COMPLETED":
      return <Users className={cn("text-indigo-500", className)} />
    case "MARKET_SALE":
      return <TrendingUp className={cn("text-rose-500", className)} />
    case "MARKET_FOLLOW":
      return <Compass className={cn("text-orange-500", className)} />
    default:
      return <Feather className={cn("text-primary", className)} />
  }
}

// Background gradient/color themes for card styles
function getFeatherTheme(type: string) {
  switch (type) {
    case "MARKET_PURCHASE":
      return {
        bg: "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40",
        iconBg: "bg-violet-500/20",
        progressColor: "bg-violet-500",
        badge: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
        route: "/marketplace",
        actionText: "Explore Market",
        btnColor: "bg-violet-600 hover:bg-violet-700 text-white dark:bg-violet-600 dark:hover:bg-violet-750",
      }
    case "EGG_GOAL_MET":
      return {
        bg: "bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40",
        iconBg: "bg-amber-500/20",
        progressColor: "bg-amber-500",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
        route: "/savings/eggs",
        actionText: "Save Now",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700",
      }
    case "PURSE_FUNDING":
      return {
        bg: "bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40",
        iconBg: "bg-emerald-500/20",
        progressColor: "bg-emerald-500",
        badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
        route: "/nestpurse",
        actionText: "Fund Purse",
        btnColor: "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-750",
      }
    case "GROUP_EGG_COMPLETED":
      return {
        bg: "bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40",
        iconBg: "bg-indigo-500/20",
        progressColor: "bg-indigo-500",
        badge: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
        route: "/savings/group",
        actionText: "Group Savings",
        btnColor: "bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-600 dark:hover:bg-indigo-750",
      }
    case "MARKET_SALE":
      return {
        bg: "bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40",
        iconBg: "bg-rose-500/20",
        progressColor: "bg-rose-500",
        badge: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
        route: "/seller",
        actionText: "Go to Seller Hub",
        btnColor: "bg-rose-600 hover:bg-rose-700 text-white dark:bg-rose-600 dark:hover:bg-rose-750",
      }
    case "MARKET_FOLLOW":
      return {
        bg: "bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40",
        iconBg: "bg-orange-500/20",
        progressColor: "bg-orange-500",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
        route: "/marketplace/vendors",
        actionText: "Explore Vendors",
        btnColor: "bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-600 dark:hover:bg-orange-750",
      }
    default:
      return {
        bg: "bg-primary/10 border-primary/20 hover:border-primary/40",
        iconBg: "bg-primary/20",
        progressColor: "bg-primary",
        badge: "bg-primary/20 text-primary",
        route: "/",
        actionText: "Go to Dashboard",
        btnColor: "bg-primary hover:bg-primary/90 text-primary-foreground",
      }
  }
}

// User title ranking based on total feathers score
function getUserRank(totalScore: number) {
  if (totalScore >= 25) return { title: "GrowNest Legend 👑", desc: "You have mastered all facets of GrowNest!" }
  if (totalScore >= 15) return { title: "Elite Nester 🌟", desc: "A seasoned saver and active community member." }
  if (totalScore >= 5) return { title: "Rising Star 📈", desc: "You are actively building your financial future." }
  return { title: "Nest Explorer 🌱", desc: "Begin your savings journey and earn your first feather!" }
}

interface MilestoneCardStackProps {
  type: string
  currentLevel: number
  milestones: any[]
}

function MilestoneCardStack({ type, currentLevel, milestones }: MilestoneCardStackProps) {
  const theme = getFeatherTheme(type)
  const totalLevels = milestones.length

  return (
    <div className="relative w-20 h-16 shrink-0 select-none mx-auto sm:mx-0 sm:mr-4">
      {/* 3rd Card (Furthest Back) */}
      {totalLevels > 2 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl border bg-card shadow-xs transition-all duration-300 origin-bottom-right rotate-12 translate-x-5 translate-y-1 scale-90 z-0",
            currentLevel >= 3 ? "border-primary/40" : "border-muted/80"
          )}
        />
      )}

      {/* 2nd Card (Middle) */}
      {totalLevels > 1 && (
        <div 
          className={cn(
            "absolute inset-0 rounded-2xl border bg-card shadow-sm transition-all duration-300 origin-bottom-right -rotate-6 translate-x-2.5 translate-y-0.5 scale-95 z-10",
            currentLevel >= 2 ? "border-primary/40" : "border-muted/80"
          )}
        />
      )}

      {/* 1st Card (Front/Top) */}
      <div 
        className={cn(
          "absolute inset-0 rounded-2xl border bg-card shadow-md flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:rotate-3 z-20 overflow-hidden",
          currentLevel > 0 ? "border-primary/50" : "border-muted/95"
        )}
      >
        {/* Colorful icon or lock */}
        {currentLevel > 0 ? (
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", theme.iconBg)}>
            {getFeatherIcon(type, "h-4.5 w-4.5")}
          </div>
        ) : (
          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-muted/40 text-muted-foreground/60">
            <Lock className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Counter Badge (+X remaining levels) */}
        {totalLevels - currentLevel > 0 && (
          <span className="absolute bottom-1 right-1 text-[8px] font-black tracking-tighter px-0.5 rounded bg-muted text-muted-foreground">
            +{totalLevels - currentLevel}
          </span>
        )}
      </div>
    </div>
  )
}

function UserRankFeatherStack({ feathers }: { feathers: any[] }) {
  const activeCount = feathers.filter((f: any) => f.level > 0).length
  
  return (
    <div className="relative w-24 h-20 shrink-0 select-none mx-auto sm:mx-0 sm:mr-4">
      {/* Back card */}
      <div className="absolute inset-0 rounded-2xl border bg-card border-rose-500/30 shadow-sm rotate-12 translate-x-6 scale-90 z-0 flex items-center justify-center">
        <TrendingUp className="h-6 w-6 text-rose-500/80" />
      </div>

      {/* Middle card */}
      <div className="absolute inset-0 rounded-2xl border bg-card border-emerald-500/30 shadow-sm -rotate-6 translate-x-3 scale-95 z-10 flex items-center justify-center">
        <Wallet className="h-6 w-6 text-emerald-500/80" />
      </div>

      {/* Front card */}
      <div className="absolute inset-0 rounded-2xl border border-amber-500/30 bg-card shadow-md z-20 flex flex-col items-center justify-center overflow-hidden">
        <Award className="h-8 w-8 text-amber-500 animate-pulse" />
        <span className="absolute bottom-1 right-2 text-[9px] font-black tracking-tighter px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          +{activeCount}
        </span>
      </div>
    </div>
  )
}

const QUOTES = [
  "Consistency beats intensity. Earning feathers isn't just a game; it's a measure of our financial intelligence.",
  "Small savings today build giant nests tomorrow. Every feather unlocked is a step closer to financial peace!",
  "A fully feathered nest starts with a single straw. Regular contributions are the building blocks of wealth.",
  "Financial discipline is not about having less; it's about making what you have work for your future self.",
  "The secret of getting ahead is getting started. Hatching my first egg was the best financial move I made!",
  "Save money and money will save you. Leveling up my savings goals has never felt this rewarding!",
  "Wealth is not about having a lot of money; it's about having a lot of options. Keep earning those feathers!"
]

// Motivation message helper
function getMotivationMessage(feather: any) {
  if (!feather) return ""
  const count = feather.count || 0
  const nextMilestone = feather.nextMilestone
  
  if (nextMilestone) {
    const remaining = nextMilestone.threshold - count
    if (remaining <= 0) {
      return "You've met the threshold! Refresh to update your rank."
    } else if (remaining === 1) {
      return "Just 1 more action to level up! You've got this! 🚀"
    } else {
      return `Complete ${remaining} more actions to unlock the next level!`
    }
  } else {
    return "Spectacular! You've mastered all milestones in this category! 👑"
  }
}

export function NestFeathersDashboard() {
  const isMobile = useIsMobile()
  const { feathers, isLoading, error, mutate } = useNestFeathers()
  const { profile } = useProfile()
  const [selectedFeather, setSelectedFeather] = React.useState<any>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [quote, setQuote] = React.useState("")

  React.useEffect(() => {
    const randomIndex = Math.floor(Math.random() * QUOTES.length)
    setQuote(QUOTES[randomIndex])
  }, [])

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
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Nest Feathers</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
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
          </div>
        </header>

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
                <div className="h-10 w-10 rounded-full bg-primary/10 border flex items-center justify-center text-primary font-bold text-sm">
                  {profile?.fullName
                    ? profile.fullName.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                    : "GN"}
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm text-foreground leading-none">
                      {profile?.fullName || "GrowNester"}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      @{profile?.email?.split("@")[0] || "nester"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
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
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black tracking-wide">
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
                  6 Categories <ChevronRight className="h-4 w-4 rotate-90" />
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
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0", theme.badge)}>
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
                        <p className="text-[10px] text-muted-foreground/80 font-semibold truncate leading-none pt-0.5">
                          Next target: <span className="font-bold text-foreground">{feather.nextMilestone.label}</span> ({feather.nextMilestone.threshold})
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-bold leading-none pt-0.5">
                          🎉 Max level reached!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-[10px] font-black tracking-tight text-muted-foreground">
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
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted transition-colors text-[10px]">
                        🔥 <span className="text-foreground">{feather.count}</span>
                      </div>
                      <div className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-muted/60 hover:bg-muted transition-colors text-[10px]">
                        👍 <span className="text-foreground">{currentLevel}/{maxLevel}</span>
                      </div>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 px-2 text-[10px] font-extrabold group-hover:text-primary transition-colors hover:bg-transparent p-0"
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
          <Drawer open={!!selectedFeather} onOpenChange={(open) => !open && setSelectedFeather(null)}>
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
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider", getFeatherTheme(selectedFeather.type).badge)}>
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
                  
                  <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">
                    <FeatherMilestonesList feather={selectedFeather} />
                  </div>

                  <DrawerFooter className="px-6 pb-6 gap-2 border-t pt-4 shrink-0">
                    <Button className={cn("w-full h-10 rounded-full font-bold gap-2 text-xs", getFeatherTheme(selectedFeather.type).btnColor)} asChild>
                      <Link href={getFeatherTheme(selectedFeather.type).route}>
                        {getFeatherTheme(selectedFeather.type).actionText}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DrawerClose asChild>
                      <Button variant="ghost" className="h-10 rounded-full font-semibold text-xs">Close</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </div>
              )}
            </DrawerContent>
          </Drawer>
        ) : (
          <Dialog open={!!selectedFeather} onOpenChange={(open) => !open && setSelectedFeather(null)}>
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
                        <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider mt-1 sm:mt-0 self-center sm:self-auto", getFeatherTheme(selectedFeather.type).badge)}>
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
                    <Button className={cn("w-full px-8 h-10 rounded-full font-bold gap-2 text-xs mx-auto", getFeatherTheme(selectedFeather.type).btnColor)} asChild>
                      <Link href={getFeatherTheme(selectedFeather.type).route}>
                        {getFeatherTheme(selectedFeather.type).actionText}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        )}

      </SidebarInset>
    </SidebarProvider>
  )
}

// Sub-component to render the milestone steps inside modal/drawer as mini-cards
function FeatherMilestonesList({ feather }: { feather: any }) {
  const currentLevel = feather.level || 0
  const theme = getFeatherTheme(feather.type)

  const ropeGradient = "from-primary/70 via-primary/45 to-primary/15"

  return (
    <div className="relative py-2 px-2 space-y-4 overflow-hidden">
      {/* Left Rope */}
      <div className={cn("absolute left-8 sm:left-10 top-8 bottom-8 w-1.5 bg-linear-to-b rounded-full z-0 opacity-60 shadow-xs border-r border-white/10", ropeGradient)} />
      {/* Right Rope */}
      <div className={cn("absolute right-8 sm:right-10 top-8 bottom-8 w-1.5 bg-linear-to-b rounded-full z-0 opacity-60 shadow-xs border-l border-white/10", ropeGradient)} />

      {feather.milestones.map((m: any, idx: number) => {
        const isUnlocked = currentLevel >= m.level
        const isNext = !isUnlocked && (idx === 0 || currentLevel >= feather.milestones[idx - 1]?.level)
        const isEven = idx % 2 === 0

        return (
          <div 
            key={m.level} 
            className={cn(
              "flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300 relative z-10 mx-2 sm:mx-4 bg-card cursor-pointer shadow-sm hover:shadow-md",
              isEven 
                ? "rotate-2 translate-x-1 hover:rotate-0 hover:translate-x-0 hover:scale-[1.03] hover:z-20" 
                : "-rotate-2 -translate-x-1 hover:rotate-0 hover:translate-x-0 hover:scale-[1.03] hover:z-20",
              isUnlocked 
                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-500/20 text-foreground" 
                : isNext 
                  ? "bg-amber-50 dark:bg-amber-950 border-primary/20 text-foreground" 
                  : "bg-card border-muted/30 text-muted-foreground/60"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {/* Status Indicator Icon */}
                <div 
                  className={cn(
                    "h-8 w-8 rounded-full border flex items-center justify-center shrink-0",
                    isUnlocked && "border-emerald-500 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-950/30",
                    isNext && "border-primary bg-primary/10 text-primary",
                    !isUnlocked && !isNext && "border-muted text-muted-foreground/60"
                  )}
                >
                  {isUnlocked ? (
                    <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white dark:fill-transparent" />
                  ) : isNext ? (
                    <Trophy className="h-4 w-4" />
                  ) : (
                    <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  )}
                </div>

                <div>
                  <h4 
                    className={cn(
                      "text-xs sm:text-sm font-bold tracking-tight leading-none",
                      (isUnlocked || isNext) ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {m.label}
                  </h4>
                  <p className={cn(
                    "text-[10px] font-semibold mt-1.5",
                    (isUnlocked || isNext) ? "text-muted-foreground" : "text-muted-foreground/50"
                  )}>
                    Level {m.level} • Requires {m.threshold} actions
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <span 
                className={cn(
                  "text-[8px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shrink-0",
                  isUnlocked && "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                  isNext && "bg-primary/10 text-primary",
                  !isUnlocked && !isNext && "bg-muted text-muted-foreground"
                )}
              >
                {isUnlocked ? "Unlocked" : isNext ? "In Progress" : "Locked"}
              </span>
            </div>

            {/* Next Milestone Progress bar */}
            {isNext && (
              <div className="pt-2.5 border-t border-primary/10 mt-0.5">
                <div className="flex justify-between text-[9px] font-black tracking-tight text-muted-foreground mb-1.5">
                  <span>Target Progress</span>
                  <span>{feather.count} / {m.threshold} actions</span>
                </div>
                <div className="relative w-full h-1.5 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, (feather.count / m.threshold) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function Page() {
  return (
    <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <NestFeathersDashboard />
    </React.Suspense>
  )
}
