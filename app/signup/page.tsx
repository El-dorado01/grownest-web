"use client"

import { useState, useEffect } from "react"
import { SignupForm } from "@/components/signup-form"
import Link from "next/link"
import Image from "next/image"

const slides = [
  {
    src: "/bg-image-1.jpeg",
    title: "Plan your essentials ahead.",
    subtitle: "Your monthly food basket, sorted and delivered.",
  },
  {
    src: "/bg-image-2.jpeg",
    title: "No more kitchen stress.",
    subtitle: "Take control of your food budget before month end.",
  },
  {
    src: "/bg-image-3.jpeg",
    title: "Smart food planning.",
    subtitle: "Save money and eat well every single month.",
  },
]

export default function SignupPage() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Image Slider */}
      <div className="hidden lg:block w-[45%] xl:w-[48%] relative overflow-hidden bg-black">
        {/* Image layers */}
        {slides.map((slide, i) => (
          <Image
            key={slide.src}
            src={slide.src}
            alt={`Slide ${i + 1}`}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}

        {/* Dark gradient overlay at bottom for text */}
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent z-10" />

        {/* Slide caption */}
        <div className="absolute bottom-14 left-8 right-8 z-20">
          <h2 className="text-white text-2xl font-bold leading-snug mb-1">
            {slides[current].title}
          </h2>
          <p className="text-white/70 text-sm">{slides[current].subtitle}</p>

          {/* Dot indicators */}
          <div className="flex items-center gap-2 mt-5">
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

      {/* Right Panel — Signup Form */}
      <div className="flex-1 flex flex-col bg-muted min-h-screen">
        {/* Top bar */}
        <header className="flex items-center justify-between px-8 py-6">
          <Link href="/">
            <Image src="/logo.png" alt="GrowNest" width={120} height={36} className="w-auto" />
          </Link>
          <p className="text-sm text-muted-foreground">
            <span className="hidden md:inline">Already have an account?{" "}</span>
            <Link
              href="/login"
              className="text-primary font-medium border border-primary rounded-md px-3 py-1 hover:bg-primary/10 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </header>

        {/* Form area */}
        <main className="flex-1 flex items-center justify-center px-6 py-10">
          <SignupForm />
        </main>

        {/* Footer */}
        <footer className="flex items-center justify-between px-8 py-5 text-xs text-muted-foreground">
          <span>© 2026 GrowNest</span>
          <span>ENG</span>
        </footer>
      </div>
    </div>
  )
}
