// components/nesteggs/autosave-card.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, ZapIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { nestEggsApi } from "@/lib/nesteggs-api"
import type { NestEgg, NestEggFrequency } from "@/types/nesteggs"

interface AutoSaveCardProps {
  egg: NestEgg
  onUpdate: (updated: Partial<NestEgg>) => void
}

export function AutoSaveCard({ egg, onUpdate }: AutoSaveCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newAmount, setNewAmount] = useState(String(egg.autoSaveAmount ?? ""))
  const [newFrequency, setNewFrequency] = useState<NestEggFrequency>(egg.frequency ?? "monthly")

  const call = async (
    payload: Parameters<typeof nestEggsApi.updateAutoSave>[1],
    successMsg: string
  ) => {
    setIsLoading(true)
    try {
      const { data, error } = await nestEggsApi.updateAutoSave(egg.id, payload)
      if (error) {
        toast.error(error)
        return
      }
      toast.success(successMsg)
      onUpdate({
        isAutoSave: data!.isAutoSave,
        isAutoSavePaused: data!.isAutoSavePaused,
        autoSaveAmount: data!.autoSaveAmount,
        frequency: data!.frequency,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnable = () =>
    call(
      { isAutoSave: true, frequency: newFrequency, autoSaveAmount: parseFloat(newAmount) },
      "Auto-save enabled!"
    )

  const handleDisable = () => call({ isAutoSave: false }, "Auto-save disabled")

  const handlePause = () => call({ isAutoSavePaused: true }, "Auto-save paused")

  const handleResume = () => call({ isAutoSavePaused: false }, "Auto-save resumed!")

  const handleUpdate = async () => {
    await call(
      { autoSaveAmount: parseFloat(newAmount), frequency: newFrequency },
      "Auto-save settings updated"
    )
    setIsEditing(false)
  }

  // Not enabled
  if (!egg.isAutoSave) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <ZapIcon className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Auto-Save</p>
          <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            Off
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (₦)</label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                disabled={isLoading}
                className="h-11 bg-card"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
              <Select
                value={newFrequency}
                onValueChange={(v) => setNewFrequency(v as NestEggFrequency)}
                disabled={isLoading}
              >
                <SelectTrigger style={{height: "44px"}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="p-2">
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleEnable}
            disabled={isLoading || !newAmount || parseFloat(newAmount) <= 0}
            className="w-full h-11"
            size="sm"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ZapIcon className="w-4 h-4 mr-2" />
            )}
            Enable Auto-Save
          </Button>
        </div>
      </div>
    )
  }

  // Enabled
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <ZapIcon className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold">Auto-Save</p>
        <span
          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            egg.isAutoSavePaused
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {egg.isAutoSavePaused ? "Paused" : "Active"}
        </span>
      </div>

      {!isEditing ? (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground capitalize">{egg.frequency}</span>
            <span className="font-semibold">₦{egg.autoSaveAmount?.toLocaleString()}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {egg.isAutoSavePaused ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleResume}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <PlayIcon className="w-3 h-3 mr-1" />
                )}
                Resume
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePause}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <PauseIcon className="w-3 h-3 mr-1" />
                )}
                Pause
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="flex-1"
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisable}
              disabled={isLoading}
              className="text-muted-foreground hover:text-destructive"
            >
              <XIcon className="w-3 h-3" />
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Amount (₦)</label>
              <Input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
              <Select
                value={newFrequency}
                onValueChange={(v) => setNewFrequency(v as NestEggFrequency)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
