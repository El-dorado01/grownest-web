"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Loader2, Monitor, Moon, Sun, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading appearance settings...
        </p>
      </div>
    )
  }

  const themes = [
    {
      id: "light",
      name: "Light",
      icon: <Sun className="h-5 w-5" />,
      preview: (
        <div className="flex h-24 w-full flex-col gap-2 rounded-md border bg-white p-2 shadow-sm">
          <div className="h-2 w-full rounded bg-zinc-200" />
          <div className="flex gap-2">
            <div className="h-6 w-1/3 rounded bg-zinc-100" />
            <div className="h-6 w-2/3 rounded bg-zinc-100" />
          </div>
          <div className="h-10 w-full rounded bg-primary/10" />
        </div>
      ),
    },
    {
      id: "dark",
      name: "Dark",
      icon: <Moon className="h-5 w-5" />,
      preview: (
        <div className="flex h-24 w-full flex-col gap-2 rounded-md border bg-zinc-950 p-2 shadow-sm">
          <div className="h-2 w-full rounded bg-zinc-800" />
          <div className="flex gap-2">
            <div className="h-6 w-1/3 rounded bg-zinc-900" />
            <div className="h-6 w-2/3 rounded bg-zinc-900" />
          </div>
          <div className="h-10 w-full rounded bg-primary/20" />
        </div>
      ),
    },
    {
      id: "system",
      name: "System",
      icon: <Monitor className="h-5 w-5" />,
      preview: (
        <div className="relative h-24 w-full overflow-hidden rounded-md border shadow-sm">
          <div className="absolute inset-0 flex h-full w-full">
            <div className="h-full w-1/2 bg-white p-2">
               <div className="h-2 w-full rounded bg-zinc-200 mb-2" />
               <div className="h-6 w-full rounded bg-zinc-100 mb-2" />
            </div>
            <div className="h-full w-1/2 bg-zinc-950 p-2">
               <div className="h-2 w-full rounded bg-zinc-800 mb-2" />
               <div className="h-6 w-full rounded bg-zinc-900 mb-2" />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-[2px] bg-zinc-400/50" />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-8 py-2">
      <div>
        <h3 className="text-lg font-medium leading-none tracking-tight">Appearance</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Customize how GrowNest looks on your device.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={cn(
              "group relative flex flex-col gap-3 text-left focus-visible:outline-none",
              theme === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-70 group-hover:opacity-100 flex items-center gap-2">
              {t.icon}
              {t.name}
            </div>
            <div
              className={cn(
                "relative rounded-xl border-2 p-1.5 transition-all duration-200 ease-in-out",
                theme === t.id
                  ? "border-primary bg-primary/5 ring-4 ring-primary/5"
                  : "border-transparent bg-muted/30 hover:border-zinc-300 dark:hover:border-zinc-700"
              )}
            >
              {t.preview}
              {theme === t.id && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg animate-in zoom-in-50 duration-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <Monitor className="h-5 w-5 text-primary mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium leading-none">Automatic theme switching</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Choose "System" to automatically switch between light and dark modes based on your device settings.
          </p>
        </div>
      </div>
    </div>
  )
}
