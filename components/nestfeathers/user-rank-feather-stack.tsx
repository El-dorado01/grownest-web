"use client"

import * as React from "react"
import { Award, Wallet, TrendingUp } from "lucide-react"

interface UserRankFeatherStackProps {
  feathers: any[]
}

export function UserRankFeatherStack({ feathers }: UserRankFeatherStackProps) {
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
        <span className="absolute bottom-1 right-2 text-[10px] font-black tracking-tighter px-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          +{activeCount}
        </span>
      </div>
    </div>
  )
}
