"use client"

import * as React from "react"
import { useAuth } from "@/context/auth-context"
import { authApi } from "@/lib/auth-api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CameraIcon, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

interface ProfileSettingsProps {
  onNavigate?: (viewName: string) => void
}

export function ProfileSettings({ onNavigate }: ProfileSettingsProps = {}) {
  const { user } = useAuth()
  const [profile, setProfile] = React.useState<any>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Form states
  const [fullName, setFullName] = React.useState("")
  const [dob, setDob] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [address, setAddress] = React.useState("")
  const [avatar, setAvatar] = React.useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = React.useState<string>("")

  React.useEffect(() => {
    authApi.getProfile().then(({ data }) => {
      if (data?.profile) {
        const p = data.profile
        setProfile(p)
        setFullName(p.fullName || "")
        if (p.dob) {
           // Format Date to YYYY-MM-DD for input type="date"
           try {
             const d = new Date(p.dob)
             if (!isNaN(d.getTime())) {
                setDob(d.toISOString().split('T')[0])
             }
           } catch (e) {
             console.error("Invalid DOB format:", p.dob)
           }
        }
        setGender(p.gender || "")
        setAddress(p.address || "")
        setAvatarPreview(p.profilePhoto || "")
      }
      setIsLoading(false)
    })
  }, [])

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
        // Update local state if needed or refresh profile
      } else {
        toast.error(result.error || "Failed to update profile")
      }
    } catch (err) {
      toast.error("An error occurred while updating profile")
    } finally {
      setIsSubmitting(false)
    }
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

        <div className="grid gap-6 md:grid-cols-2">
          <Field>
            <FieldLabel>Date of Birth</FieldLabel>
            <Input 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              className="h-11"
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
