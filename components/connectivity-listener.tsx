"use client"

import * as React from "react"
import { toast } from "sonner"
import { WifiOffIcon, WifiIcon } from "lucide-react"

export function ConnectivityListener() {
  const toastIdRef = React.useRef<string | number | null>(null)

  React.useEffect(() => {
    const handleOnline = () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
        toastIdRef.current = null
        toast.success("Back online", {
          description: "Your internet connection has been restored.",
          icon: <WifiIcon className="size-4 text-green-500" />,
          duration: 3000,
        })
      }
    }

    const handleOffline = () => {
      // Avoid multiple toasts if already offline
      if (toastIdRef.current) return;

      toastIdRef.current = toast.error("No internet connection", {
        description: "Please check your network settings. Some features may be unavailable.",
        icon: <WifiOffIcon className="size-4 text-red-500" />,
        duration: Infinity, // Persistent until back online
      })
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Initial check for users who load the page while offline
    if (typeof window !== "undefined" && !navigator.onLine) {
      handleOffline()
    }

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [])

  return null
}
