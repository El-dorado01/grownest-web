import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted flex flex-col items-center justify-center px-6 text-center">
      {/* 404 number with illustration layered in */}
      <div className="relative flex items-center justify-center select-none mb-2">
        <span className="text-[160px] sm:text-[220px] font-extrabold leading-none tracking-tighter text-foreground/8">
          404
        </span>

        {/* Seedling SVG — centred over the numbers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 200 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-36 h-36 sm:w-48 sm:h-48"
          >
            {/* Pot */}
            <path
              d="M70 180 L80 210 H120 L130 180 Z"
              fill="oklch(0.63 0.12 65)"
              opacity="0.9"
            />
            <rect x="65" y="172" width="70" height="12" rx="4" fill="oklch(0.55 0.1 65)" />

            {/* Stem */}
            <path
              d="M100 172 C100 150 100 120 100 95"
              stroke="oklch(0.5 0.13 135)"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* Left leaf */}
            <path
              d="M100 130 C80 115 55 120 52 100 C70 95 95 108 100 130Z"
              fill="oklch(0.62 0.17 135)"
              opacity="0.9"
            />
            {/* Left leaf vein */}
            <path
              d="M100 130 C80 115 60 108 52 100"
              stroke="oklch(0.45 0.13 135)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* Right leaf */}
            <path
              d="M100 110 C120 95 145 100 148 80 C130 75 105 88 100 110Z"
              fill="oklch(0.72 0.16 84)"
              opacity="0.9"
            />
            {/* Right leaf vein */}
            <path
              d="M100 110 C120 95 138 85 148 80"
              stroke="oklch(0.55 0.12 84)"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.5"
            />

            {/* Top sprout */}
            <path
              d="M100 95 C100 78 112 65 128 60 C125 78 112 88 100 95Z"
              fill="oklch(0.62 0.17 135)"
            />
            <path
              d="M100 95 C100 78 88 65 72 60 C75 78 88 88 100 95Z"
              fill="oklch(0.72 0.16 84)"
            />

            {/* Sparkles */}
            <circle cx="148" cy="55" r="3" fill="oklch(0.72 0.16 84)" opacity="0.7" />
            <circle cx="158" cy="70" r="2" fill="oklch(0.72 0.16 84)" opacity="0.5" />
            <circle cx="52" cy="94" r="2.5" fill="oklch(0.62 0.17 135)" opacity="0.6" />
            <circle cx="42" cy="108" r="1.5" fill="oklch(0.62 0.17 135)" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Ground line */}
      <div className="w-48 sm:w-64 h-px bg-border mb-10" />

      {/* Message */}
      <h1 className="text-xl sm:text-2xl font-semibold text-foreground mb-2">
        This page doesn&apos;t exist
      </h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        The page you&apos;re looking for hasn&apos;t been planted yet, or may have been moved.
      </p>

      {/* CTA */}
      <Button asChild size="lg" className="px-8 rounded-full text-foreground">
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
