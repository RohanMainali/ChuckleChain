"use client";

// Update the Notifications component to handle pagination and optimize rendering

import { useRef, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Notification } from "@/lib/types";
import { Heart, MessageCircle, UserPlus, RefreshCw } from "lucide-react";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "@/components/auth-provider";

// Initialize socket connection
let socket: any;

export function Notifications() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const socketInitialized = useRef(false);
  const ITEMS_PER_PAGE = 20;

  // Initialize socket connection
  useEffect(() => {
    if (user && !socketInitialized.current) {
      console.log("Initializing socket connection for notifications");

      // Connect to the socket server with auth token
      const token = document.cookie.split("token=")[1]?.split(";")[0];
      socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001", {
        withCredentials: true,
        auth: { token },
      });

      // Store socket in window for global access
      if (typeof window !== "undefined") {
        (window as any).socket = socket;
      }

      // Socket event handlers
      socket.on("connect", () => {
        console.log("Socket connected successfully with ID:", socket.id);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      socket.on("newNotification", (notification: Notification) => {
        console.log("New notification received:", notification);
        setNotifications((prev) => [notification, ...prev]);
      });

      socketInitialized.current = true;

      // Clean up on unmount
      return () => {
        console.log("Disconnecting socket");
        socket.disconnect();
        socketInitialized.current = false;
      };
    }
  }, [user]);

  // Fetch notifications with pagination
  const fetchNotifications = async (pageNum = 1, append = false) => {
    try {
      setLoading(pageNum === 1);
      setLoadingMore(pageNum > 1);
      setError(null);

      const { data } = await axios.get(
        `/api/notifications?page=${pageNum}&limit=${ITEMS_PER_PAGE}`
      );

      if (data.success) {
        if (append) {
          setNotifications((prev) => [...prev, ...data.data]);
        } else {
          setNotifications(data.data);
        }

        // Check if there are more notifications to load
        setHasMore(data.data.length === ITEMS_PER_PAGE);
      } else {
        setError("Failed to load notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("An error occurred while loading notifications");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchNotifications(nextPage, true);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    fetchNotifications(1, false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put("/api/notifications/read-all");
      // Update all notifications to read
      setNotifications((prev) =>
        prev.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      // Update the specific notification to read
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === "like" || notification.type === "comment") {
      if (notification.postId) {
        router.push(`/post/${notification.postId}`);
      }
    } else if (notification.type === "follow") {
      router.push(`/profile/${notification.user.username}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500 animate-pulse-once" />;
      case "comment":
        return (
          <MessageCircle className="h-4 w-4 text-blue-500 animate-slide-up" />
        );
      case "follow":
        return (
          <UserPlus className="h-4 w-4 text-green-500 animate-slide-right" />
        );
      default:
        return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case "like":
        return (
          <>
            <span className="font-semibold">{notification.user.username}</span>{" "}
            liked your meme
          </>
        );
      case "comment":
        return (
          <>
            <span className="font-semibold">{notification.user.username}</span>{" "}
            commented on your meme: "{notification.content}"
          </>
        );
      case "follow":
        return (
          <>
            <span className="font-semibold">{notification.user.username}</span>{" "}
            started following you
          </>
        );
      default:
        return null;
    }
  };

  if (loading && page === 1) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4">
          {error}
          <Button
            variant="outline"
            size="sm"
            className="ml-2"
            onClick={handleRefresh}
          >
            Try Again
          </Button>
        </div>
      )}

      <Card>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-lg font-medium">No notifications yet</h3>
                <p className="text-muted-foreground">
                  When you get notifications, they'll appear here
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer animate-slide-up ${
                      !notification.read ? "bg-muted/30" : ""
                    }`}
                    style={{ animationDelay: `${Math.min(index, 10) * 0.05}s` }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      {getNotificationIcon(notification.type)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={notification.user.profilePicture}
                            alt={notification.user.username}
                          />
                          <AvatarFallback>
                            {notification.user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="break-words">
                          {getNotificationText(notification)}
                        </p>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.timestamp), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    {notification.type === "follow" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/profile/${notification.user.username}`);
                        }}
                      >
                        View Profile
                      </Button>
                    )}
                  </div>
                ))}

                {hasMore && (
                  <div className="p-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full"
                    >
                      {loadingMore ? (
                        <>
                          <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                          Loading more...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </ScrollArea>
      </Card>
    </div>
  );
}
