import type { Metadata } from "next"
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const spaceGroteskHeading = Space_Grotesk({ subsets: ['latin'], variable: '--font-heading' });
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export const metadata: Metadata = {
  title: "GrowNest | Secure & Sustainable Wealth Growth",
  description: "Join GrowNest, Africa's premier platform for financial prosperity. We offer secure, sustainable, and high-yield wealth growth opportunities for everyone.",
  keywords: ["wealth growth", "savings", "investment", "Africa", "financial prosperity", "GrowNest"],
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
    title: "GrowNest | Africa's Leading Wealth Growth Platform",
    description: "Start your journey to financial freedom today. Secure and sustainable wealth growth at your fingertips.",
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
    title: "GrowNest | Secure Wealth Growth",
    description: "Africa's premier platform for financial prosperity. Grow your wealth sustainably with GrowNest.",
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
