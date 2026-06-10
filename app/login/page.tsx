"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import Link from "next/link"
import Image from "next/image"

const slides = [
  "/bg-image-6.png",
]

export default function LoginPage() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col bg-muted min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-6">
          <Link href="/">
            <Image src="/logo.png" alt="GrowNest" width={110} height={36} className="w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">
            <span className="hidden md:inline">Don&apos;t have an account?{" "}</span>
            <Link
              href="/signup"
              className="text-primary font-medium border border-primary rounded-md px-3 py-1 hover:bg-primary/10 transition-colors"
            >
              Register
            </Link>
          </p>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <LoginForm />
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between px-8 py-5 text-xs text-muted-foreground">
          <span>© 2026 GrowNest</span>
          <span>ENG</span>
        </footer>
      </div>

      {/* Right Panel — Image Slider */}
      <div className="hidden lg:block w-[48%] xl:w-[45%] relative overflow-hidden bg-black">
        {/* Image layers — fade between them */}
        {slides.map((src, i) => (
          <Image
            key={src}
            src={src}
            alt={`Slide ${i + 1}`}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current
                  ? "w-6 h-2 bg-primary"
                  : "w-2 h-2 bg-white/40 hover:bg-white/70"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
