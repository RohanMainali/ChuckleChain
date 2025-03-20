"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { Bell, Home, LaughIcon, MessageSquare, Menu, Search, X, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { useMobile } from "@/hooks/use-mobile"
import axios from "axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavbarProps {
  onMenuToggle: (open: boolean) => void
  sidebarOpen: boolean
  onRightSidebarToggle: (open: boolean) => void
  rightSidebarOpen: boolean
}

export function Navbar({ onMenuToggle, sidebarOpen, onRightSidebarToggle, rightSidebarOpen }: NavbarProps) {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { isMobile } = useMobile()
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [previousPath, setPreviousPath] = useState<string>("/feed")

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const toggleSidebar = () => {
    if (onMenuToggle) {
      // Store current path before opening sidebar
      if (!sidebarOpen) {
        setPreviousPath(pathname || "/feed")
      }
      onMenuToggle(!sidebarOpen)
    }
  }

  const toggleRightSidebar = () => {
    if (onRightSidebarToggle) {
      onRightSidebarToggle(!rightSidebarOpen)
    }
  }

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { data } = await axios.get("/api/notifications/count")
          if (data.success) {
            setUnreadNotifications(data.data.count)
          }
        } catch (error) {
          console.error("Error fetching notification count:", error)
        }
      }
    }

    fetchUnreadCount()

    // Set up socket listener for new notifications
    const socket = (window as any).socket
    if (socket) {
      socket.on("newNotification", () => {
        fetchUnreadCount()
      })
    }

    // Refresh count every minute
    const interval = setInterval(fetchUnreadCount, 60000)

    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off("newNotification")
      }
    }
  }, [user])

  // Add this useEffect after the existing useEffect for unread notifications
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (user) {
        try {
          const { data } = await axios.get("/api/messages/unread-count")
          if (data.success) {
            // Now we're counting conversations with unread messages, not total messages
            setUnreadMessages(data.data.conversationsWithUnread || 0)
          }
        } catch (error) {
          console.error("Error fetching unread messages count:", error)
        }
      }
    }

    fetchUnreadMessages()

    // Set up socket listener for new messages
    const socket = (window as any).socket
    if (socket) {
      socket.on("newMessage", (message: any) => {
        // Only increment if this is from a different user
        if (message.senderId !== user?.id) {
          // We'll increment the count of conversations with unread messages
          // In a real app, we'd need to check if this is from a new conversation
          setUnreadMessages((prev) => prev + 1)
        }
      })

      // Add listener for updateUnreadCount event
      socket.on("updateUnreadCount", () => {
        fetchUnreadMessages()
      })
    }

    // Refresh count every minute
    const interval = setInterval(fetchUnreadMessages, 60000)

    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off("newMessage")
        socket.off("updateUnreadCount")
      }
    }
  }, [user])

  // Update the socket connection to track user online status
  const socket = (window as any).socket
  useEffect(() => {
    // Update user's online status when the app is focused/blurred
    const handleVisibilityChange = () => {
      if (socket) {
        if (document.visibilityState === "visible") {
          socket.emit("userActive")
          console.log("User is active, emitting userActive event")
        } else {
          socket.emit("userInactive")
          console.log("User is inactive, emitting userInactive event")
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [socket])

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (data.success) {
        setSearchResults(data.data)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    }
  }

  useEffect(() => {
    setSearchResults([])
    setSearchQuery("")
    setShowSearchResults(false)
    setShowMobileSearch(false)
  }, [pathname])

  // Handle swipe for mobile
  useEffect(() => {
    // Removed swipe gesture handling
  }, [])

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-16 items-center justify-between w-full px-4 md:px-6">
        {/* Left section with menu button and logo */}
        <div className="flex items-center">
          {/* Menu button for mobile */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={toggleSidebar}>
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}

          <Link href="/feed" className="flex items-center gap-2">
            <LaughIcon className="h-8 w-8 text-primary" />
            {!isMobile && <span className="text-xl font-bold">ChuckleChain</span>}
          </Link>
        </div>

        {/* Center section with search */}
        {!isMobile && (
          <div className="flex-1 flex justify-center mx-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for users..."
                className="w-full pl-8 md:w-full bg-secondary/50"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
              />
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[300px] overflow-y-auto">
                  {searchResults.map((user) => (
                    <Link
                      key={user.id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                        <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        {user.fullName && <div className="text-xs text-muted-foreground">{user.fullName}</div>}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right section with navigation icons */}
        <nav className="flex items-center gap-2 md:gap-6 ml-auto">
          {/* Mobile search toggle */}
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {!isMobile && (
            <Link href="/feed">
              <Button variant={pathname === "/feed" ? "default" : "ghost"} size="icon" className="rounded-full">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Button>
            </Link>
          )}

          <Link href="/messages">
            <Button
              variant={pathname === "/messages" ? "default" : "ghost"}
              size="icon"
              className="rounded-full relative"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadMessages > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-pulse">
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              )}
              <span className="sr-only">Messages</span>
            </Button>
          </Link>

          <Link href="/notifications">
            <Button
              variant={pathname === "/notifications" ? "default" : "ghost"}
              size="icon"
              className="rounded-full relative"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-pulse">
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </Link>

          {/* Mobile right sidebar toggle */}
          {isMobile && (
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleRightSidebar}>
              <User className="h-5 w-5" />
            </Button>
          )}

          <ModeToggle />

          {/* Logout button - changed to icon */}
          {!isMobile && (
            <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Logout</span>
            </Button>
          )}
        </nav>
      </div>

      {/* Mobile search bar - only shown when search is active */}
      {isMobile && showMobileSearch && (
        <div className="px-4 py-2 border-b bg-background">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for users..."
              className="w-full pl-8 pr-8 bg-secondary/50"
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-7 w-7"
              onClick={() => setShowMobileSearch(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-background border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
              {searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
                  onClick={() => setShowMobileSearch(false)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.username}</div>
                    {user.fullName && <div className="text-xs text-muted-foreground">{user.fullName}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  )
}

