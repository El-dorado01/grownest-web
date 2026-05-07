// components/group-nestegg/create-group-sheet.tsx
"use client"

import { useState } from "react"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { groupNestEggApi } from "@/lib/group-nestegg-api"

const COVER_EMOJIS = ["👥", "🏠", "🚗", "✈️", "🎓", "💼", "🌱", "🎯", "💰", "🏋️", "🎁", "🔥"]

const DURATION_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
  { label: "6 months", value: 180 },
  { label: "1 year", value: 365 },
]

interface CreateGroupSheetProps {
  open: boolean
  onClose: () => void
  onCreated: (groupId: string) => void
}

export function CreateGroupSheet({ open, onClose, onCreated }: CreateGroupSheetProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [cover, setCover] = useState("👥")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [durationDays, setDurationDays] = useState(90)
  const [maxMembers, setMaxMembers] = useState(8)

  const handleClose = () => {
    setTitle(""); setCover("👥"); setDescription("")
    setTargetAmount(""); setDurationDays(90); setMaxMembers(8)
    onClose()
  }

  const handleCreate = async () => {
    if (!title.trim()) { toast.error("Enter a group name"); return }
    const numTarget = parseFloat(targetAmount)
    if (!numTarget || numTarget <= 0) { toast.error("Enter a valid target amount"); return }

    setIsLoading(true)
    try {
      const { data, error } = await groupNestEggApi.create({
        title: title.trim(),
        cover,
        description: description.trim() || undefined,
        targetAmount: numTarget,
        durationDays,
        maxMembers,
      })
      if (error) { toast.error(error); return }
      toast.success(`"${title}" group created!`)
      onCreated(data!.group.id)
      handleClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0">
        <SheetHeader className="pb-2">
          <SheetTitle>Create a Group Savings</SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-4 pb-4">
          {/* Group name + emoji preview */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Group Name</label>
            <div className="flex gap-2">
              <Input
                placeholder="Friends Investment Circle..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                className="flex-1"
              />
              <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">
                {cover}
              </div>
            </div>
          </div>

          {/* Cover emoji picker */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Group Icon</label>
            <div className="grid grid-cols-6 gap-2">
              {COVER_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setCover(emoji)}
                  className={`h-10 w-full rounded-xl text-xl flex items-center justify-center transition-all ${
                    cover === emoji
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Description (Optional)</label>
              <span className="text-xs text-muted-foreground">{description.length}/200</span>
            </div>
            <textarea
              placeholder="Let's grow our savings together!"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 200))}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
            />
          </div>

          {/* Target amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Target Amount (₦)</label>
            <Input
              type="number"
              placeholder="e.g. 2,500,000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              min={1}
            />
          </div>

          {/* Duration pills */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Duration</label>
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
          </div>

          {/* Max members slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Max Members</label>
              <span className="text-sm font-semibold text-primary">
                Members: {maxMembers}/20
              </span>
            </div>
            <input
              type="range"
              min={2}
              max={20}
              step={1}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>2</span>
              <span>20</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pt-4 pb-4 border-t border-border">
          <Button
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full h-11 gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create & Invite
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
