"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Home,
  LaughIcon,
  LogOut,
  MessageSquare,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { ModeToggle } from "@/components/mode-toggle";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (user) {
        try {
          const { data } = await axios.get("/api/notifications/count");
          if (data.success) {
            setUnreadNotifications(data.data.count);
          }
        } catch (error) {
          console.error("Error fetching notification count:", error);
        }
      }
    };

    fetchUnreadCount();

    // Set up socket listener for new notifications
    const socket = (window as any).socket;
    if (socket) {
      socket.on("newNotification", () => {
        fetchUnreadCount();
      });
    }

    // Refresh count every minute
    const interval = setInterval(fetchUnreadCount, 1000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("newNotification");
      }
    };
  }, [user]);

  // Add this useEffect after the existing useEffect for unread notifications
  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (user) {
        try {
          const { data } = await axios.get("/api/messages/unread-count");
          if (data.success) {
            // Now we're counting conversations with unread messages, not total messages
            setUnreadMessages(data.data.conversationsWithUnread || 0);
          }
        } catch (error) {
          console.error("Error fetching unread messages count:", error);
        }
      }
    };

    fetchUnreadMessages();

    // Set up socket listener for new messages
    const socket = (window as any).socket;
    if (socket) {
      socket.on("newMessage", (message: any) => {
        // Only increment if this is from a different user
        if (message.senderId !== user?.id) {
          // We'll increment the count of conversations with unread messages
          // In a real app, we'd need to check if this is from a new conversation
          setUnreadMessages((prev) => prev + 1);
        }
      });

      // Add listener for updateUnreadCount event
      socket.on("updateUnreadCount", () => {
        fetchUnreadMessages();
      });
    }

    // Refresh count every minute
    const interval = setInterval(fetchUnreadMessages, 1000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("newMessage");
        socket.off("updateUnreadCount");
      }
    };
  }, [user]);

  // Update the socket connection to track user online status

  // Add this to the useEffect that handles socket connections:
  // This would typically be in the AuthProvider component, but we'll add it here for demonstration
  const socket = (window as any).socket;
  useEffect(() => {
    // Update user's online status when the app is focused/blurred
    const handleVisibilityChange = () => {
      if (socket) {
        if (document.visibilityState === "visible") {
          socket.emit("userActive");
          console.log("User is active, emitting userActive event");
        } else {
          socket.emit("userInactive");
          console.log("User is inactive, emitting userInactive event");
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [socket]);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data } = await axios.get(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (data.success) {
        setSearchResults(data.data);
      }
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  useEffect(() => {
    setSearchResults([]);
    setSearchQuery("");
    setShowSearchResults(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="flex h-16 items-center justify-between w-full px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/feed"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <LaughIcon className="h-8 w-8 text-primary" />
            <span className="hidden md:inline">ChuckleChain</span>
          </Link>

          <div className="relative ml-2 hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for users..."
              className="w-[200px] pl-8 md:w-[300px]"
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
                      <AvatarImage
                        src={user.profilePicture}
                        alt={user.username}
                      />
                      <AvatarFallback>
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      {user.fullName && (
                        <div className="text-xs text-muted-foreground">
                          {user.fullName}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <nav className="flex items-center gap-3 md:gap-6">
          <Link href="/feed">
            <Button
              variant={pathname === "/feed" ? "default" : "ghost"}
              size="icon"
              className="rounded-full transition-colors duration-300 hover:scale-105"
            >
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>

          <Link href="/messages">
            <Button
              variant={pathname === "/messages" ? "default" : "ghost"}
              size="icon"
              className="rounded-full relative transition-colors duration-300 hover:scale-105"
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
              className="rounded-full relative transition-colors duration-300 hover:scale-105"
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

          <ModeToggle />

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full transition-colors duration-300 hover:scale-105"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Log out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
