import type React from "react"
import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Train_One, Orbitron } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
})

const trainOne = Train_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-digital",
})

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: "Focus Timer",
  description: "A minimalist Pomodoro timer for focused work sessions",
  manifest: "/manifest.json",
  themeColor: "#059669",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Focus Timer",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} ${trainOne.variable} ${orbitron.variable} antialiased`}>
      <body>{children}</body>
    </html>
  )
}
