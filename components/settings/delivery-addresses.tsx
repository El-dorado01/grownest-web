"use client"

import * as React from "react"
import { nestBasketsApi } from "@/lib/nestbaskets-api"
import { DeliveryProfile, DeliveryZone } from "@/types/nestbaskets"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { 
  Loader2, 
  Plus, 
  Trash2, 
  MapPin, 
  Star, 
  Home,
  CheckCircle2,
  ChevronLeft,
  Phone,
  User,
  Pencil,
  Info
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ErrorState } from "@/components/error-state"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import useSWR from "swr"

export function DeliveryAddressesSettings() {
  // SWR Fetchers
  const { data: profilesRes, error: profilesError, isLoading: profilesLoading, mutate: mutateProfiles } = useSWR(
    "delivery-profiles",
    () => nestBasketsApi.getDeliveryProfiles()
  )
  
  const { data: zonesRes, error: zonesError, isLoading: zonesLoading } = useSWR(
    "delivery-zones",
    () => nestBasketsApi.getDeliveryZones()
  )

  const profiles = profilesRes?.data?.data || []
  const zones = zonesRes?.data?.data || []
  const isLoading = profilesLoading || zonesLoading
  const error = !!(profilesError || zonesError || profilesRes?.error || zonesRes?.error)

  const [showAddForm, setShowAddForm] = React.useState(false)
  const [editingProfile, setEditingProfile] = React.useState<DeliveryProfile | null>(null)


  // Form state
  const [formData, setFormData] = React.useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    landmark: "",
    notes: "",
    setAsDefault: false,
    deliveryZoneId: "",
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Delete state
  const [profileToDelete, setProfileToDelete] = React.useState<DeliveryProfile | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Set Default state
  const [isSettingDefault, setIsSettingDefault] = React.useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSelectZone = (zoneId: string) => {
    setFormData(prev => ({ ...prev, deliveryZoneId: zoneId }))
  }

  const resetForm = () => {
    setFormData({
      fullName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      landmark: "",
      notes: "",
      setAsDefault: false,
      deliveryZoneId: "",
    })
    setEditingProfile(null)
  }

  // Smart Matching Logic
  React.useEffect(() => {
    if (!formData.city && !formData.state) return
    if (editingProfile) return // Don't auto-change when editing an existing profile unless city/state changes?
    
    const city = formData.city.toLowerCase().trim()
    const state = formData.state.toLowerCase().trim()
    
    if (!city && !state) return

    const matchedZone = zones.find(zone => {
      const zoneName = zone.name.toLowerCase()
      return (city && (zoneName.includes(city) || city.includes(zoneName))) || 
             (state && (zoneName.includes(state) || state.includes(zoneName)))
    })

    // Fallback to "Other states" if no specific match found
    const finalMatchedZone = matchedZone || zones.find(z => z.name.toLowerCase().includes("other states"))

    if (finalMatchedZone && finalMatchedZone.id !== formData.deliveryZoneId) {
      setFormData(prev => ({ ...prev, deliveryZoneId: finalMatchedZone.id }))
    }
  }, [formData.city, formData.state, zones])


  const isFormValid = formData.fullName.trim() !== "" && 
                     formData.phone.trim() !== "" && 
                     formData.address.trim() !== "" && 
                     formData.city.trim() !== "" && 
                     formData.state.trim() !== "" && 
                     formData.deliveryZoneId !== ""

  const handleAddOrUpdate = async () => {
    if (!isFormValid) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingProfile) {
        const { data, error } = await nestBasketsApi.updateDeliveryProfile(editingProfile.id, {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          landmark: formData.landmark || null,
          notes: formData.notes || null,
          deliveryZoneId: formData.deliveryZoneId || null,
        })
        if (error) {
          toast.error(error)
        } else {
          toast.success("Address updated successfully")
          setShowAddForm(false)
          resetForm()
          mutateProfiles()
        }
      } else {
        const { data, error } = await nestBasketsApi.createDeliveryProfile(formData)
        if (error) {
          toast.error(error)
        } else {
          toast.success("Address added successfully")
          setShowAddForm(false)
          resetForm()
          mutateProfiles()
        }
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }


  const handleSetDefault = async (profile: DeliveryProfile) => {
    setIsSettingDefault(profile.id)
    try {
      const { error } = await nestBasketsApi.setDefaultDeliveryProfile(profile.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success("Default address updated")
        mutateProfiles()
      }
    } catch (err) {
      toast.error("Failed to update default address")
    } finally {
      setIsSettingDefault(null)
    }
  }

  const handleEdit = (profile: DeliveryProfile) => {
    setEditingProfile(profile)
    setFormData({
      fullName: profile.fullName,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      landmark: profile.landmark || "",
      notes: profile.notes || "",
      setAsDefault: profile.isDefault,
      deliveryZoneId: profile.deliveryZoneId || "",
    })
    setShowAddForm(true)
  }

  const handleDelete = (profile: DeliveryProfile) => {
    setProfileToDelete(profile)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    if (!profileToDelete) return
    setIsDeleting(true)
    try {
      const { error } = await nestBasketsApi.deleteDeliveryProfile(profileToDelete.id)
      if (error) {
        toast.error(error)
      } else {
        toast.success("Address deleted successfully")
        mutateProfiles()
      }
    } catch (err: any) {
      toast.error("Failed to delete address")
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
      setProfileToDelete(null)
    }
  }


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading delivery addresses...
        </p>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col py-2", showAddForm ? "gap-0" : "gap-8")}>
      <AnimatePresence mode="wait">
        {!showAddForm ? (
          <motion.div 
            key="main-header"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between min-h-[40px] gap-2"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-lg leading-none font-medium tracking-tight">Delivery Addresses</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Manage your saved addresses for food deliveries and orders.
              </p>
            </div>

            {!error && (
              <Button 
                size="default" 
                className="gap-2 shadow-lg shadow-primary/10"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4" />
                Add Address
              </Button>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <ErrorState 
              onRetry={() => mutateProfiles()} 
              isRetrying={isLoading} 
            />
          </motion.div>
        ) : showAddForm ? (
          <motion.div 
            key="add-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-6 py-2"
          >
            <div className="flex flex-col gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-fit -ml-2 rounded-full h-8 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight">
                  {editingProfile ? "Update Address" : "Add New Address"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {editingProfile ? "Modify your existing delivery details." : "Save a new location for your food deliveries."}
                </p>
              </div>
            </div>


            <div className="grid gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="text-xs">Full Name</FieldLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="fullName"
                      placeholder="e.g. John Doe"
                      className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                  </div>
                </Field>
                <Field>
                  <FieldLabel className="text-xs">Phone Number</FieldLabel>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      name="phone"
                      placeholder="e.g. 08012345678"
                      className="pl-10 h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </Field>
              </div>

              <Field>
                <FieldLabel className="text-xs">Delivery Zone</FieldLabel>
                <div className="rounded-xl border bg-background overflow-hidden">
                  <div className="max-h-[160px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                      {zones.map(zone => (
                        <button
                          key={zone.id}
                          type="button"
                          onClick={() => handleSelectZone(zone.id)}
                          className={cn(
                            "flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative group",
                            formData.deliveryZoneId === zone.id 
                              ? "border-primary bg-primary/10 ring-1 ring-primary shadow-sm"
                              : "border-muted bg-white hover:border-primary/50"
                          )}
                        >
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[13px] font-bold truncate">{zone.name}</span>
                            {formData.deliveryZoneId === zone.id && (
                              <div className="flex items-center gap-1">
                                {(() => {
                                  const city = formData.city.toLowerCase()
                                  const state = formData.state.toLowerCase()
                                  const isSpecificMatch = (city && (zone.name.toLowerCase().includes(city) || city.includes(zone.name.toLowerCase()))) || 
                                                         (state && (zone.name.toLowerCase().includes(state) || state.includes(zone.name.toLowerCase())))
                                  
                                  if (isSpecificMatch || zone.name.toLowerCase().includes("other states")) {
                                    return <span className="text-[8px] font-black uppercase tracking-tighter bg-primary text-white px-1 rounded-[2px] leading-tight">Match</span>
                                  }
                                  
                                  return null
                                })()}

                                <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-semibold">₦{zone.baseFee.toLocaleString()} base fee</span>
                        </button>

                      ))}
                    </div>
                  </div>
                </div>
                {formData.deliveryZoneId && (
                  <p className="text-[10px] text-primary font-bold mt-1.5 flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" />
                    Matched Zone: {zones.find(z => z.id === formData.deliveryZoneId)?.name}
                  </p>
                )}
              </Field>


              <Field>
                <FieldLabel className="text-xs">Street Address</FieldLabel>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    name="address"
                    placeholder="e.g. 123 GrowNest Way"
                    className="w-full min-h-[80px] pl-10 pr-4 py-3 rounded-xl bg-muted/50 border-transparent focus:border-primary/20 text-sm outline-none transition-all resize-none"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="text-xs">City</FieldLabel>
                  <Input
                    name="city"
                    placeholder="e.g. Ikeja"
                    className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </Field>
                <Field>
                  <FieldLabel className="text-xs">State</FieldLabel>
                  <Input
                    name="state"
                    placeholder="e.g. Lagos"
                    className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel className="text-xs">Landmark (Optional)</FieldLabel>
                  <Input
                    name="landmark"
                    placeholder="e.g. Near ABC Mall"
                    className="h-11 rounded-xl bg-muted/50 border-transparent focus:border-primary/20"
                    value={formData.landmark}
                    onChange={handleInputChange}
                  />
                </Field>
                {!editingProfile && (
                  <div className="flex items-center gap-2.5 pt-6">
                    <Checkbox 
                      id="setAsDefault" 
                      checked={formData.setAsDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, setAsDefault: !!checked }))}
                    />
                    <label 
                      htmlFor="setAsDefault" 
                      className="text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                    >
                      Set as default address
                    </label>
                  </div>
                )}

              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="ghost" 
                className="flex-1 rounded-xl h-11"
                onClick={() => {
                  setShowAddForm(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={!isFormValid || isSubmitting}
                onClick={handleAddOrUpdate}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProfile ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </motion.div>
        ) : profiles.length === 0 ? (
          <motion.div 
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-muted-foreground/20 bg-muted/5"
          >
            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h4 className="text-base font-semibold">No addresses saved</h4>
            <p className="text-sm text-muted-foreground mt-1 max-w-[240px]">
              Save your delivery addresses for a faster checkout experience.
            </p>
            <Button 
              variant="outline" 
              className="mt-6 rounded-xl gap-2"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4" />
              Add Your First Address
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            key="profiles-list"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid gap-4"
          >
            {profiles.map((profile) => (
              <div 
                key={profile.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-md",
                  profile.isDefault 
                    ? "border-primary/20 bg-primary/5 ring-1 ring-primary/20" 
                    : "border-muted bg-muted/30 hover:bg-muted/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors bg-white",
                      profile.isDefault ? "border-primary/20" : "border-muted-foreground/10"
                    )}>
                      <Home className={cn("h-6 w-6", profile.isDefault ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold tracking-tight">{profile.fullName}</span>
                        {profile.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                            Default
                          </span>
                        )}
                        {profile.deliveryZone && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {profile.deliveryZone.name}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium line-clamp-1 max-w-[300px]">
                        {profile.address}, {profile.city}, {profile.state}
                      </p>
                      <span className="text-[11px] text-muted-foreground/70 font-medium">
                        {profile.phone} {profile.landmark ? `• ${profile.landmark}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!profile.isDefault && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                        title="Set as Default"
                        disabled={isSettingDefault === profile.id}
                        onClick={() => handleSetDefault(profile)}
                      >
                        {isSettingDefault === profile.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Star className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      title="Edit Address"
                      onClick={() => handleEdit(profile)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      title="Delete Address"
                      onClick={() => handleDelete(profile)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Mobile Actions */}
                <div className="mt-4 flex gap-2 sm:hidden">
                  {!profile.isDefault && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-lg text-xs"
                      disabled={isSettingDefault === profile.id}
                      onClick={() => handleSetDefault(profile)}
                    >
                      {isSettingDefault === profile.id && (
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      )}
                      Set Default
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 rounded-lg text-xs hover:bg-primary/10"
                    onClick={() => handleEdit(profile)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(profile)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn(`rounded-2xl border border-dashed border-muted-foreground/20 p-5 bg-muted/5`, showAddForm && "mt-5")}>
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
          <div className="space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">About Delivery Addresses</p>
            <p className="text-xs leading-relaxed text-muted-foreground/80">
              Your default address is used for all new orders and subscriptions. You can override this at any time during checkout. Some zones may have different delivery fees.
            </p>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this address for <strong>{profileToDelete?.fullName}</strong>? 
              {profileToDelete?.isDefault && " This is your default address. If you delete it, another address will be set as default."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              variant="destructive" 
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                confirmDelete()
              }}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
