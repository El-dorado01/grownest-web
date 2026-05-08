// components/nesteggs/withdraw-modals.tsx
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, AlertTriangleIcon } from "lucide-react"
import { toast } from "sonner"
import { nestEggsApi } from "@/lib/nesteggs-api"
import type { NestEgg } from "@/types/nesteggs"

// ─── Flexible Withdrawal ─────────────────────────────────────────────────────

interface FlexibleWithdrawModalProps {
  open: boolean
  onClose: () => void
  egg: NestEgg
  onSuccess: () => void
  formatCurrency: (n: number) => string
}

export function FlexibleWithdrawModal({
  open,
  onClose,
  egg,
  onSuccess,
  formatCurrency,
}: FlexibleWithdrawModalProps) {
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const lifetimeUsedPercent = egg.totalWithdrawnPercent * 100
  const lifetimeRemainingPercent = Math.max(0, 5 - lifetimeUsedPercent)
  const maxFromTarget = egg.targetAmount * 0.05
  const alreadyWithdrawn = egg.targetAmount * egg.totalWithdrawnPercent
  const remainingAllowance = Math.max(0, maxFromTarget - alreadyWithdrawn)
  const maxWithdrawable = Math.min(egg.savedAmount, remainingAllowance)
  const hasOutstandingDebt = !egg.lastWithdrawalRepaid && egg.totalWithdrawnPercent > 0

  const handleClose = () => {
    setAmount("")
    onClose()
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (numAmount > maxWithdrawable + 0.01) {
      toast.error(`Maximum withdrawable is ${formatCurrency(maxWithdrawable)}`)
      return
    }

    setIsLoading(true)
    try {
      const { error } = await nestEggsApi.manualWithdraw({
        nestEggId: egg.id,
        amount: numAmount,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success(`${formatCurrency(numAmount)} withdrawn to your NestPurse`)
      onSuccess()
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Flexible Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              You can withdraw up to <strong>5%</strong> of your target lifetime.
              Used: <strong>{lifetimeUsedPercent.toFixed(2)}%</strong> — Remaining:{" "}
              <strong>{lifetimeRemainingPercent.toFixed(2)}%</strong>. You must repay before
              withdrawing again.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Max withdrawable:{" "}
            <strong className="text-foreground">{formatCurrency(maxWithdrawable)}</strong>
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Amount (₦)</label>
            <Input
              type="number"
              placeholder={`Max ${formatCurrency(maxWithdrawable)}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading || maxWithdrawable <= 0}
              max={maxWithdrawable}
              min={1}
              className="h-11 bg-card"
            />
          </div>
          {hasOutstandingDebt && (
            <p className="text-xs text-destructive">
              You must repay your previous flexible withdrawal before making another.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || maxWithdrawable <= 0 || hasOutstandingDebt}
            variant="destructive"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Withdraw
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Repay Withdrawal ─────────────────────────────────────────────────────────

interface RepayWithdrawalModalProps {
  open: boolean
  onClose: () => void
  egg: NestEgg
  outstanding: number
  onSuccess: () => void
  formatCurrency: (n: number) => string
}

export function RepayWithdrawalModal({
  open,
  onClose,
  egg,
  outstanding,
  onSuccess,
  formatCurrency,
}: RepayWithdrawalModalProps) {
  const [amount, setAmount] = useState(String(outstanding > 0 ? outstanding : ""))
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    setAmount(String(outstanding > 0 ? outstanding : ""))
    onClose()
  }

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (numAmount > outstanding + 0.01) {
      toast.error(`Outstanding debt is ${formatCurrency(outstanding)}`)
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await nestEggsApi.repayWithdrawal({
        nestEggId: egg.id,
        amount: numAmount,
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success(
        data!.fullyRepaid
          ? "Withdrawal fully repaid!"
          : `${formatCurrency(numAmount)} repaid — ${formatCurrency(data!.remainingOutstanding)} remaining`
      )
      onSuccess()
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Repay Withdrawal</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <p className="text-sm text-muted-foreground">
            Outstanding debt:{" "}
            <span className="font-semibold text-foreground">{formatCurrency(outstanding)}</span>
          </p>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Repayment Amount (₦)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              max={outstanding}
              min={1}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Repay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
