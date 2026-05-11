"use client"

import * as React from "react"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { useIsMobile } from "@/hooks/use-mobile"
import { useProfile } from "@/hooks/use-profile"
import { useAuth } from "@/context/auth-context"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Dashboard } from "@/app/page"
import Image from "next/image"
import Link from "next/link"

export default function OnboardingPage() {
  const isMobile = useIsMobile()
  const router = useRouter()
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth()
  const { profile, isLoading: isProfileLoading } = useProfile()

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/signup")
      return
    }

    if (!isProfileLoading && profile && !profile.isVerified) {
      router.push("/signup/verify")
    }
  }, [profile, isProfileLoading, isAuthLoading, isAuthenticated, router])

  const isLoading = isAuthLoading || isProfileLoading

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">
            Loading your profile...
          </p>
        </div>
      </div>
    )
  }

  // On mobile, we render it directly (full screen) as requested earlier
  // but with the dashboard background if possible.
  // Actually, user wants "dashboard showing but the modal over the dashboard like the /settings"

  return (
    <div className="relative min-h-screen">
      {/* Dashboard as background */}
      <div className="pointer-events-none opacity-40 blur-[2px]">
        <Dashboard />
      </div>

      {isMobile ? (
        <Sheet open={true} onOpenChange={() => {}}>
          <SheetContent 
            side="right" 
            className="h-screen w-full sm:max-w-[766px] border-none p-0 bg-card overflow-y-auto scrollbar-none"
            showCloseButton={false}
          >
            <OnboardingWizard />
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent
            className="fixed left-1/2 top-1/2 z-50 h-auto max-h-[90vh] w-full max-w-[650px]! -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-none bg-card p-0 shadow-2xl scrollbar-none"
            showCloseButton={false}
            onPointerDownOutside={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <OnboardingWizard />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
