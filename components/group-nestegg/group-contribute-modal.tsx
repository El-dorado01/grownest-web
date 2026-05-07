// components/group-nestegg/group-contribute-modal.tsx
"use client"

import { useState } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { groupNestEggApi } from "@/lib/group-nestegg-api"

interface GroupContributeModalProps {
  open: boolean
  onClose: () => void
  groupId: string
  groupTitle: string
  onSuccess: (savedAmount: number, progress: number) => void
}

export function GroupContributeModal({
  open, onClose, groupId, groupTitle, onSuccess,
}: GroupContributeModalProps) {
  const [amount, setAmount] = useState("")
  const [pin, setPin] = useState("")
  const [requirePin, setRequirePin] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setAmount(""); setPin(""); setRequirePin(false)
    onClose()
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { toast.error("Enter a valid amount"); return }

    setIsLoading(true)
    try {
      const { data, error } = await groupNestEggApi.contribute({
        groupNestEggId: groupId,
        amount: numAmount,
        ...(requirePin && pin ? { pin } : {}),
      })

      if (error) {
        if (error.includes("PIN required") || error.includes("requirePin")) {
          setRequirePin(true)
          toast.info("Please enter your 4-digit transaction PIN")
          return
        }
        toast.error(error)
        return
      }

      if ((data as any)?.requirePin) {
        setRequirePin(true)
        toast.info("Please enter your 4-digit transaction PIN")
        return
      }

      toast.success(`₦${numAmount.toLocaleString()} added to "${groupTitle}"`)
      onSuccess(data!.savedAmount, data!.progress)
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Contribute to Group</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Contributing to <span className="font-medium text-foreground">{groupTitle}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Amount (₦)</label>
            <Input
              type="number"
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              min={1}
            />
          </div>
          {requirePin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Transaction PIN</label>
              <Input
                type="password"
                placeholder="4-digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                disabled={isLoading}
                className="tracking-widest text-center text-lg"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {requirePin ? "Confirm" : "Contribute"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
