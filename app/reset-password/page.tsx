import { ResetPasswordForm } from "@/components/reset-password-form"
import * as React from "react"
import { Loader2Icon } from "lucide-react"

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-6 md:p-10">
      <div className="w-full max-w-sm">
        <React.Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <ResetPasswordForm />
        </React.Suspense>
      </div>
    </div>
  )
}
