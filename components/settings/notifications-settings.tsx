"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { notificationsApi, NotificationPreferences } from "@/lib/notifications-api"
import { toast } from "sonner"
import useSWR from "swr"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  saving?: boolean
  justSaved?: boolean
}

function Switch({ checked, onCheckedChange, disabled, label, saving, justSaved }: SwitchProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Per-item status indicator */}
      <AnimatePresence mode="wait">
        {saving && (
          <motion.div
            key="saving"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </motion.div>
        )}
        {!saving && justSaved && (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <Check className="h-4 w-4 text-emerald-500" />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled || saving}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <motion.span
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={cn(
            "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0"
          )}
        />
        {label && <span className="sr-only">{label}</span>}
      </button>
    </div>
  )
}

export function NotificationSettings() {
  // SWR fetcher — pulls from the API and caches the result
  const { data: preferences, error, isLoading, mutate } = useSWR<NotificationPreferences>(
    "notification-preferences",
    async () => {
      const { data, error } = await notificationsApi.getPreferences()
      if (error) throw new Error(error)
      return data!
    },
    { revalidateOnFocus: false }
  )

  // Track which specific toggle is saving and which just saved
  const [savingKey, setSavingKey] = React.useState<keyof NotificationPreferences | null>(null)
  const [savedKey, setSavedKey] = React.useState<keyof NotificationPreferences | null>(null)

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!preferences || savingKey !== null) return

    const newValue = !preferences[key]
    const optimistic = { ...preferences, [key]: newValue }

    setSavingKey(key)
    setSavedKey(null)

    // Optimistic UI update via SWR mutate (no revalidation yet)
    mutate(optimistic, false)

    try {
      const { data, error } = await notificationsApi.updatePreferences({ [key]: newValue })
      if (error) {
        // Rollback — revalidate from server
        mutate()
        toast.error("Failed to update preference", { description: error })
      } else {
        // Commit the optimistic update
        mutate(optimistic, false)
        setSavedKey(key)
        toast.success("Preference saved", {
          description: `${sections.flatMap(s => s.items).find(i => i.id === key)?.label ?? key} has been updated.`,
          duration: 2500,
        })
        setTimeout(() => setSavedKey(null), 2000)
      }
    } catch {
      mutate()
      toast.error("Failed to update preference", { description: "Please try again." })
    } finally {
      setSavingKey(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading notification preferences...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-medium">Failed to load preferences</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-sm font-medium text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  const sections = [
    {
      title: "Delivery & Alerts",
      description: "How you receive important account updates.",
      items: [
        {
          id: "emailNotifications",
          label: "Email Notifications",
          description: "Receive updates about your account and transactions via email.",
          icon: <Mail className="h-5 w-5" />,
        },
        {
          id: "pushNotifications",
          label: "Push Notifications",
          description: "Get real-time alerts on your device for immediate actions.",
          icon: <Bell className="h-5 w-5" />,
        },
        {
          id: "smsNotifications",
          label: "SMS Notifications",
          description: "Receive critical security alerts via text message.",
          icon: <Smartphone className="h-5 w-5" />,
        },
      ]
    },
    {
      title: "Activity & Updates",
      description: "Stay informed about your GrowNest experience.",
      items: [
        {
          id: "securityAlerts",
          label: "Security Alerts",
          description: "Important updates regarding your account security and PIN changes.",
          icon: <ShieldCheck className="h-5 w-5" />,
        },
        {
          id: "marketingEmails",
          label: "Marketing & Offers",
          description: "Be the first to know about new features and exclusive offers.",
          icon: <Zap className="h-5 w-5" />,
        },
      ]
    }
  ]

  return (
    <div className="flex flex-col gap-8 py-2 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium leading-none tracking-tight">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Control how and when GrowNest contacts you.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70">
                {section.title}
              </h4>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>

            <div className="grid gap-0 divide-y rounded-xl border bg-card/50 overflow-hidden">
              {section.items.map((item) => {
                const isSaving = savingKey === item.id
                const justSaved = savedKey === item.id
                return (
                  <motion.div 
                    key={item.id}
                    className={cn(
                      "flex items-start justify-between gap-4 p-4 transition-colors",
                      isSaving ? "bg-muted/40" : "hover:bg-muted/30",
                    )}
                    animate={justSaved ? { backgroundColor: ["hsl(var(--primary)/0.08)", "transparent"] } : {}}
                    transition={{ duration: 1.2 }}
                  >
                    <div className="flex gap-4">
                      <div className={cn(
                        "mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                        justSaved ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                      )}>
                        {item.icon}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{item.label}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-[340px]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <Switch 
                      checked={preferences ? preferences[item.id as keyof NotificationPreferences] : false}
                      onCheckedChange={() => handleToggle(item.id as keyof NotificationPreferences)}
                      disabled={savingKey !== null}
                      label={item.label}
                      saving={isSaving}
                      justSaved={justSaved}
                    />
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Status banner */}
      <AnimatePresence mode="wait">
        {savingKey ? (
          <motion.div
            key="saving-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-muted bg-muted/30 p-4 flex items-center gap-3"
          >
            <Loader2 className="h-5 w-5 text-muted-foreground animate-spin shrink-0" />
            <div className="space-y-0.5">
              <p className="text-sm font-medium leading-none">Saving preference...</p>
              <p className="text-xs text-muted-foreground">Syncing with your account.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="saved-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3"
          >
            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">All changes are saved automatically</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your preferences are synced across all your devices in real-time.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
