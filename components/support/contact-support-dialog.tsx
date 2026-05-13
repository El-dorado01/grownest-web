"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/auth-context"

interface ContactSupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContactSupportDialog({ open, onOpenChange }: ContactSupportDialogProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [subject, setSubject] = React.useState("")
  const [message, setMessage] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject || !message) {
      toast.error("Please fill in all fields")
      return
    }

    setIsSubmitting(true)
    try {
      // For now, we'll simulate the API call
      // In a real scenario, this would call something like authApi.sendSupportMessage(...)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Message sent successfully! We'll get back to you soon.")
      setSubject("")
      setMessage("")
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to send message. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>
            Have an issue or inquiry? Send us a message and our team will get back to you within 24 hours.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <Field>
            <FieldLabel>Subject</FieldLabel>
            <Input 
              placeholder="e.g. Transaction Issue, Account Verification" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-11 rounded-xl"
            />
          </Field>
          <Field>
            <FieldLabel>Message</FieldLabel>
            <Textarea 
              placeholder="Describe your issue in detail..." 
              className="min-h-[150px] rounded-xl resize-none"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </Field>
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="rounded-xl h-11 px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
