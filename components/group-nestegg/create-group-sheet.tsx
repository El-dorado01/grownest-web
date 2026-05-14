// components/group-nestegg/create-group-sheet.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, XIcon } from "lucide-react"
import { toast } from "sonner"
import { groupNestEggApi } from "@/lib/group-nestegg-api"
import { COVER_PICKER_LIST, CoverIcon } from "@/components/nesteggs/cover-icon"

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
  const [cover, setCover] = useState("house")
  const [description, setDescription] = useState("")
  const [targetAmount, setTargetAmount] = useState("")
  const [durationDays, setDurationDays] = useState(90)
  const [customDays, setCustomDays] = useState("")
  const [maxMembers, setMaxMembers] = useState(8)

  const handleClose = () => {
    setTitle(""); setDescription("")
    setTargetAmount(""); setDurationDays(90); setMaxMembers(8); setCustomDays(""); setCover("house")
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
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Sheet panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-popover flex flex-col shadow-2xl border-l border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="text-base font-semibold text-foreground">Create a Group Savings</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 flex flex-col gap-5 overflow-y-auto px-4 pb-4">
              {/* Group name + icon preview */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.05 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium">Group Name</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Friends Investment Circle..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={60}
                    className="flex-1 h-11 capitalize"
                  />
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CoverIcon name={cover} className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </motion.div>

              {/* Cover picker */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="flex flex-col gap-2"
              >
                <label className="text-sm font-medium">Group Icon</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 overflow-y-auto py-2 pr-1 pl-1">
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
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
                className="flex flex-col gap-1.5"
              >
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
              </motion.div>

              {/* Target amount */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.2 }}
                className="flex flex-col gap-1.5"
              >
                <label className="text-sm font-medium">Target Amount (₦)</label>
                <Input
                  type="number"
                  placeholder="e.g. 2,500,000"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  min={1}
                  className="h-11"
                />
              </motion.div>

              {/* Duration pills */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.25 }}
                className="flex flex-col gap-2"
              >
                <label className="text-sm font-medium">Duration</label>
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setDurationDays(opt.value); setCustomDays("") }}
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
                <div className="flex items-center gap-2 my-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Custom days..."
                    value={customDays}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9]/g, "")
                      setCustomDays(raw)
                      const val = parseInt(raw, 10)
                      if (!isNaN(val) && val >= 1 && val <= 1095) setDurationDays(val)
                    }}
                    className="h-11 bg-card"
                  />
                  <span className="text-sm text-muted-foreground shrink-0">days</span>
                </div>
              </motion.div>

              {/* Max members slider */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.3 }}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Max Members</label>
                  <span className="text-sm font-semibold text-primary">Members: {maxMembers}/50</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={50}
                  step={1}
                  value={maxMembers}
                  onChange={(e) => setMaxMembers(Number(e.target.value))}
                  className="w-full h-2 rounded-full appearance-none bg-border cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>2</span>
                  <span>50</span>
                </div>
              </motion.div>
            </div>

            {/* Footer */}
            <div className="px-4 pt-4 pb-4 border-t border-border">
              <Button
                onClick={handleCreate}
                disabled={isLoading}
                className="w-full h-11 gap-2 text-foreground"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create & Invite
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
