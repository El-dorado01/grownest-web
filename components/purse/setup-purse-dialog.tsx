"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { WalletIcon, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from "lucide-react"
import { nestPurseApi } from "@/lib/nestpurse-api"
import { toast } from "sonner"
import { useProfile } from "@/hooks/use-profile"

interface SetupPurseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetupPurseDialog({ open, onOpenChange }: SetupPurseDialogProps) {
  const isMobile = useIsMobile()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const { mutate } = useProfile()

  const handleSetup = async () => {
    setIsSubmitting(true)
    try {
      const result = await nestPurseApi.setupPurse()
      if (result.data) {
        setIsSuccess(true)
        mutate()
        toast.success("NestPurse activated successfully!")
        setTimeout(() => {
          onOpenChange(false)
          // Reset state after closing
          setTimeout(() => setIsSuccess(false), 500)
        }, 3000)
      } else {
        toast.error(result.error || "Failed to setup NestPurse")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const content = (
    <div className="p-6 text-center">
      {isSuccess ? (
        <div className="flex flex-col items-center py-8 animate-in fade-in zoom-in duration-500">
          <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Activation Successful!</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Your virtual account has been created. You can now start receiving funds directly into your NestPurse.
          </p>
        </div>
      ) : (
        <div className="space-y-6 py-4">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <WalletIcon className="h-8 w-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Activate NestPurse</h2>
            <p className="text-muted-foreground leading-relaxed">
              Activate your secure wallet to start saving, spending, and investing on GrowNest. We'll generate a unique virtual account for you instantly.
            </p>
          </div>

          <div className="grid gap-3 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Secure Virtual Account</p>
                <p className="text-xs text-muted-foreground">Receive money from any Nigerian bank account.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 border border-transparent">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Instant Transfers</p>
                <p className="text-xs text-muted-foreground">Send and receive funds in seconds.</p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 text-base"
            onClick={handleSetup}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
            ) : (
              <><ShieldCheck className="mr-2 h-5 w-5" /> Activate My Purse Now</>
            )}
          </Button>
          
          <p className="text-[10px] text-muted-foreground opacity-70">
            By activating, you agree to our terms of service regarding virtual accounts and wallet operations.
          </p>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="outline-none">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Activate NestPurse</DrawerTitle>
            <DrawerDescription>Create your virtual account to get started.</DrawerDescription>
          </DrawerHeader>
          {content}
          <div className="p-4 pt-0">
             {!isSuccess && (
               <Button variant="ghost" className="w-full h-12 rounded-xl" onClick={() => onOpenChange(false)}>
                 Maybe Later
               </Button>
             )}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-none">
        <DialogHeader className="sr-only">
          <DialogTitle>Activate NestPurse</DialogTitle>
          <DialogDescription>Create your virtual account to get started.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
