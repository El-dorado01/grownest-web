// components/nesteggs/create-goal-sheet.tsx
"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, LockIcon, ZapIcon } from "lucide-react"
import { toast } from "sonner"
import { nestEggsApi } from "@/lib/nesteggs-api"
import { COVER_PICKER_LIST } from "@/components/nesteggs/cover-icon"
import type { NestEgg, NestEggFrequency } from "@/types/nesteggs"

const DURATION_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "6 months", value: 180 },
  { label: "1 year", value: 365 },
]

interface CreateGoalSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (egg: NestEgg) => void
}

export function CreateGoalSheet({ open, onClose, onCreated }: CreateGoalSheetProps) {
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  // Step 1
  const [title, setTitle] = useState("")
  const [cover, setCover] = useState("house")
  const [isFixed, setIsFixed] = useState(false)

  // Step 2
  const [targetAmount, setTargetAmount] = useState("")
  const [durationDays, setDurationDays] = useState(90)
  const [isAutoSave, setIsAutoSave] = useState(false)
  const [autoSaveAmount, setAutoSaveAmount] = useState("")
  const [frequency, setFrequency] = useState<NestEggFrequency>("monthly")

  const handleClose = () => {
    setStep(1)
    setTitle("")
    setCover("house")
    setIsFixed(false)
    setTargetAmount("")
    setDurationDays(90)
    setIsAutoSave(false)
    setAutoSaveAmount("")
    setFrequency("monthly")
    onClose()
  }

  const handleNext = () => {
    if (!title.trim()) {
      toast.error("Enter a goal name")
      return
    }
    setStep(2)
  }

  const handleCreate = async () => {
    const numTarget = parseFloat(targetAmount)
    if (!numTarget || numTarget <= 0) {
      toast.error("Enter a valid target amount")
      return
    }
    if (isFixed && durationDays < 15) {
      toast.error("Fixed goals require a minimum duration of 15 days")
      return
    }
    if (durationDays < 1) {
      toast.error("Enter a valid duration")
      return
    }
    if (isAutoSave) {
      const numAutoSave = parseFloat(autoSaveAmount)
      if (!numAutoSave || numAutoSave <= 0) {
        toast.error("Enter a valid auto-save amount")
        return
      }
      if (numAutoSave > numTarget) {
        toast.error("Auto-save amount cannot exceed target")
        return
      }
    }

    setIsLoading(true)
    try {
      const { data, error } = await nestEggsApi.create({
        title: title.trim(),
        cover,
        targetAmount: numTarget,
        durationDays,
        isFixed,
        isAutoSave,
        ...(isAutoSave
          ? { frequency, autoSaveAmount: parseFloat(autoSaveAmount) }
          : {}),
      })

      if (error) {
        toast.error(error)
        return
      }

      toast.success(`"${title}" goal created!`)
      onCreated(data!.nestEgg as unknown as NestEgg)
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {step === 1 ? "New Savings Goal" : "Set Your Target"}
          </SheetTitle>
        </SheetHeader>

        {/* Step indicator */}
        <div className="flex gap-1.5 mb-6 px-4">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-4 pb-4">
          {step === 1 ? (
            <>
              {/* Goal name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Goal Name</label>
                <Input
                  placeholder="e.g. New Car, Dream House..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={50}
                   className="h-11 bg-card"
                />
              </div>

              {/* Cover picker */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Cover</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 py-5 px-2 max-h-56 overflow-y-auto pr-1">
                  {COVER_PICKER_LIST.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setCover(item.name)}
                      className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all ${
                        cover === item.name
                          ? "bg-primary/20 ring-2 ring-primary"
                          : "bg-muted hover:bg-muted/80"
                      }`}
                    >
                      <item.Icon className={`w-5 h-5 ${cover === item.name ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-1">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Savings type */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Savings Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFixed(false)}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      !isFixed
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <ZapIcon
                      className={`w-4 h-4 mb-1 ${!isFixed ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className={`text-sm font-semibold ${!isFixed ? "text-primary" : "text-foreground"}`}>
                      Flexible
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Emergency 5% access</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFixed(true)}
                    className={`rounded-xl p-3 text-left border transition-all ${
                      isFixed
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:bg-muted/50"
                    }`}
                  >
                    <LockIcon
                      className={`w-4 h-4 mb-1 ${isFixed ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className={`text-sm font-semibold ${isFixed ? "text-primary" : "text-foreground"}`}>
                      Fixed
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Locked + 1% interest</p>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Target amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Target Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="e.g. 500000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min={1}
                  className="h-11 bg-card"  
                />
              </div>

              {/* Duration */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Duration</label>
                  {isFixed && (
                    <span className="text-xs text-primary font-medium">Min. 15 days for Fixed</span>
                  )}
                </div>
                {/* Quick-pick chips */}
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationDays(opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${
                        durationDays === opt.value
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {/* Custom days input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={isFixed ? 15 : 1}
                    max={1095}
                    value={durationDays}
                    onChange={(e) => {
                      const val = parseInt(e.target.value)
                      if (!isNaN(val) && val > 0) setDurationDays(val)
                    }}
                    className="h-11 bg-card"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">days</span>
                </div>
              </div>

              {/* Auto-save toggle */}
              {(
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Auto-Save</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically deduct from NestPurse
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAutoSave(!isAutoSave)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        isAutoSave ? "bg-primary" : "bg-border"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          isAutoSave ? "translate-x-0.8" : "-translate-x-5"
                        }`}
                      />
                    </button>
                  </div>
                  {isAutoSave && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Amount (₦)
                        </label>
                        <Input
                          type="number"
                          placeholder="e.g. 5000"
                          value={autoSaveAmount}
                          onChange={(e) => setAutoSaveAmount(e.target.value)}
                          className="h-11 bg-card"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Frequency
                        </label>
                        <Select
                          value={frequency}
                          onValueChange={(v) => setFrequency(v as NestEggFrequency)}
                        >
                          <SelectTrigger style={{ height: "44px"}}>
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
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-border px-4">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={handleClose} className="flex-1 h-11 bg-card">
                Cancel
              </Button>
              <Button onClick={handleNext} className="flex-1 h-11 text-foreground">
                Next →
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11">
                ← Back
              </Button>
              <Button onClick={handleCreate} disabled={isLoading} className="flex-1 h-11 text-foreground">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create Goal
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
