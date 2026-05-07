"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
  className?: string
  icon?: React.ReactNode
}

export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load the information. Please check your internet connection and try again.",
  onRetry,
  isRetrying = false,
  className,
  icon
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-destructive/10 bg-destructive/5",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive shadow-inner">
        {icon || <WifiOff className="h-8 w-8" />}
      </div>
      
      <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-[280px] leading-relaxed mb-8">
        {message}
      </p>

      {onRetry && (
        <Button 
          onClick={onRetry} 
          disabled={isRetrying}
          variant="outline"
          className="rounded-xl h-11 px-8 gap-2 bg-background hover:bg-muted transition-all shadow-sm"
        >
          <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>
      )}
    </motion.div>
  )
}
