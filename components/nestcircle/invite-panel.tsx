"use client"

import * as React from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { CheckCircle2, Copy, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

interface InvitePanelProps {
  referralCode: string
  referralLink: string
  copied: boolean
  onCopy: () => void
  onShare: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InvitePanel({
  referralCode,
  referralLink,
  copied,
  onCopy,
  onShare,
  open,
  onOpenChange,
}: InvitePanelProps) {
  const isMobile = useIsMobile()

  const content = (
    <div className="space-y-5 px-1 py-2 text-left">
      <div className="text-center space-y-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your unique referral code</p>
        <div className="inline-flex items-center gap-3 bg-muted border border-border rounded-xl px-6 py-3 mt-1.5">
          <p className="text-2xl font-bold tracking-[0.2em] font-mono text-foreground">
            {referralCode}
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-muted-foreground">Referral Link</label>
        <div className="bg-muted/50 border border-border rounded-xl p-3 break-all text-xs font-mono text-muted-foreground">
          {referralLink}
        </div>
      </div>

      <div className="flex gap-2.5 w-full pt-2">
        <Button
          className="flex-1 font-bold h-11 rounded-xl cursor-pointer"
          onClick={onCopy}
        >
          {copied ? <CheckCircle2 className="w-4 h-4 mr-1.5 text-primary-foreground" /> : <Copy className="w-4 h-4 mr-1.5" />}
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button
          variant="outline"
          className="flex-1 font-bold h-11 rounded-xl cursor-pointer"
          onClick={onShare}
        >
          <Share2 className="w-4 h-4 mr-1.5" /> Share Link
        </Button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="px-4 pb-8 flex flex-col">
          <DrawerHeader className="text-left pb-2">
            <DrawerTitle>Invite Friends</DrawerTitle>
            <DrawerDescription>Share your link. You and your friend both earn 500 points on verification.</DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>Share your link. You and your friend both earn 500 points on verification.</DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
