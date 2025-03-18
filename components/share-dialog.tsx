"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Send, LinkIcon, Copy, Check, Share2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { toast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import axios from "axios"
import type { Post } from "@/lib/types"

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
}

interface User {
  id: string
  username: string
  profilePicture: string
  isFollowing?: boolean
}

export function ShareDialog({ open, onOpenChange, post }: ShareDialogProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [connections, setConnections] = useState<User[]>([])
  const [filteredConnections, setFilteredConnections] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("direct")
  const [message, setMessage] = useState(`Check out this meme!`)

  // Generate post URL
  const postUrl = typeof window !== "undefined" ? `${window.location.origin}/post/${post.id}` : `/post/${post.id}`

  // Fetch user's connections (followers and following)
  useEffect(() => {
    const fetchConnections = async () => {
      if (!user || !open) return

      try {
        setLoading(true)
        // Get both followers and following
        const [followersRes, followingRes] = await Promise.all([
          axios.get(`/api/users/${user.username}/followers`),
          axios.get(`/api/users/${user.username}/following`),
        ])

        if (followersRes.data.success && followingRes.data.success) {
          // Combine and deduplicate connections
          const allConnections = [...followersRes.data.data, ...followingRes.data.data]
          const uniqueConnections = Array.from(new Map(allConnections.map((conn) => [conn.id, conn])).values())
          setConnections(uniqueConnections)
          setFilteredConnections(uniqueConnections)
        }
      } catch (error) {
        console.error("Error fetching connections:", error)
        toast({
          title: "Error",
          description: "Failed to load your connections",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConnections()
  }, [user, open])

  // Filter connections based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredConnections(connections)
    } else {
      const filtered = connections.filter((conn) => conn.username.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredConnections(filtered)
    }
  }, [searchQuery, connections])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedUsers([])
      setSearchQuery("")
      setMessage(`Check out this meme!`)
      setCopied(false)
      setActiveTab("direct")
    }
  }, [open])

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl)
    setCopied(true)
    toast({
      title: "Link copied",
      description: "Post link copied to clipboard",
    })

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleShareViaMessages = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No recipients selected",
        description: "Please select at least one person to share with",
        variant: "destructive",
      })
      return
    }

    setSharing(true)
    try {
      // Create direct messages to each selected user
      const promises = selectedUsers.map(async (recipientId) => {
        try {
          // First get or create a conversation with this user
          const convResponse = await axios.get(`/api/messages/conversations/${recipientId}`)
          const conversationId = convResponse.data.data.id

          // Then send a message with the post link
          return axios.post(`/api/messages/${conversationId}`, {
            text: `${message} ${postUrl}`,
          })
        } catch (err) {
          console.error(`Error sharing with user ${recipientId}:`, err)
          return Promise.reject(err)
        }
      })

      await Promise.all(promises)

      toast({
        title: "Meme shared",
        description: `Shared with ${selectedUsers.length} ${selectedUsers.length === 1 ? "person" : "people"}`,
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error sharing post:", error)
      toast({
        title: "Error",
        description: "Failed to share the meme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSharing(false)
    }
  }

  const handleShareToSocial = (platform: string) => {
    let shareUrl = ""

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(postUrl)}`
        break
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
        break
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`${message} ${postUrl}`)}`
        break
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(message)}`
        break
      default:
        return
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer")

    toast({
      title: "Opening share window",
      description: `Sharing to ${platform}`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] animate-slide-up">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Meme
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          {/* Preview of the meme being shared */}
          <div className="rounded-lg overflow-hidden border">
            <div className="p-2 flex items-center gap-2 bg-muted/30">
              <Avatar className="h-6 w-6">
                <AvatarImage src={post.user.profilePicture} alt={post.user.username} />
                <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">@{post.user.username}</span>
            </div>
            <img src={post.image || "/placeholder.svg"} alt={post.text} className="w-full h-32 object-cover" />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="direct">Direct Message</TabsTrigger>
              <TabsTrigger value="link">Copy Link</TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="mt-4 space-y-4 animate-fade-in">
              <div className="space-y-2">
                <div className="text-sm font-medium">Share message</div>
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message..."
                  className="w-full"
                />
              </div>

              {/* Search input */}
              <div className="relative">
                <div className="text-sm font-medium mb-2">Select recipients</div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search friends..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Selected users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((userId) => {
                    const selectedUser = connections.find((c) => c.id === userId)
                    if (!selectedUser) return null

                    return (
                      <div
                        key={userId}
                        className="flex items-center gap-1 bg-primary/10 text-primary rounded-full pl-1 pr-2 py-0.5 text-xs"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={selectedUser.profilePicture} alt={selectedUser.username} />
                          <AvatarFallback>{selectedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span>{selectedUser.username}</span>
                        <button
                          onClick={() => toggleUserSelection(userId)}
                          className="ml-1 text-primary hover:text-primary/80"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Connections list */}
              <ScrollArea className="h-[200px] pr-4 border rounded-md">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                  </div>
                ) : filteredConnections.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {connections.length === 0
                      ? "You don't have any connections yet"
                      : "No connections match your search"}
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredConnections.map((connection) => (
                      <div
                        key={connection.id}
                        className={`flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer ${
                          selectedUsers.includes(connection.id) ? "bg-muted" : ""
                        }`}
                        onClick={() => toggleUserSelection(connection.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={connection.profilePicture} alt={connection.username} />
                            <AvatarFallback>{connection.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="font-medium text-sm">{connection.username}</div>
                        </div>
                        <div
                          className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                            selectedUsers.includes(connection.id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground"
                          }`}
                        >
                          {selectedUsers.includes(connection.id) && <Check className="h-3 w-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <Button
                className="w-full"
                onClick={handleShareViaMessages}
                disabled={selectedUsers.length === 0 || sharing}
              >
                {sharing ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Share with {selectedUsers.length} {selectedUsers.length === 1 ? "person" : "people"}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="link" className="mt-4 space-y-4 animate-fade-in">
              <div className="space-y-2">
                <div className="text-sm font-medium">Post link</div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={postUrl} readOnly className="pl-8 pr-10" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`absolute right-1 top-1 h-7 w-7 ${copied ? "animate-pulse-once" : ""}`}
                      onClick={handleCopyLink}
                    >
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Share to social media</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    onClick={() => handleShareToSocial("twitter")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-400"
                    >
                      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                    </svg>
                    Twitter
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    onClick={() => handleShareToSocial("facebook")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-600"
                    >
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    Facebook
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    onClick={() => handleShareToSocial("whatsapp")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-500"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                    </svg>
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    onClick={() => handleShareToSocial("telegram")}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-blue-500"
                    >
                      <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-8.609 3.33c-2.068.8-4.133 1.598-5.724 2.21a405.15 405.15 0 0 1-2.849 1.09c-.42.147-.99.332-1.473.901-.728.968.193 1.798.919 2.286 1.61.516 3.275 1.009 4.654 1.472.846 1.467 1.683 2.975 2.525 4.441 1.296.163 1.637-.012 2.149-.63.355-.4.501-.663.788-1.467.178-.625.627-1.324 1.13-1.824.249-.249.475-.416.695-.532.678-.412 1.046-.293 1.315.14.45.733 1.3 2.237 1.841 3.209.193.348.344.615.502.915.103.189.225.366.42.465.361.183.53.083.762-.244.166-.234.336-.487.488-.733.236-.387.468-.773.705-1.155.347-.569.682-1.067 1.904-1.751.62-.348 1.712-.942 2.268-1.213 1.47-.708 1.614-.876 1.9-1.828.142-.486.262-2.886.32-4.007.02-.395-.026-1.28-.2-1.517-.139-.187-.58-.26-.96-.303-.626-.077-1.92-.137-1.17-.137z"></path>
                    </svg>
                    Telegram
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

