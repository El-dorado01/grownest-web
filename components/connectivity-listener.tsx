"use client"

import * as React from "react"
import { WifiOffIcon, WifiIcon, SignalLowIcon, AlertTriangleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type ConnectionState = "online" | "offline" | "weak"

export function ConnectivityListener() {
  const [state, setState] = React.useState<ConnectionState>("online")
  const [visible, setVisible] = React.useState(false)
  const [showBackOnline, setShowBackOnline] = React.useState(false)

  React.useEffect(() => {
    const updateStatus = () => {
      const isOnline = navigator.onLine
      
      if (!isOnline) {
        setState("offline")
        setVisible(true)
        setShowBackOnline(false)
        return
      }

      // Check for weak connection if supported
      const conn = (navigator as any).connection
      if (conn && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) {
        setState("weak")
        setVisible(true)
        setShowBackOnline(false)
        return
      }

      // If we were offline/weak and now we are good
      if (state !== "online") {
        setState("online")
        setShowBackOnline(true)
        setVisible(true)
        const timer = setTimeout(() => {
          setVisible(false)
          setShowBackOnline(false)
        }, 4000)
        return () => clearTimeout(timer)
      } else {
        setVisible(false)
      }
    }

    window.addEventListener("online", updateStatus)
    window.addEventListener("offline", updateStatus)

    const conn = (navigator as any).connection
    if (conn) {
      conn.addEventListener("change", updateStatus)
    }

    // Initial check
    updateStatus()

    return () => {
      window.removeEventListener("online", updateStatus)
      window.removeEventListener("offline", updateStatus)
      if (conn) {
        conn.removeEventListener("change", updateStatus)
      }
    }
  }, [state])

  if (!visible) return null

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-9999 pointer-events-none sm:pointer-events-auto">
      <div 
        className={cn(
          "group flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-8 min-w-[320px]",
          state === "offline" && "bg-destructive/10 border-destructive/20 text-destructive",
          state === "weak" && "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
          showBackOnline && "bg-primary/10 border-primary/20 text-primary"
        )}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background/50 shadow-sm border border-white/10">
          {state === "offline" && <WifiOffIcon className="size-5 animate-pulse" />}
          {state === "weak" && <SignalLowIcon className="size-5 animate-pulse" />}
          {showBackOnline && <WifiIcon className="size-5" />}
        </div>
        
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-bold tracking-tight">
              {state === "offline" && "Connection Lost"}
              {state === "weak" && "Weak Signal Detected"}
              {showBackOnline && "Connection Restored"}
            </span>
            {state !== "online" && (
              <span className="flex h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            )}
          </div>
          <span className="text-[11px] font-medium opacity-80 leading-none">
            {state === "offline" && "Please check your internet settings"}
            {state === "weak" && "Your connection is currently unstable"}
            {showBackOnline && "You're back online and ready to go"}
          </span>
        </div>
      </div>
    </div>
  )
}
