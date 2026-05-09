"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { AlertCircle, RefreshCw, WifiOff, Loader2 } from "lucide-react"
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
  isRetrying: externalIsRetrying,
  className,
  icon
}: ErrorStateProps) {
  const [internalIsRetrying, setInternalIsRetrying] = React.useState(false)
  const isRetrying = Boolean(externalIsRetrying || internalIsRetrying)

  const handleRetry = async () => {
    if (!onRetry) return
    setInternalIsRetrying(true)
    try {
      await onRetry()
    } finally {
      // Small delay to ensure the user sees the success state/transition
      setTimeout(() => setInternalIsRetrying(false), 500)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border border-destructive/10 bg-destructive/5 w-full",
        className
      )}
    >
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6 text-destructive shadow-inner">
        {icon || <WifiOff className="h-8 w-8" />}
      </div>
      
      <h3 className="text-lg font-bold tracking-tight text-foreground mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-muted-foreground max-w-md leading-relaxed mb-8">
        {message}
      </p>

      {onRetry && (
        <Button 
          onClick={handleRetry} 
          disabled={isRetrying}
          variant="outline"
          className="rounded-xl h-11 px-8 gap-2 bg-background hover:bg-muted transition-all shadow-sm"
        >
          {isRetrying ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRetrying ? "Retrying..." : "Try Again"}
        </Button>
      )}
    </motion.div>
  )
}
