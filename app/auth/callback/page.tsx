"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { authApi } from "@/lib/auth-api"
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { setAuthToken } from "@/lib/api"
import type { User } from "@/types/auth"

export default function AuthCallback() {
  const router = useRouter()
  // const { loginWithGoogle } = useAuth() // Or we can manually set state via context or let the normal flow handle it
  // Since we are in a redirect callback, we can fetch the session directly.

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        if (!session) {
          throw new Error("No session found after authentication")
        }

        // Send the Supabase session token to our backend
        const { data, error: backendError } = await authApi.socialLogin({
          provider: 'google',
          sessionToken: session.access_token,
          dataConsent: true, // We assume true for now, can be improved
        })

        if (backendError || !data) {
          throw new Error(backendError || "Backend authentication failed")
        }

        if (data.token) {
          setAuthToken(data.token)
          const user: User = {
            userId: data.userId,
            role: data.role,
            email: session.user.email || "",
          }
          localStorage.setItem("user", JSON.stringify(user))
          
          toast.success("Successfully logged in!")
          window.location.href = "/" // Full reload to initialize auth context
        } else {
          throw new Error("Invalid response from server")
        }
      } catch (err: any) {
        console.error("Auth callback error:", err)
        toast.error(err.message || "Authentication failed")
        router.push("/login")
      }
    }

    handleAuth()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h2 className="text-xl font-semibold">Authenticating...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  )
}
