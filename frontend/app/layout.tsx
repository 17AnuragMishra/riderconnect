import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { GroupProvider } from "@/contexts/group-context"
import { ThemeProvider } from "@/components/theme-provider"
import PushNotificationControl from "@/components/notifications/push-notification-control"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "RiderConnect — Real-Time Group Tracking for Riders",
  description:
    "Never lose your pack. Track your group in real-time, get instant alerts when someone deviates, and chat without switching apps. Free for up to 10 riders.",
  keywords: [
    "group tracking",
    "rider tracking",
    "real-time GPS",
    "motorcycle group",
    "ride together",
    "location sharing",
  ],
  openGraph: {
    title: "RiderConnect — Never Lose Your Pack",
    description:
      "Real-time group tracking for riders. Instant alerts, live maps, in-ride chat.",
    type: "website",
    locale: "en_US",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </head>
        <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
          <ThemeProvider>
            <GroupProvider>
              <Navbar />
              {children}
              <PushNotificationControl />
              <Toaster />
            </GroupProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
