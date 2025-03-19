"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Send,
  ExternalLink,
  Image,
  MoreVertical,
  Trash2,
  Reply,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Conversation, Message as MessageType } from "@/lib/types";
import { useAuth } from "@/components/auth-provider";
import axios from "axios";
import io from "socket.io-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

// Initialize socket connection
let socket: any;

export function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketInitialized = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageImage, setMessageImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<MessageType | null>(null);
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(
    new Set()
  );
  const [newMessageAnimation, setNewMessageAnimation] = useState(false);

  // Add these state variables after the existing ones:
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeen, setLastSeen] = useState<Record<string, Date>>({});
  const [showReadReceipts, setShowReadReceipts] = useState(true);
  const [userSettings, setUserSettings] = useState({
    showOnlineStatus: true,
    showReadReceipts: true,
  });

  // Initialize router at the beginning of the component
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for shared post in URL
  const sharedPostId = searchParams?.get("share");

  useEffect(() => {
    // If there's a shared post ID in the URL, find a way to share it
    if (sharedPostId && activeConversation) {
      const postUrl = `${window.location.origin}/post/${sharedPostId}`;
      setNewMessage(`Check out this meme: ${postUrl}`);
    }
  }, [sharedPostId, activeConversation]);

  // Initialize socket connection
  useEffect(() => {
    if (user && !socketInitialized.current) {
      console.log("Initializing socket connection for messages");

      // Connect to the socket server with auth token
      const token = document.cookie.split("token=")[1]?.split(";")[0];
      socket = io("http://localhost:5001", {
        withCredentials: true,
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Store socket in window for global access
      if (typeof window !== "undefined") {
        (window as any).socket = socket;
      }

      // Debug socket connection
      socket.on("connect", () => {
        console.log("Socket connected successfully with ID:", socket.id);
        socket.emit("getOnlineUsers");
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
      });

      // Listen for new messages
      socket.on("newMessage", (message: MessageType) => {
        console.log("New message received via socket:", message);

        // Update the conversations with the new message
        setConversations((prevConversations) => {
          // Check if this conversation already exists
          const existingConvIndex = prevConversations.findIndex(
            (conv) => conv.id === message.conversationId
          );

          if (existingConvIndex >= 0) {
            // Update existing conversation
            const updatedConversations = [...prevConversations];
            const conversation = { ...updatedConversations[existingConvIndex] };

            // Add the message to the conversation
            conversation.messages = [...conversation.messages, message];
            conversation.lastMessage = {
              text: message.text,
              timestamp: message.timestamp,
            };

            // If this is not the active conversation or the message is not from the current user,
            // mark the conversation as unread
            if (
              (!activeConversation ||
                activeConversation.id !== message.conversationId) &&
              message.senderId !== user?.id
            ) {
              setUnreadConversations((prev) =>
                new Set(prev).add(message.conversationId)
              );
            }

            // Move this conversation to the top of the list
            updatedConversations.splice(existingConvIndex, 1);
            updatedConversations.unshift(conversation);

            return updatedConversations;
          } else {
            // This is a new conversation - we should fetch the full conversation data
            fetchConversations();
            return prevConversations;
          }
        });

        // If the active conversation is the one receiving the message, update it
        setActiveConversation((prev) => {
          if (!prev || prev.id !== message.conversationId) return prev;

          // Trigger the new message animation
          setNewMessageAnimation(true);
          setTimeout(() => setNewMessageAnimation(false), 500);

          return {
            ...prev,
            messages: [...prev.messages, message],
            lastMessage: {
              text: message.text,
              timestamp: message.timestamp,
            },
          };
        });
      });

      // Listen for message deletions
      socket.on("messageDeleted", ({ messageId, conversationId }) => {
        console.log("Message deletion notification received:", messageId);

        // Update conversations
        setConversations((prevConversations) =>
          prevConversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: conv.messages.filter((msg) => msg.id !== messageId),
              };
            }
            return conv;
          })
        );

        // Update active conversation if needed
        setActiveConversation((prev) => {
          if (!prev || prev.id !== conversationId) return prev;
          return {
            ...prev,
            messages: prev.messages.filter((msg) => msg.id !== messageId),
          };
        });
      });

      socket.on("onlineUsers", (users: string[]) => {
        console.log("Online users update received:", users);
        setOnlineUsers(new Set(users));
      });

      socket.on("userConnected", (userId: string) => {
        console.log("User connected:", userId);
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.add(userId);
          return updated;
        });
      });

      socket.on("userDisconnected", (userId: string, lastActive: string) => {
        console.log("User disconnected:", userId);
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });

        // Update last seen time
        if (lastActive) {
          setLastSeen((prev) => ({
            ...prev,
            [userId]: new Date(lastActive),
          }));
        }
      });

      socket.on("messageRead", ({ conversationId, messageId }) => {
        console.log("Message read notification:", {
          conversationId,
          messageId,
        });

        // Update the read status of messages
        setActiveConversation((prev) => {
          if (!prev || prev.id !== conversationId) return prev;

          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === messageId || (msg.senderId !== user?.id && !msg.read)
                ? { ...msg, read: true }
                : msg
            ),
          };
        });

        // Also update in the conversations list
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== conversationId) return conv;

            return {
              ...conv,
              messages: conv.messages.map((msg) =>
                msg.id === messageId || (msg.senderId !== user?.id && !msg.read)
                  ? { ...msg, read: true }
                  : msg
              ),
            };
          })
        );
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

  // Add a polling mechanism to fetch new messages periodically
  useEffect(() => {
    if (!user || !activeConversation) return;

    // Set up polling for new messages every 5 seconds as a fallback
    const intervalId = setInterval(() => {
      if (activeConversation) {
        // Fetch the latest messages for the active conversation
        axios
          .get(`/api/messages/conversations/${activeConversation.user.id}`)
          .then(({ data }) => {
            if (data.success) {
              // Only update if there are new messages
              if (
                data.data.messages.length > activeConversation.messages.length
              ) {
                console.log("Polling found new messages");
                setActiveConversation(data.data);

                // Also update in the conversations list
                setConversations((prev) =>
                  prev.map((conv) =>
                    conv.id === data.data.id ? data.data : conv
                  )
                );
              }
            }
          })
          .catch((error) => {
            console.error("Error polling for messages:", error);
          });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [user, activeConversation]);

  // Add the fetchConversations function at the component level
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/messages/conversations");
      if (data.success) {
        setConversations(data.data);

        // Identify unread conversations
        const unread = new Set<string>();
        data.data.forEach((conv: Conversation) => {
          const hasUnreadMessages = conv.messages.some(
            (msg) => !msg.read && msg.senderId !== user?.id
          );
          if (hasUnreadMessages) {
            unread.add(conv.id);
          }
        });
        setUnreadConversations(unread);

        // Set the first conversation as active if there is one and no active conversation
        if (data.data.length > 0 && !activeConversation) {
          // Don't automatically set active conversation - wait for user to click
          // setActiveConversation(data.data[0])
        }
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch conversations
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Fetch user settings
  useEffect(() => {
    if (user) {
      // In a real app, this would be an API call to get user settings
      // For now, we'll simulate it
      const fetchUserSettings = async () => {
        try {
          // This would be an API call in a real app
          // const { data } = await axios.get("/api/users/settings")
          // setUserSettings(data.settings)

          // For now, we'll use default settings
          setUserSettings({
            showOnlineStatus: true,
            showReadReceipts: true,
          });
        } catch (error) {
          console.error("Error fetching user settings:", error);
        }
      };

      fetchUserSettings();
    }
  }, [user]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (activeConversation) {
      // Remove from unread conversations
      setUnreadConversations((prev) => {
        const updated = new Set(prev);
        updated.delete(activeConversation.id);
        return updated;
      });

      // Check if there are any unread messages from the other user
      const hasUnreadMessages = activeConversation.messages.some(
        (msg) => !msg.read && msg.senderId !== user?.id
      );

      if (hasUnreadMessages) {
        // Mark all messages in this conversation as read
        axios
          .put(`/api/messages/${activeConversation.id}/read`)
          .then(() => {
            // Update the unread message count in the navbar (via socket)
            if (socket) {
              socket.emit("messagesRead", {
                conversationId: activeConversation.id,
                userId: activeConversation.user.id,
              });
            }

            // Update the read status locally
            setActiveConversation((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                messages: prev.messages.map((msg) =>
                  msg.senderId !== user?.id ? { ...msg, read: true } : msg
                ),
              };
            });

            // Also update in the conversations list
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== activeConversation.id) return conv;

                return {
                  ...conv,
                  messages: conv.messages.map((msg) =>
                    msg.senderId !== user?.id ? { ...msg, read: true } : msg
                  ),
                };
              })
            );
          })
          .catch((error) => {
            console.error("Error marking messages as read:", error);
          });
      }
    }
  }, [activeConversation, user?.id]);

  // Scroll to bottom when new messages are added, but use a fade-in animation instead
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [activeConversation?.messages]);

  // Update the handleSendMessage function to ensure images are properly stored
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && !messageImage) || !activeConversation) return;

    try {
      let imageUrl = null;
      if (messageImage) {
        setIsUploading(true);
        // Upload image to server
        const uploadResponse = await axios.post("/api/upload", {
          image: messageImage,
          isMessageImage: true,
        });

        if (uploadResponse.data.success) {
          imageUrl = uploadResponse.data.data.url;
          console.log("Image uploaded successfully:", imageUrl);
        } else {
          throw new Error("Failed to upload image");
        }
      }

      // Optimistically add the message to the UI
      const tempMessage: MessageType = {
        id: `temp-${Date.now()}`,
        senderId: user?.id || "",
        text: newMessage.trim() || (imageUrl ? "Sent an image" : ""),
        timestamp: new Date().toISOString(),
        conversationId: activeConversation.id,
        image: imageUrl,
        replyTo: replyingTo ? replyingTo.id : undefined,
      };

      // Update the active conversation with the new message
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, tempMessage],
          lastMessage: {
            text: tempMessage.text,
            timestamp: tempMessage.timestamp,
          },
        };
      });

      // Update the conversations list
      setConversations((prevConversations) => {
        const updatedConversations = prevConversations.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              messages: [...conv.messages, tempMessage],
              lastMessage: {
                text: tempMessage.text,
                timestamp: tempMessage.timestamp,
              },
            };
          }
          return conv;
        });

        // Move the active conversation to the top
        const activeConvIndex = updatedConversations.findIndex(
          (conv) => conv.id === activeConversation.id
        );
        if (activeConvIndex > 0) {
          const [activeConv] = updatedConversations.splice(activeConvIndex, 1);
          updatedConversations.unshift(activeConv);
        }

        return updatedConversations;
      });

      // Clear the input and reset states
      setNewMessage("");
      setMessageImage(null);
      setReplyingTo(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      // Send the message to the server
      console.log("Sending message to server:", {
        text: newMessage.trim() || (imageUrl ? "Sent an image" : ""),
        image: imageUrl,
        replyToId: replyingTo?.id,
      });

      const { data } = await axios.post(
        `/api/messages/${activeConversation.id}`,
        {
          text: newMessage.trim() || (imageUrl ? "Sent an image" : ""),
          image: imageUrl,
          replyToId: replyingTo?.id,
        }
      );

      if (!data.success) {
        console.error("Error sending message:", data);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
        // Revert the optimistic update
        fetchConversations();
      } else {
        console.log("Message sent successfully:", data);
        // Replace the temp message with the real one
        setActiveConversation((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: prev.messages.map((msg) =>
              msg.id === tempMessage.id ? data.data : msg
            ),
          };
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      // Revert the optimistic update on error
      fetchConversations();
    } finally {
      setIsUploading(false);
    }
  };

  const handleMessageImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image size should be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        console.log("Image loaded, size:", result.length);
        setMessageImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMessageImage = () => {
    setMessageImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeConversation) return;

    try {
      // Optimistically remove the message from UI
      setActiveConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: prev.messages.filter((msg) => msg.id !== messageId),
        };
      });

      // Call API to delete the message
      const { data } = await axios.delete(
        `/api/messages/${activeConversation.id}/${messageId}`
      );

      if (!data.success) {
        // If deletion fails, revert the UI change
        fetchConversations();
        throw new Error("Failed to delete message");
      }

      toast({
        title: "Message deleted",
        description: "Your message has been deleted",
      });
    } catch (error) {
      console.error("Error deleting message:", error);
      toast({
        title: "Error",
        description: "Failed to delete message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReplyToMessage = (message: MessageType) => {
    setReplyingTo(message);
  };

  const openImagePreview = (imageUrl: string) => {
    setPreviewImage(imageUrl);
    setImagePreviewOpen(true);
  };

  // Render a shared post in the message
  const renderSharedPost = (message: MessageType) => {
    if (!message.sharedPost) return null;

    return (
      <div className="mt-2 border rounded-md overflow-hidden">
        <div className="p-2 bg-muted/30 flex items-center gap-2">
          <span className="text-xs font-medium">Shared Post</span>
          <Link href={`/post/${message.sharedPost.id}`} className="ml-auto">
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <ExternalLink className="h-3 w-3" />
            </Button>
          </Link>
        </div>
        <Link href={`/post/${message.sharedPost.id}`} className="block">
          <div className="relative">
            <img
              src={message.sharedPost.image || "/placeholder.svg"}
              alt={message.sharedPost.text || "Shared meme"}
              className="w-full h-32 object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-white text-xs">
              <div className="font-medium">
                @{message.sharedPost.user?.username || "unknown"}
              </div>
              <div className="truncate">{message.sharedPost.text || ""}</div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  // Render a reply reference
  const renderReplyReference = (message: MessageType) => {
    if (!message.replyTo) return null;

    // Find the message being replied to
    const repliedMessage = activeConversation?.messages.find(
      (msg) => msg.id === message.replyTo
    );
    if (!repliedMessage) return null;

    // Determine if the replied message is from the current user
    const isRepliedMessageFromCurrentUser =
      repliedMessage.senderId === user?.id;

    return (
      <div className="mb-1">
        <div
          className={`px-3 py-2 rounded-lg mb-1 max-w-[250px] overflow-hidden ${
            isRepliedMessageFromCurrentUser
              ? "bg-indigo-600/20 border-l-2 border-indigo-600"
              : "bg-gray-800/30 border-l-2 border-gray-600"
          }`}
        >
          <div className="flex items-center gap-1 mb-1">
            <Reply className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-400">
              Replying to{" "}
              {isRepliedMessageFromCurrentUser
                ? "yourself"
                : activeConversation?.user.username}
            </span>
          </div>
          <div className="text-sm truncate">
            {repliedMessage.text ||
              (repliedMessage.image ? (
                <div className="flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  <span>Image</span>
                </div>
              ) : (
                "Message"
              ))}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  // Change the main container from flex to grid layout for better control over scrolling
  return (
    <div className="grid h-[calc(100vh-5rem)] grid-cols-1 md:grid-cols-[320px_1fr] rounded-lg border bg-gradient-to-br from-gray-950 to-gray-900 text-white overflow-hidden">
      {/* Conversations list - with a fixed header and scrollable content */}
      <div className="flex flex-col border-b md:border-b-0 md:border-r border-gray-800/50">
        <div className="p-4 border-b border-gray-800/50 bg-black/20">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <div className="overflow-y-auto flex-grow">
          <div className="space-y-0">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-gray-400">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation) => {
                // Check if there are unread messages in this conversation
                const hasUnreadMessages = unreadConversations.has(
                  conversation.id
                );
                const isActive = activeConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    className={`flex w-full items-center gap-3 p-4 text-left transition-all duration-300 hover:bg-black/20 border-b border-gray-800/30 ${
                      isActive ? "bg-black/30" : ""
                    } ${hasUnreadMessages ? "bg-black/10" : ""}`}
                    onClick={() => setActiveConversation(conversation)}
                  >
                    <div className="relative">
                      <Avatar
                        className={`h-12 w-12 ${
                          hasUnreadMessages ? "ring-2 ring-indigo-500" : ""
                        }`}
                      >
                        <AvatarImage
                          src={conversation.user.profilePicture}
                          alt={conversation.user.username}
                        />
                        <AvatarFallback>
                          {conversation.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {onlineUsers.has(conversation.user.id.toString()) && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-gray-900"></span>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div
                        className={`font-medium text-lg ${
                          hasUnreadMessages ? "font-bold text-white" : ""
                        }`}
                      >
                        {conversation.user.username}
                        {hasUnreadMessages && (
                          <Badge
                            variant="default"
                            className="ml-2 bg-indigo-600 text-xs"
                          >
                            New
                          </Badge>
                        )}
                      </div>
                      <div
                        className={`truncate text-sm ${
                          hasUnreadMessages
                            ? "font-semibold text-white"
                            : "text-gray-400"
                        }`}
                      >
                        {conversation.lastMessage.text || "New conversation"}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Active conversation - with fixed layout for header, messages area and input */}
      {activeConversation ? (
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-3 border-b border-gray-800/50 p-4 bg-black/20">
            <Link
              href={`/profile/${activeConversation.user.username}`}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={activeConversation.user.profilePicture}
                  alt={activeConversation.user.username}
                />
                <AvatarFallback>
                  {activeConversation.user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium text-lg">
                  {activeConversation.user.username}
                </div>
                <div className="text-xs text-gray-400">
                  {onlineUsers.has(activeConversation.user.id.toString())
                    ? "Active now"
                    : lastSeen[activeConversation.user.id.toString()]
                    ? `Last seen ${formatDistanceToNow(
                        new Date(
                          lastSeen[activeConversation.user.id.toString()]
                        ),
                        {
                          addSuffix: true,
                        }
                      )}`
                    : "Offline"}
                </div>
              </div>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-transparent">
            <div className="space-y-3 pb-2">
              {activeConversation.messages.map((message, index) => {
                // Message rendering logic remains the same
                // No changes needed here, just reinstating the existing code:
                const isCurrentUser = message.senderId === user?.id;
                const isLastMessage =
                  index === activeConversation.messages.length - 1;
                const showAvatar =
                  index === 0 ||
                  activeConversation.messages[index - 1].senderId !==
                    message.senderId ||
                  new Date(message.timestamp).getTime() -
                    new Date(
                      activeConversation.messages[index - 1].timestamp
                    ).getTime() >
                    5 * 60 * 1000;

                // Group messages by sender
                const isFirstInGroup =
                  index === 0 ||
                  activeConversation.messages[index - 1].senderId !==
                    message.senderId;

                const isLastInGroup =
                  index === activeConversation.messages.length - 1 ||
                  activeConversation.messages[index + 1].senderId !==
                    message.senderId;

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    } ${
                      isLastMessage && newMessageAnimation
                        ? "animate-pulse"
                        : ""
                    }`}
                  >
                    {!isCurrentUser && showAvatar ? (
                      <Avatar className="h-8 w-8 mr-2 mt-auto mb-1 flex-shrink-0">
                        <AvatarImage
                          src={activeConversation.user.profilePicture}
                          alt={activeConversation.user.username}
                        />
                        <AvatarFallback>
                          {activeConversation.user.username
                            .charAt(0)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      !isCurrentUser && (
                        <div className="w-10 flex-shrink-0"></div>
                      )
                    )}

                    <div
                      className={`max-w-[70%] flex flex-col ${
                        isCurrentUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Show username only for the first message in a group */}
                      {!isCurrentUser && isFirstInGroup && (
                        <div className="mb-1 text-xs text-gray-400">
                          {activeConversation.user.username}
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          isCurrentUser ? "items-end" : "items-start"
                        }`}
                      >
                        {/* Reply reference */}
                        {message.replyTo && renderReplyReference(message)}

                        <div
                          className={`px-4 py-2 ${
                            isCurrentUser
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-800 text-white"
                          } relative group ${
                            // Apply different border radius based on position in group
                            isFirstInGroup && isLastInGroup
                              ? "rounded-2xl"
                              : isFirstInGroup
                              ? isCurrentUser
                                ? "rounded-2xl rounded-br-lg"
                                : "rounded-2xl rounded-bl-lg"
                              : isLastInGroup
                              ? isCurrentUser
                                ? "rounded-2xl rounded-tr-lg"
                                : "rounded-2xl rounded-tl-lg"
                              : isCurrentUser
                              ? "rounded-2xl rounded-r-lg"
                              : "rounded-2xl rounded-l-lg"
                          }`}
                        >
                          {/* Message text */}
                          <div className="break-words">{message.text}</div>

                          {/* Message image if present */}
                          {message.image && (
                            <div className="mt-2">
                              <img
                                src={message.image || "/placeholder.svg"}
                                alt="Message attachment"
                                className="rounded-md max-h-60 object-cover cursor-pointer"
                                onClick={() => openImagePreview(message.image!)}
                              />
                            </div>
                          )}

                          {/* Shared post if present */}
                          {message.sharedPost && renderSharedPost(message)}

                          {/* Message timestamp and actions */}
                          <div className="mt-1 flex items-center justify-end gap-2 text-xs">
                            <span
                              className={
                                isCurrentUser
                                  ? "text-white/80"
                                  : "text-gray-400"
                              }
                            >
                              {formatDistanceToNow(
                                new Date(message.timestamp),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>

                            {/* "Seen" receipt (previously "Read") */}
                            {isCurrentUser &&
                              userSettings.showReadReceipts &&
                              message.read && (
                                <span className="text-indigo-300 text-[10px] flex items-center ml-2">
                                  <Check className="h-3 w-3 mr-0.5" />
                                  Seen
                                </span>
                              )}

                            {/* Actions that appear on hover */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 rounded-full hover:bg-gray-700"
                                onClick={() => handleReplyToMessage(message)}
                              >
                                <Reply className="h-3 w-3" />
                              </Button>

                              {isCurrentUser && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-5 w-5 rounded-full text-white hover:bg-indigo-700"
                                    >
                                      <MoreVertical className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="bg-gray-900 text-white border-gray-700"
                                  >
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteMessage(message.id)
                                      }
                                      className="text-red-400 hover:bg-gray-800"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply indicator */}
          {replyingTo && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-gray-800/50 flex items-center gap-2 bg-black/20">
              <div className="flex-1 border-l-2 border-indigo-600 pl-2 py-1">
                <div className="flex items-center gap-1">
                  <Reply className="h-4 w-4 text-gray-400" />
                  <div className="text-xs text-gray-400">
                    Replying to{" "}
                    {replyingTo.senderId === user?.id
                      ? "yourself"
                      : activeConversation.user.username}
                  </div>
                </div>
                <div className="text-sm truncate">
                  {replyingTo.text || (replyingTo.image ? "Image" : "Message")}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full hover:bg-gray-800"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Message input with image preview */}
          {messageImage && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-gray-800/50 bg-black/20">
              <div className="relative inline-block">
                <img
                  src={messageImage || "/placeholder.svg"}
                  alt="Message attachment preview"
                  className="rounded-md h-20 object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-6 w-6 rounded-full bg-black/80 hover:bg-black"
                  onClick={handleRemoveMessageImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="flex-shrink-0 flex gap-2 border-t border-gray-800/50 p-4 bg-black/20"
          >
            <div className="relative flex-1">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="pr-10 bg-gray-800/50 border-gray-700/50 text-white placeholder:text-gray-400 focus-visible:ring-indigo-600 rounded-full"
                disabled={isUploading}
              />
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleMessageImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-gray-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Image className="h-4 w-4" />
              </Button>
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={(!newMessage.trim() && !messageImage) || isUploading}
              className="bg-indigo-600 hover:bg-indigo-700 transition-all duration-300 hover:scale-110 rounded-full"
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center bg-transparent">
          <h3 className="text-lg font-medium">No conversation selected</h3>
          <p className="text-gray-400">
            Select a conversation from the list to start chatting
          </p>
        </div>
      )}

      {/* Image preview dialog */}
      <Dialog open={imagePreviewOpen} onOpenChange={setImagePreviewOpen}>
        <DialogContent className="max-w-3xl p-4 bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Image</DialogTitle>
          </DialogHeader>
          {previewImage && (
            <div className="flex justify-center">
              <img
                src={previewImage || "/placeholder.svg"}
                alt="Full size preview"
                className="max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
