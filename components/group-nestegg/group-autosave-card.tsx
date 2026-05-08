// components/group-nestegg/group-autosave-card.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, ZapIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import type { GroupMember, GroupFrequency } from "@/types/group-nestegg"

interface GroupAutoSaveCardProps {
  groupId: string
  myMember: GroupMember
  onUpdate: (updated: Partial<GroupMember>) => void
}

export function GroupAutoSaveCard({ groupId, myMember, onUpdate }: GroupAutoSaveCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState(String(myMember.autoSaveAmount ?? ""))
  const [frequency, setFrequency] = useState<GroupFrequency>(myMember.frequency ?? "monthly")
  const [pin, setPin] = useState("")
  const [requirePin, setRequirePin] = useState(false)

  const handleEnable = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { toast.error("Enter a valid amount"); return }

    setIsLoading(true)
    try {
      const { data, error } = await groupNestEggApi.enableAutoSave(groupId, {
        autoSaveAmount: numAmount,
        frequency,
        ...(requirePin && pin ? { pin } : {}),
      })

      if (error) {
        if (error.includes("PIN required") || error.includes("requirePin")) {
          setRequirePin(true)
          toast.info("Enter your 4-digit transaction PIN to confirm")
          return
        }
        toast.error(error)
        return
      }

      if ((data as any)?.requirePin) {
        setRequirePin(true)
        toast.info("Enter your 4-digit transaction PIN to confirm")
        return
      }

      toast.success("Auto-save enabled!")
      setRequirePin(false); setPin("")
      onUpdate({ isAutoSaveEnabled: true, autoSaveAmount: numAmount, frequency, isAutoSavePaused: false })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = async () => {
    setIsLoading(true)
    const { error } = await groupNestEggApi.updateAutoSave(groupId, { isAutoSavePaused: true })
    setIsLoading(false)
    if (error) { toast.error(error); return }
    toast.success("Auto-save paused")
    onUpdate({ isAutoSavePaused: true })
  }

  const handleResume = async () => {
    setIsLoading(true)
    const { error } = await groupNestEggApi.updateAutoSave(groupId, { isAutoSavePaused: false })
    setIsLoading(false)
    if (error) { toast.error(error); return }
    toast.success("Auto-save resumed!")
    onUpdate({ isAutoSavePaused: false })
  }

  const handleUpdate = async () => {
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { toast.error("Enter a valid amount"); return }
    setIsLoading(true)
    const { error } = await groupNestEggApi.updateAutoSave(groupId, { autoSaveAmount: numAmount })
    setIsLoading(false)
    if (error) { toast.error(error); return }
    toast.success("Auto-save updated")
    onUpdate({ autoSaveAmount: numAmount })
    setIsEditing(false)
  }

  const handleDisable = async () => {
    setIsLoading(true)
    const { error } = await groupNestEggApi.disableAutoSave(groupId)
    setIsLoading(false)
    if (error) { toast.error(error); return }
    toast.success("Auto-save disabled")
    onUpdate({ isAutoSaveEnabled: false, isAutoSavePaused: false, autoSaveAmount: null, frequency: null })
  }

  if (!myMember.isAutoSaveEnabled) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold">My Auto-Save</p>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Off</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Amount (₦)</label>
            <Input type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} className="h-11" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
            <Select value={frequency} onValueChange={(v) => setFrequency(v as GroupFrequency)} disabled={isLoading}>
              <SelectTrigger style={{height: "44px"}}><SelectValue /></SelectTrigger>
              <SelectContent className="p-2">
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {requirePin && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Transaction PIN</label>
            <Input
              type="password" placeholder="4-digit PIN" maxLength={4}
              value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              disabled={isLoading} className="tracking-widest text-center text-lg h-11"
            />
          </div>
        )}
        <Button onClick={handleEnable} disabled={isLoading || !amount} size="sm" className="w-full gap-1.5 h-11 text-foreground">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ZapIcon className="w-4 h-4" />}
          Enable Auto-Save
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ZapIcon className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">My Auto-Save</p>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${myMember.isAutoSavePaused ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
          {myMember.isAutoSavePaused ? "Paused" : "Active"}
        </span>
      </div>
      {!isEditing ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">{myMember.frequency}</span>
            <span className="font-semibold">₦{myMember.autoSaveAmount?.toLocaleString()}</span>
          </div>
          <div className="flex gap-2">
            {myMember.isAutoSavePaused ? (
              <Button size="sm" variant="outline" onClick={handleResume} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayIcon className="w-3 h-3 mr-1" />}
                Resume
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={handlePause} disabled={isLoading} className="flex-1">
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseIcon className="w-3 h-3 mr-1" />}
                Pause
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)} disabled={isLoading} className="flex-1">Edit</Button>
            <Button size="sm" variant="ghost" onClick={handleDisable} disabled={isLoading} className="text-muted-foreground hover:text-destructive">
              <XIcon className="w-3 h-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (₦)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isLoading} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as GroupFrequency)} disabled={isLoading}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleUpdate} disabled={isLoading} className="flex-1">
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}Save
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>Cancel</Button>
          </div>
        </>
      )}
    </div>
  )
}
