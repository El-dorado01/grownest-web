"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/auth-context"
import { Loader2, Eye, EyeOff, Mail, Lock } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useGoogleLogin } from '@react-oauth/google'

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { login, loginWithGoogle, isLoading: isAuthLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const isLoading = isAuthLoading || isSubmitting || isGoogleLoading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const result = await login({ email, password })

      if (!result.success) {
        toast.error(result.error || "Login failed")
        setIsSubmitting(false)
      } else if (result.requires2FA) {
        toast.info("Verification code sent. Please check your messages.")
      } else {
        toast.success("Login successful!")
        window.location.href = "/"
      }
    } catch (err) {
      toast.error("An unexpected error occurred. Please try again.")
      setIsSubmitting(false)
    }
  }

  // To get an id_token with useGoogleLogin, we must use the auth-code flow or 
  // simply fetch the user profile using the access_token.
  // However, Supabase signInWithIdToken REQUIRES an id_token.
  // Since we are using Supabase on the backend, a better approach for the custom button
  // is to use Supabase's built-in OAuth flow which handles the redirect.
  // But since the user specifically provided Google credentials for the frontend,
  // we will fetch the user info from Google using the access_token, then register/login.
  // Wait, if we fetch user info, we don't have an id_token for Supabase!
  // Let's use Supabase directly for the Google Login button. It's much simpler.

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true)
    try {
      // Instead of manual token exchange, we use Supabase's OAuth
      // which will redirect the user to Google.
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_FRONTEND_URL || window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
      toast.error("Failed to initialize Google Login");
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className={cn("w-full max-w-sm", className)} {...props}>
      {/* Heading */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          Login to your account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your details to login.
        </p>
      </div>

      {/* Google login */}
      <Button
        variant="outline"
        type="button"
        onClick={handleGoogleClick}
        className="w-full mb-5 gap-3 bg-card border-border h-11"
        disabled={isLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* OR separator */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address<span className="text-primary ml-0.5">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="pl-9 h-11 bg-card"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password<span className="text-primary ml-0.5">*</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="pl-9 pr-10 h-11 bg-card"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-11 mt-1 text-sm font-medium text-foreground"
          disabled={isLoading}
        >
          {isLoading && !isGoogleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>
      </form>
    </div>
  )
}
