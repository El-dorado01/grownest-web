import type { Metadata } from "next"
import React from "react"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils";
import { ConnectivityListener } from "@/components/connectivity-listener"
import { SettingsDialog } from "@/components/settings-dialog"

const spaceGroteskHeading = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "GrowNest | Save Smart. Shop Easy. Smile Always.",
  description:
    "Save Smart. Shop Easy. Smile Always. Join GrowNest, Africa's premier platform for financial prosperity and sustainable wealth growth.",
  keywords: [
    "wealth growth",
    "savings",
    "investment",
    "Africa",
    "financial prosperity",
    "GrowNest",
  ],
  authors: [{ name: "GrowNest Team" }],
  metadataBase: new URL("https://grownest.africa"),
  icons: {
    icon: "/d_icon.png",
    shortcut: "/d_icon.png",
    apple: "/d_icon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://grownest.africa",
    title: "GrowNest | Save Smart. Shop Easy. Smile Always.",
    description:
      "Start your journey to financial freedom today. Save Smart. Shop Easy. Smile Always with GrowNest.",
    siteName: "GrowNest",
    images: [
      {
        url: "/social-preview.png",
        width: 1200,
        height: 630,
        alt: "GrowNest Wealth Growth",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowNest | Save Smart. Shop Easy. Smile Always.",
    description:
      "Africa's premier platform for financial prosperity. Save Smart. Shop Easy. Smile Always.",
    images: ["/social-preview.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable, spaceGroteskHeading.variable)}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              {children}
              <ConnectivityListener />
              <Toaster position="bottom-center" richColors />
            </TooltipProvider>
                  <React.Suspense fallback={null}>
                    <SettingsDialog />
                  </React.Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
