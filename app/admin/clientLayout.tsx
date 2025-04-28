"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import AdminSidebar from "./sidebar"
import { Button } from "@/components/ui/button"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Skip redirect for login page
    if (pathname === "/admin/login") return

    if (!isLoading) {
      // If not authenticated, redirect to admin login
      if (!user) {
        router.push("/admin/login")
        return
      }

      // If authenticated but not admin, redirect to home
      if (user.role !== "admin") {
        router.push("/")
        return
      }
    }
  }, [isLoading, user, router, pathname])

  // Show loading state while checking authentication
  if (isLoading && pathname !== "/admin/login") {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    )
  }

  // If on login page, just render the login page
  if (pathname === "/admin/login") {
    return children
  }

  // If not admin and not on login page, don't render anything (will redirect)
  if (!user?.role === "admin" && !isLoading && pathname !== "/admin/login") {
    return null
  }

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/admin/dashboard" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">🤣</span>
          <span>ChuckleChain Admin</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <ModeToggle />
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-sm text-muted-foreground">{user?.username || "Admin"}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 border-r bg-background px-4 py-6 md:block overflow-y-auto">
          <AdminSidebar />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}
