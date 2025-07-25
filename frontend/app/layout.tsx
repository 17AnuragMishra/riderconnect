import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import Navbar from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"
import { GroupProvider } from "@/contexts/group-context"
import { ThemeProvider } from "@/components/theme-provider"
// import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GroupTrack - Real-Time Group Tracking System",
  description:
    "Track your friends and family in real-time, chat with your group, and get alerts when someone strays too far.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        </head>
        <body className={inter.className}>
            <ThemeProvider>
              <GroupProvider>
                <Navbar />
                {children}
                {/* <Analytics /> */}
                <Toaster />
              </GroupProvider>
            </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
