"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { formatDistanceToNow } from "date-fns"
import { Send, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Conversation, Message as MessageType } from "@/lib/types"
import { useAuth } from "@/components/auth-provider"
import axios from "axios"
import io from "socket.io-client"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

// Initialize socket connection
let socket: any

export function Messages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const socketInitialized = useRef(false)

  // Initialize router at the beginning of the component
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check for shared post in URL
  const sharedPostId = searchParams?.get("share")

  useEffect(() => {
    // If there's a shared post ID in the URL, find a way to share it
    if (sharedPostId && activeConversation) {
      const postUrl = `${window.location.origin}/post/${sharedPostId}`
      setNewMessage(`Check out this meme: ${postUrl}`)
    }
  }, [sharedPostId, activeConversation])

  // Initialize socket connection
  useEffect(() => {
    if (user && !socketInitialized.current) {
      // Connect to the socket server
      socket = io("http://localhost:5001", {
        withCredentials: true,
      })

      // Listen for new messages
      socket.on("newMessage", (message: MessageType) => {
        // Update the conversations with the new message
        setConversations((prevConversations) => {
          return prevConversations.map((conv) => {
            if (conv.id === message.conversationId) {
              return {
                ...conv,
                messages: [...conv.messages, message],
                lastMessage: {
                  text: message.text,
                  timestamp: message.timestamp,
                },
              }
            }
            return conv
          })
        })

        // If the active conversation is the one receiving the message, update it
        if (activeConversation?.id === message.conversationId) {
          setActiveConversation((prev) => {
            if (!prev) return null
            return {
              ...prev,
              messages: [...prev.messages, message],
              lastMessage: {
                text: message.text,
                timestamp: message.timestamp,
              },
            }
          })
        }
      })

      socketInitialized.current = true

      // Clean up on unmount
      return () => {
        socket.disconnect()
        socketInitialized.current = false
      }
    }
  }, [user])

  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get("/api/messages/conversations")
        if (data.success) {
          setConversations(data.data)
          // Set the first conversation as active if there is one
          if (data.data.length > 0) {
            setActiveConversation(data.data[0])
          }
        }
      } catch (error) {
        console.error("Error fetching conversations:", error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchConversations()
    }
  }, [user])

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    if (activeConversation) {
      // Mark all messages in this conversation as read
      axios
        .put(`/api/messages/${activeConversation.id}/read`)
        .then(() => {
          // Update the unread message count in the navbar (via socket)
          if (socket) {
            socket.emit("messagesRead")
          }
        })
        .catch((error) => {
          console.error("Error marking messages as read:", error)
        })
    }
  }, [activeConversation])

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConversation?.messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || !activeConversation) return

    try {
      // Optimistically add the message to the UI
      const tempMessage: MessageType = {
        id: `temp-${Date.now()}`,
        senderId: user?.id || "",
        text: newMessage,
        timestamp: new Date().toISOString(),
        conversationId: activeConversation.id,
      }

      // Update the active conversation with the new message
      setActiveConversation((prev) => {
        if (!prev) return null
        return {
          ...prev,
          messages: [...prev.messages, tempMessage],
          lastMessage: {
            text: tempMessage.text,
            timestamp: tempMessage.timestamp,
          },
        }
      })

      // Update the conversations list
      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          if (conv.id === activeConversation.id) {
            return {
              ...conv,
              messages: [...conv.messages, tempMessage],
              lastMessage: {
                text: tempMessage.text,
                timestamp: tempMessage.timestamp,
              },
            }
          }
          return conv
        })
      })

      // Clear the input
      setNewMessage("")

      // Send the message to the server
      const { data } = await axios.post(`/api/messages/${activeConversation.id}`, {
        text: tempMessage.text,
      })

      if (!data.success) {
        console.error("Error sending message:", data)
        // If there's an error, we could revert the optimistic update here
      }
    } catch (error) {
      console.error("Error sending message:", error)
      // Revert the optimistic update on error
    }
  }

  // Render a shared post in the message
  const renderSharedPost = (message: MessageType) => {
    if (!message.sharedPost) return null

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
              <div className="font-medium">@{message.sharedPost.user?.username || "unknown"}</div>
              <div className="truncate">{message.sharedPost.text || ""}</div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col rounded-lg border md:flex-row">
      {/* Conversations list */}
      <div className="w-full border-b md:w-80 md:border-b-0 md:border-r">
        <div className="p-4">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        <ScrollArea className="h-[calc(100vh-10rem)]">
          <div className="space-y-1 p-2">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <p className="text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conversation, index) => (
                <button
                  key={conversation.id}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-300 hover:bg-muted animate-fade-in ${
                    activeConversation?.id === conversation.id ? "bg-muted" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                  onClick={() => setActiveConversation(conversation)}
                >
                  <Avatar>
                    <AvatarImage src={conversation.user.profilePicture} alt={conversation.user.username} />
                    <AvatarFallback>{conversation.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 overflow-hidden">
                    <div
                      className="font-medium hover:underline cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/profile/${conversation.user.username}`)
                      }}
                    >
                      {conversation.user.username}
                    </div>
                    <div className="truncate text-sm text-muted-foreground">{conversation.lastMessage.text}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(conversation.lastMessage.timestamp), {
                      addSuffix: false,
                    })}
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Active conversation */}
      {activeConversation ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b p-4">
            <Avatar>
              <AvatarImage src={activeConversation.user.profilePicture} alt={activeConversation.user.username} />
              <AvatarFallback>{activeConversation.user.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div
                className="font-medium hover:underline cursor-pointer"
                onClick={() => router.push(`/profile/${activeConversation.user.username}`)}
              >
                {activeConversation.user.username}
              </div>
              <div className="text-xs text-muted-foreground">Active now</div>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {activeConversation.messages.map((message, index) => {
                const isCurrentUser = message.senderId === user?.id

                return (
                  <div
                    key={message.id}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"} animate-fade-in`}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div>{message.text}</div>
                      {message.sharedPost && renderSharedPost(message)}
                      <div
                        className={`mt-1 text-right text-xs ${
                          isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <form onSubmit={handleSendMessage} className="flex gap-2 border-t p-4">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim()}
              className="transition-all duration-300 hover:scale-110"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-4 text-center">
          <h3 className="text-lg font-medium">No conversation selected</h3>
          <p className="text-muted-foreground">Select a conversation from the list to start chatting</p>
        </div>
      )}
    </div>
  )
}

