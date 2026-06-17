"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CameraIcon, CheckCircle2, XCircle, Copy } from "lucide-react"
import { toast } from "sonner"
import { ErrorState } from "@/components/error-state"
import { useProfile } from "@/hooks/use-profile"

interface ProfileSettingsProps {
  onNavigate?: (viewName: string) => void
}

export function ProfileSettings({ onNavigate }: ProfileSettingsProps = {}) {
  const { user } = useAuth()
  const { profile, isLoading, error, mutate } = useProfile()


  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  // Form states
  const [fullName, setFullName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [avatar, setAvatar] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string>("")

  // Sync form state when profile data is loaded
  React.useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "")
      if (profile.dob) {
        try {
          const d = new Date(profile.dob)
          if (!isNaN(d.getTime())) {
            setDob(d.toISOString().split('T')[0])
          }
        } catch (e) {
          console.error("Invalid DOB format:", profile.dob)
        }
      }
      setGender(profile.gender || "")
      setAddress(profile.address || "")
      setAvatarPreview(profile.profilePhoto || "")
    }
  }, [profile])


  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB")
        return
      }
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const payload: any = {
        userId: user?.userId,
        fullName,
        phone: profile.phone, // Required by backend schema
        dob,
        gender,
        address,
      }
      
      if (avatar) {
        payload.profilePhoto = avatar
      }

      const result = await authApi.updateProfile(payload)

      if (result.data) {
        toast.success("Profile updated successfully")
        mutate() // Refresh profile data
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (err) {
      toast.error("An error occurred while updating profile")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <ErrorState 
          title="Couldn't load profile"
          onRetry={() => mutate()}
          isRetrying={isLoading}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading your profile...
        </p>
      </div>
    )
  }

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .substring(0, 2)

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 md:gap-8 pb-6 md:pb-10">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <div className="relative group">
          <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
            <AvatarImage src={avatarPreview} className="object-cover" />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {initials || "GN"}
            </AvatarFallback>
          </Avatar>
          <label 
            htmlFor="avatar-upload" 
            className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-[2px]"
          >
            <CameraIcon className="text-white h-7 w-7" />
            <input 
              id="avatar-upload" 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleAvatarChange}
            />
          </label>
        </div>
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <h3 className="text-xl font-semibold">Profile Picture</h3>
          <p className="text-sm text-muted-foreground max-w-[200px]">
            JPG, GIF or PNG. Max size of 5MB.
          </p>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            className="mt-2 w-fit mx-auto sm:mx-0"
            onClick={() => document.getElementById('avatar-upload')?.click()}
          >
            Change Photo
          </Button>
        </div>
      </div>

      <FieldGroup className="max-w-3xl">
        <div className="flex flex-col gap-5 p-5 rounded-2xl border border-primary/10 bg-primary/5 dark:bg-primary/10 mb-6">
          <div className="flex items-center gap-6">
            <img 
              src="/undraw_gifts_4gy3.svg" 
              alt="Gifts" 
              className="w-24 h-auto object-contain shrink-0" 
            />
            <div className="space-y-0.5 text-left">
              <h4 className="text-sm font-black text-foreground">Invite Friends & Earn Points</h4>
              <p className="text-xs text-muted-foreground leading-normal max-w-md">
                Earn 500 NestCircle points for every friend who registers and verifies their account using your referral code.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full pt-4 border-t border-dashed border-primary/10">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Your Referral Code</span>
            <div className="flex items-center justify-between gap-2.5 bg-background border border-muted/50 rounded-xl px-3 py-1.5 w-full">
              <span className="font-mono text-sm font-black tracking-widest text-foreground select-all">
                {profile?.referralCode || "—"}
              </span>
              {profile?.referralCode && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(profile.referralCode)
                    toast.success("Referral code copied to clipboard!")
                  }}
                  className="p-1.5 rounded-lg hover:bg-muted text-primary cursor-pointer transition-colors"
                  title="Copy Code"
                >
                  <Copy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel>Full Name</FieldLabel>
            <Input 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              placeholder="e.g. John Doe"
              className="h-11"
            />
          </Field>
          <Field>
            <FieldLabel>Gender</FieldLabel>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="h-11! w-full bg-background">
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel>Email Address</FieldLabel>
            <Input value={profile?.email || ""} disabled className="h-11 bg-muted/30 cursor-not-allowed" />
            <FieldDescription>Your primary contact email address</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Phone Number</FieldLabel>
            <div className="relative">
              <Input value={profile?.phone || ""} disabled className="h-11 bg-muted/30 cursor-not-allowed pr-10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {profile?.isPhoneVerified ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${profile?.isPhoneVerified ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {profile?.isPhoneVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <button 
                type="button" 
                onClick={(e) => {
                  e.preventDefault()
                  onNavigate?.("Update Phone Number")
                }}
                className="text-xs font-medium text-primary hover:underline underline-offset-4"
              >
                New number? Update now
              </button>
            </div>
          </Field>
        </div>

        <div className="grid gap-6 md:grid-cols-2 min-w-0">
          <Field className="min-w-0">
            <FieldLabel>Date of Birth</FieldLabel>
            <Input 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              className="h-11 w-full min-w-0"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>Residential Address</FieldLabel>
          <Input 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            placeholder="No. 123, GrowNest Street, Africa"
            className="h-11"
          />
        </Field>
      </FieldGroup>

      <div className="mt-auto flex items-center justify-end gap-3 border-t pt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="h-11 px-10 font-semibold shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Profile"
          )}
        </Button>
      </div>
    </form>
  )
}
