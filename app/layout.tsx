import type React from "react"
import type { Metadata } from "next/types"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { MobileProvider } from "@/hooks/use-mobile"
import { SidebarProvider } from "@/context/SidebarContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ChuckleChain - Share Your Memes",
  description: "A modern meme-sharing social media platform",
  generator: "v0.dev",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MobileProvider>
            <SidebarProvider>
              <AuthProvider>{children}</AuthProvider>
            </SidebarProvider>
          </MobileProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
