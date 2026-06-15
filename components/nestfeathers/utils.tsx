"use client"

import * as React from "react"
import { 
  Award, 
  ShoppingCart, 
  Wallet, 
  Users, 
  TrendingUp, 
  Compass, 
  Feather, 
  Smartphone 
} from "lucide-react"
import { cn } from "@/lib/utils"

// Icon mapping based on feather types
export function getFeatherIcon(type: string, className?: string) {
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
    case "AIRTIME_PURCHASE":
      return <Smartphone className={cn("text-sky-500", className)} />
    default:
      return <Feather className={cn("text-primary", className)} />
  }
}

// Background gradient/color themes for card styles
export function getFeatherTheme(type: string) {
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
    case "AIRTIME_PURCHASE":
      return {
        bg: "bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40",
        iconBg: "bg-sky-500/20",
        progressColor: "bg-sky-500",
        badge: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
        route: "#",
        actionText: "Buy Airtime",
        btnColor: "bg-sky-600 hover:bg-sky-700 text-white dark:bg-sky-600 dark:hover:bg-sky-750",
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
export function getUserRank(totalScore: number) {
  if (totalScore >= 25) return { title: "GrowNest Legend 👑", desc: "You have mastered all facets of GrowNest!" }
  if (totalScore >= 15) return { title: "Elite Nester 🌟", desc: "A seasoned saver and active community member." }
  if (totalScore >= 5) return { title: "Rising Star 📈", desc: "You are actively building your financial future." }
  return { title: "Nest Explorer 🌱", desc: "Begin your savings journey and earn your first feather!" }
}

export const QUOTES = [
  "Consistency beats intensity. Earning feathers isn't just a game; it's a measure of our financial intelligence.",
  "Small savings today build giant nests tomorrow. Every feather unlocked is a step closer to financial peace!",
  "A fully feathered nest starts with a single straw. Regular contributions are the building blocks of wealth.",
  "Financial discipline is not about having less; it's about making what you have work for your future self.",
  "The secret of getting ahead is getting started. Hatching my first egg was the best financial move I made!",
  "Save money and money will save you. Leveling up my savings goals has never felt this rewarding!",
  "Wealth is not about having a lot of money; it's about having a lot of options. Keep earning those feathers!"
]

// Motivation message helper
export function getMotivationMessage(feather: any) {
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
