"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PinInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  disabled?: boolean
  className?: string
  autoFocus?: boolean
}

export function PinInput({
  value,
  onChange,
  length = 4,
  disabled = false,
  className,
  autoFocus = true,
}: PinInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value
    if (!/^\d*$/.test(val)) return

    const newValue = value.split("")
    newValue[index] = val.slice(-1)
    const updatedValue = newValue.join("")
    onChange(updatedValue)

    // Focus next input if value is entered
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      // Focus previous input and clear its value on backspace if current is empty
      const newValue = value.split("")
      newValue[index - 1] = ""
      onChange(newValue.join(""))
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const data = e.clipboardData.getData("text").slice(0, length)
    if (!/^\d+$/.test(data)) return
    onChange(data)
    
    // Focus last input or first empty
    const focusIndex = Math.min(data.length, length - 1)
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <div className={cn("flex justify-center gap-3", className)}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el
          }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          className={cn(
            "h-14 w-12 rounded-xl border-2 bg-background text-center text-2xl font-bold transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50",
            value[i] ? "border-primary" : "border-input"
          )}
        />
      ))}
    </div>
  )
}
