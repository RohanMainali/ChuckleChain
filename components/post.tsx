"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, MoreHorizontal, Share2, Trash2, Tag, X, Edit2, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardFooter, CardHeader } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth-provider"
import type { Post as PostType } from "@/lib/types"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShareDialog } from "@/components/share-dialog"
import axios from "axios"
import { toast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { useMobile } from "@/hooks/use-mobile"

// Add this at the beginning of the file, after the imports
// Declare the global window type to include our comment ID mapping
declare global {
  interface Window {
    _commentIdMap?: Record<string, string>
    _pendingDeletions?: Array<{
      postId: string
      tempCommentId: string
      text: string
    }>
  }
}

// Update the Post interface to include the updatedPost property
interface PostProps {
  post: PostType
  onDelete: (postId: string) => void
  onLike: (postId: string) => void
  onComment: (
    postId: string,
    comment: {
      id: string
      user: string
      profilePicture?: string
      text: string
      replyTo?: string
      isRefreshTrigger?: boolean
      updatedPost?: PostType // Add this property
    },
  ) => void
}

export function Post({ post, onDelete, onLike, onComment }: PostProps) {
  const { user } = useAuth()
  const [comment, setComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const commentInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null)
  const { isMobile } = useMobile()

  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(post.text)
  const [isSaving, setIsSaving] = useState(false)

  // User tagging state
  const [taggedUsers, setTaggedUsers] = useState<Array<{ id: string; username: string }>>([])
  const [searchUsers, setSearchUsers] = useState<Array<{ id: string; username: string; profilePicture: string }>>([])
  const [showTagPopover, setShowTagPopover] = useState(false)
  const [tagPopoverPosition, setTagPopoverPosition] = useState({ x: 0, y: 0 })
  const [mentionSearch, setMentionSearch] = useState("")
  const [showMentionPopover, setShowMentionPopover] = useState(false)

  const isCurrentUserPost = post.user.id === user?.id

  const handleLike = () => {
    onLike(post.id)
  }

  const handleDelete = () => {
    onDelete(post.id)
  }

  const handleCommentClick = () => {
    setShowComments(true)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 100)
  }

  const handleEdit = () => {
    setEditedText(post.text)
    setIsEditing(true)
  }

  // Search for users to tag
  const searchForUsers = async (query: string) => {
    if (query.length < 1) return // Reduced minimum length to 1 character

    try {
      const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (data.success) {
        setSearchUsers(data.data)
        // Force the mention popover to stay open if we have results
        if (data.data.length > 0) {
          setShowMentionPopover(true)
        }
      }
    } catch (error) {
      console.error("Error searching for users:", error)
    }
  }

  // Update the handleCommentChange function to better track the @ position
  const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setComment(e.target.value)

    // Check for @ symbol to trigger user search
    const lastAtSymbol = e.target.value.lastIndexOf("@")
    if (lastAtSymbol !== -1) {
      const afterAt = e.target.value.substring(lastAtSymbol + 1)
      const spaceAfterAt = afterAt.indexOf(" ")
      const searchTerm = spaceAfterAt === -1 ? afterAt : afterAt.substring(0, spaceAfterAt)

      if (searchTerm.length > 0) {
        setMentionSearch(searchTerm)
        searchForUsers(searchTerm)
        setShowMentionPopover(true)
      } else {
        setShowMentionPopover(false)
      }
    } else {
      setShowMentionPopover(false)
    }
  }

  // Update the handleTagUser function to properly replace the partial username
  const handleTagUser = (selectedUser: { id: string; username: string }) => {
    // Find the last @ symbol position
    const lastAtSymbol = comment.lastIndexOf("@")

    if (lastAtSymbol !== -1) {
      // Get the text before the @ symbol
      const beforeAt = comment.substring(0, lastAtSymbol)

      // Create the new comment text by replacing the partial username
      const newComment = beforeAt + `@${selectedUser.username} `
      setComment(newComment)
    } else {
      // If no @ symbol found (unlikely), just append the username
      const newComment = comment + `@${selectedUser.username} `
      setComment(newComment)
    }

    setShowTagPopover(false)
    setShowMentionPopover(false)

    // Focus back on the input
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus()
      }
    }, 100)
  }

  // Update the handleSaveEdit function to properly update memeTexts if needed
  const handleSaveEdit = async () => {
    if (!editedText.trim() || editedText === post.text) {
      setIsEditing(false)
      return
    }

    setIsSaving(true)

    try {
      // Create an updated post object with the new text
      const updatedPost = {
        ...post,
        text: editedText,
      }

      // If the post has memeTexts, update the text in the memeTexts array
      if (post.memeTexts && post.memeTexts.length > 0) {
        // Create a new memeTexts array with the updated text
        updatedPost.memeTexts = post.memeTexts.map((text) => ({
          ...text,
          text: editedText, // Replace the text in ALL memeTexts elements
        }))
      }

      // Update the UI immediately (optimistic update)
      onComment(post.id, {
        id: "edit-update",
        user: "",
        text: "",
        isRefreshTrigger: true,
        updatedPost: updatedPost,
      })

      // Make the API call to update the post in the database
      const { data } = await axios.put(`/api/posts/${post.id}`, {
        text: editedText,
        memeTexts: updatedPost.memeTexts,
      })

      if (data.success) {
        // If successful, update with the server response data
        const serverUpdatedPost = data.data

        // Update the UI with the server data
        onComment(post.id, {
          id: "edit-update-confirmed",
          user: "",
          text: "",
          isRefreshTrigger: true,
          updatedPost: serverUpdatedPost,
        })

        toast({
          title: "Success",
          description: "Post updated successfully",
        })
      }
    } catch (error) {
      console.error("Error updating post:", error)

      // Revert to original text if there's an error
      const originalPost = {
        ...post,
      }

      onComment(post.id, {
        id: "edit-update-error",
        user: "",
        text: "",
        isRefreshTrigger: true,
        updatedPost: originalPost,
      })

      toast({
        title: "Error",
        description: "Failed to update post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditedText(post.text)
  }

  // Update the extractMentions function to better handle mentions
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const matches = text.match(mentionRegex)
    if (!matches) return []

    // Remove the @ symbol and extract just the usernames
    return matches.map((match) => match.substring(1))
  }

  // Update the handleAddComment function to properly handle mentions
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    try {
      // Extract mentions from the comment
      const mentions = extractMentions(comment)
      console.log("Extracted mentions:", mentions)

      if (replyingTo) {
        // Create an optimistic reply to update the UI immediately
        const tempId = `temp-${Date.now()}`
        const optimisticReply = {
          id: tempId,
          user: user?.username || "",
          profilePicture: user?.profilePicture,
          text: comment,
          replyTo: replyingTo.id,
          timestamp: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
        }

        // Add the optimistic reply to the post's comments
        const updatedComments = [...post.comments, optimisticReply]
        post.comments = updatedComments

        // Force a re-render
        onComment(post.id, {
          ...optimisticReply,
          isRefreshTrigger: true,
        })

        try {
          // Make the API call
          const endpoint = `/api/posts/${post.id}/comments/${replyingTo.id}/reply`
          console.log("Sending reply to endpoint:", endpoint, "with text:", comment, "and mentions:", mentions)

          const { data } = await axios.post(endpoint, {
            text: comment,
            mentions: mentions,
          })

          if (data.success) {
            console.log("Reply added successfully:", data)

            // Replace the optimistic reply with the real one from the server
            const realReply = {
              id: data.data.id,
              user: data.data.user,
              profilePicture: data.data.profilePicture,
              text: data.data.text,
              replyTo: replyingTo.id,
              timestamp: data.data.createdAt || new Date().toISOString(),
              likeCount: 0,
              isLiked: false,
            }

            // Store a mapping from temp ID to real ID for future reference
            window._commentIdMap = window._commentIdMap || {}
            window._commentIdMap[tempId] = data.data.id

            // Update the post's comments array by replacing the optimistic reply
            post.comments = post.comments.map((c) => (c.id === tempId ? realReply : c))

            // Force another re-render with the real data
            onComment(post.id, {
              ...realReply,
              isRefreshTrigger: true,
            })
          }
        } catch (error) {
          console.error("Error details:", error.response?.data || error)

          // Even if there's an error, we'll keep the optimistic update
          // This way the user still sees their reply
          toast({
            title: "Warning",
            description: "Your reply was saved but there was an error. You may need to refresh to see all replies.",
            variant: "destructive",
          })
        }
      } else {
        // Regular comment with optimistic update
        const tempId = `temp-${Date.now()}`
        const optimisticComment = {
          id: tempId,
          user: user?.username || "",
          profilePicture: user?.profilePicture,
          text: comment,
          timestamp: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
        }

        // Add the optimistic comment
        post.comments.push(optimisticComment)

        // Force a re-render
        onComment(post.id, {
          ...optimisticComment,
          isRefreshTrigger: true,
        })

        try {
          // Make the API call
          const { data } = await axios.post(`/api/posts/${post.id}/comments`, {
            text: comment,
            mentions: mentions,
          })

          if (data.success) {
            // Store a mapping from temp ID to real ID for future reference
            window._commentIdMap = window._commentIdMap || {}
            window._commentIdMap[tempId] = data.data.id

            // Replace the optimistic comment with the real one
            post.comments = post.comments.map((c) => (c.id === tempId ? data.data : c))

            // Force another re-render
            onComment(post.id, {
              ...data.data,
              isRefreshTrigger: true,
            })
          }
        } catch (error) {
          console.error("Error adding comment:", error)
          toast({
            title: "Warning",
            description: "Your comment was saved but there was an error. You may need to refresh to see all comments.",
            variant: "destructive",
          })
        }
      }

      // Reset form regardless of success or failure
      setComment("")
      setReplyingTo(null)
      setShowMentionPopover(false)
    } catch (error) {
      console.error("Error in comment handling:", error)
      toast({
        title: "Error",
        description: "There was a problem with your comment. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Update the handleDeleteComment function to handle immediate deletions better
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Optimistically update UI first - remove the comment and its replies
      const updatedComments = post.comments.filter(
        (comment) => comment.id !== commentId && comment.replyTo !== commentId,
      )

      // Create a new post object with the updated comments
      const updatedPost = {
        ...post,
        comments: updatedComments,
      }

      // Force an immediate re-render by passing the updated post to the callback
      onComment(post.id, {
        id: "refresh-trigger",
        user: "",
        text: "",
        isRefreshTrigger: true,
        updatedPost: updatedPost,
      })

      // Check if this is a temporary ID (from optimistic updates)
      if (commentId.startsWith("temp-")) {
        // Check if we have a mapping to a real ID
        const realId = window._commentIdMap?.[commentId]

        if (realId) {
          // Use the real ID for the API call
          commentId = realId
          console.log(`Using mapped real ID ${realId} for temp ID ${commentId}`)
        } else {
          // If we can't find a real ID yet, just store this temp ID to be deleted when it gets a real ID
          window._pendingDeletions = window._pendingDeletions || []
          window._pendingDeletions.push({
            postId: post.id,
            tempCommentId: commentId,
            text: post.comments.find((c) => c.id === commentId)?.text || "",
          })

          toast({
            title: "Comment removed",
            description: "Your comment will be permanently deleted when processing completes",
          })

          return
        }
      }

      // Make the API call after updating the UI
      console.log(`Deleting comment with ID: ${commentId}`)
      const { data } = await axios.delete(`/api/posts/${post.id}/comments/${commentId}`)

      if (data.success) {
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting comment:", error)

      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        // The comment might not be fully saved yet, so we'll retry after a delay
        toast({
          title: "Processing",
          description: "Comment is still being processed. Retrying deletion...",
        })

        // Wait a bit longer and retry
        setTimeout(() => {
          handleDeleteComment(commentId)
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: "Failed to delete comment. Please try again.",
          variant: "destructive",
        })

        // Fetch fresh comments to restore correct state
        try {
          const { data } = await axios.get(`/api/posts/${post.id}`)
          if (data.success) {
            const freshPost = data.data

            // Create a new post object with the fresh comments
            const updatedPost = {
              ...post,
              comments: freshPost.comments,
            }

            // Force a re-render with the fresh data
            onComment(post.id, {
              id: "refresh-trigger",
              user: "",
              text: "",
              isRefreshTrigger: true,
              updatedPost: updatedPost,
            })
          }
        } catch (refreshError) {
          console.error("Error refreshing comments:", refreshError)
        }
      }
    }
  }

  // Add this function to process any pending deletions
  const processPendingDeletions = () => {
    if (!window._pendingDeletions || window._pendingDeletions.length === 0) return

    // Process each pending deletion
    const pendingDeletions = [...window._pendingDeletions]
    window._pendingDeletions = []

    pendingDeletions.forEach(async (pending) => {
      if (pending.postId !== post.id) return

      // Find if we now have a real ID for this comment
      const matchingComment = post.comments.find((c) => c.text === pending.text && !c.id.startsWith("temp-"))

      if (matchingComment) {
        console.log(`Found real comment ID ${matchingComment.id} for pending deletion`)
        try {
          await axios.delete(`/api/posts/${post.id}/comments/${matchingComment.id}`)

          // Remove from UI
          const updatedComments = post.comments.filter(
            (comment) => comment.id !== matchingComment.id && comment.replyTo !== matchingComment.id,
          )

          post.comments = updatedComments

          // Force a re-render
          onComment(post.id, {
            id: "refresh-trigger",
            user: "",
            text: "",
            isRefreshTrigger: true,
          })
        } catch (error) {
          console.error("Error processing pending deletion:", error)
        }
      } else {
        // Put it back in the queue if we still can't find it
        window._pendingDeletions.push(pending)
      }
    })
  }

  // Add this effect to check for pending deletions whenever comments change
  useEffect(() => {
    processPendingDeletions()
  }, [post.comments])

  // Update the handleReplyToComment function to ensure it works correctly
  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username })
    setShowComments(true)
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 100)
  }

  const handleShare = () => {
    setShareDialogOpen(true)
  }

  // Fix the like comment functionality to update UI immediately
  const handleLikeComment = async (commentId: string) => {
    try {
      // Optimistically update UI first
      const updatedComments = post.comments.map((comment) => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked
          return {
            ...comment,
            isLiked: newIsLiked,
            likeCount: newIsLiked ? (comment.likeCount || 0) + 1 : Math.max((comment.likeCount || 1) - 1, 0),
          }
        }
        return comment
      })

      // Update the post with the new comments
      post.comments = updatedComments

      // Force a re-render
      onComment(post.id, {
        id: "refresh-trigger",
        user: "",
        text: "",
        isRefreshTrigger: true,
      })

      // Then make the API call
      const { data } = await axios.put(`/api/posts/${post.id}/comments/${commentId}/like`)

      if (!data.success) {
        // If the API call fails, revert the optimistic update
        const revertedComments = post.comments.map((comment) => {
          if (comment.id === commentId) {
            const revertIsLiked = !comment.isLiked
            return {
              ...comment,
              isLiked: revertIsLiked,
              likeCount: revertIsLiked ? (comment.likeCount || 0) + 1 : Math.max((comment.likeCount || 1) - 1, 0),
            }
          }
          return comment
        })

        post.comments = revertedComments

        // Force a re-render
        onComment(post.id, {
          id: "refresh-trigger",
          user: "",
          text: "",
          isRefreshTrigger: true,
        })
      }
    } catch (error) {
      console.error("Error liking comment:", error)
    }
  }

  // Calculate font size based on screen size for meme text
  const getMemeTextFontSize = () => {
    if (isMobile) {
      return post.memeTexts && post.memeTexts[0]?.fontSize
        ? Math.max(16, Math.floor(post.memeTexts[0].fontSize * 0.6))
        : 24
    }
    return post.memeTexts && post.memeTexts[0]?.fontSize ? post.memeTexts[0].fontSize : 36
  }

  // Render meme with custom text if available
  const renderMemeContent = () => {
    // If in editing mode, show the edit form instead
    if (isEditing) {
      return (
        <div className="p-4 space-y-4">
          <div className="mb-4">
            <h3 className="text-lg font-medium mb-2">Edit Caption</h3>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Edit your caption..."
              className="w-full resize-none min-h-[100px]"
            />
          </div>

          <div className="border rounded-md overflow-hidden">
            <h4 className="p-2 bg-muted font-medium text-sm">Preview</h4>
            <div className="p-2">
              {post.captionPlacement === "whitespace" ? (
                <div className="relative overflow-hidden rounded-md">
                  <div className="bg-white p-3 text-center border-b">
                    <div
                      className="text-black uppercase tracking-wide"
                      style={{
                        fontFamily: "'Impact', sans-serif",
                        fontWeight: "600",
                        fontSize: isMobile ? "14px" : "18px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {editedText || "YOUR CAPTION HERE"}
                    </div>
                  </div>
                  <img
                    src={post.image || "/placeholder.svg?height=400&width=600"}
                    alt={editedText}
                    className="w-full"
                    loading="lazy"
                  />
                </div>
              ) : !post.memeTexts || post.memeTexts.length === 0 ? (
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 bg-background/90 p-3 text-center font-medium">
                    {editedText || "YOUR CAPTION HERE"}
                  </div>
                  <img
                    src={post.image || "/placeholder.svg?height=400&width=600"}
                    alt={editedText}
                    className="w-full pt-12"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={post.image || "/placeholder.svg?height=400&width=600"}
                    alt={editedText}
                    className="w-full"
                    loading="lazy"
                  />
                  {post.memeTexts.map((text, index) => (
                    <div
                      key={text.id || `meme-text-${index}`}
                      className="meme-text mobile-meme-text"
                      style={{
                        top: text.y + "%",
                        fontFamily: text.fontFamily,
                        fontSize: isMobile
                          ? `${Math.max(16, Math.floor(text.fontSize * 0.6))}px`
                          : `${text.fontSize}px`,
                        color: text.color,
                        backgroundColor: text.backgroundColor !== "transparent" ? text.backgroundColor : "transparent",
                        textAlign: text.textAlign,
                        fontWeight: text.bold ? "bold" : "normal",
                        fontStyle: text.italic ? "italic" : "normal",
                        textDecoration: text.underline ? "underline" : "none",
                        textTransform: text.uppercase ? "uppercase" : "none",
                      }}
                    >
                      {/* Show the edited text in the preview */}
                      {editedText.split("\n").map((line, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <br />}
                          {line || (text.y < 50 ? "TOP TEXT" : "BOTTOM TEXT")}
                        </React.Fragment>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              disabled={isSaving || !editedText.trim() || editedText === post.text}
            >
              {isSaving ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      )
    }

    // Regular rendering logic for non-editing mode
    if (post.captionPlacement === "whitespace") {
      return (
        <div className="relative cursor-pointer overflow-hidden rounded-md" key={`post-${post.id}-whitespace`}>
          <div className="bg-white p-3 text-center border-b">
            <div
              className="text-black uppercase tracking-wide"
              style={{
                fontFamily: "'Impact', sans-serif",
                fontWeight: "600", // Less bold than before
                fontSize: isMobile ? "14px" : "18px", // Smaller on mobile
                letterSpacing: "0.5px", // Better letter spacing
              }}
            >
              {post.text}
            </div>
          </div>
          <img
            src={post.image || "/placeholder.svg?height=400&width=600"}
            alt={post.text}
            className="w-full"
            loading="lazy"
          />
        </div>
      )
    } else if (!post.memeTexts || post.memeTexts.length === 0) {
      return (
        <div className="relative cursor-pointer" key={`post-${post.id}-default-content`}>
          <div className="absolute inset-x-0 top-0 bg-background/90 p-3 text-center font-medium">{post.text}</div>
          <img
            src={post.image || "/placeholder.svg?height=400&width=600"}
            alt={post.text}
            className="w-full pt-12"
            loading="lazy"
          />
        </div>
      )
    }

    return (
      <div className="relative cursor-pointer" key={`post-${post.id}-meme-content`}>
        <img
          src={post.image || "/placeholder.svg?height=400&width=600"}
          alt={post.text}
          className="w-full"
          loading="lazy"
        />
        {post.memeTexts.map((text, index) => (
          <div
            key={text.id || `meme-text-${index}`}
            className={`meme-text mobile-meme-text ${text.y < 50 ? "meme-text-top" : "meme-text-bottom"}`}
            style={{
              fontFamily: text.fontFamily,
              fontSize: `${getMemeTextFontSize()}px`,
              color: text.color,
              backgroundColor: text.backgroundColor !== "transparent" ? text.backgroundColor : "transparent",
              textAlign: text.textAlign,
              fontWeight: text.bold ? "bold" : "normal",
              fontStyle: text.italic ? "italic" : "normal",
              textDecoration: text.underline ? "underline" : "none",
              textTransform: text.uppercase ? "uppercase" : "none",
            }}
          >
            {text.text.split("\n").map((line, i) => (
              <React.Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
    )
  }

  // Function to render comment replies recursively
  const renderCommentReplies = (commentId: string) => {
    const replies = post.comments.filter((comment) => comment.replyTo === commentId)

    if (replies.length === 0) {
      return null
    }

    return (
      <div className="ml-6 space-y-2">
        {replies.map((reply) => (
          <div key={reply.id} className="space-y-2">
            <div className="flex gap-3">
              <Link href={`/profile/${reply.user}`} className="flex-shrink-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={reply.profilePicture || "/placeholder.svg?height=32&width=32"} alt={reply.user} />
                  <AvatarFallback>{reply.user.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="bg-muted rounded-xl px-4 py-2.5 group relative inline-block max-w-full">
                  <Link href={`/profile/${reply.user}`} className="font-medium text-sm hover:underline">
                    {reply.user}
                  </Link>
                  <div className="mt-1">
                    {/* Format text to highlight mentions */}
                    {formatTextWithMentions(reply.text)}
                  </div>

                  {reply.user === user?.username && (
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDeleteComment(reply.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-1.5 ml-1">
                  <button
                    className={`text-xs ${reply.isLiked ? "text-primary font-medium" : "text-muted-foreground"} hover:text-foreground`}
                    onClick={() => handleLikeComment(reply.id)}
                  >
                    {reply.isLiked ? "Liked" : "Like"} {reply.likeCount ? `(${reply.likeCount})` : ""}
                  </button>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => handleReplyToComment(reply.id, reply.user)}
                  >
                    Reply
                  </button>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(reply.timestamp || Date.now()), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Recursively render replies to this reply */}
            {renderCommentReplies(reply.id)}
          </div>
        ))}
      </div>
    )
  }

  // Format text to highlight mentions
  const formatTextWithMentions = (text: string) => {
    if (!text) return null

    const parts = text.split(/(@\w+)/g)
    return parts.map((part, index) => {
      if (part.startsWith("@")) {
        const username = part.substring(1)
        return (
          <Link key={index} href={`/profile/${username}`} className="text-primary hover:underline font-medium">
            {part}
          </Link>
        )
      }
      return part
    })
  }

  // Display tagged users in post
  const renderTaggedUsers = () => {
    if (!post.taggedUsers || post.taggedUsers.length === 0) return null

    return (
      <div className="px-4 py-2 border-t">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Tag className="h-3 w-3" />
          <span>Tagged:</span>
          {post.taggedUsers.map((taggedUser, index) => (
            <React.Fragment key={taggedUser.id}>
              <Link href={`/profile/${taggedUser.username}`} className="text-primary hover:underline">
                @{taggedUser.username}
              </Link>
              {index < post.taggedUsers.length - 1 && ", "}
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="overflow-hidden animate-fade-in hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <Link href={`/profile/${post.user.username}`}>
          <Avatar>
            <AvatarImage src={post.user.profilePicture} alt={post.user.username} />
            <AvatarFallback>{post.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.user.username}`} className="hover:underline">
            <div className="font-semibold">{post.user.username}</div>
          </Link>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>

        {post.category && (
          <Badge variant="outline" className="mr-2 flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {post.category}
          </Badge>
        )}

        {isCurrentUserPost && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      {isEditing ? (
        renderMemeContent()
      ) : (
        <Dialog>
          <DialogTrigger asChild>{renderMemeContent()}</DialogTrigger>
          <DialogContent className="max-w-3xl p-0">{renderMemeContent()}</DialogContent>
        </Dialog>
      )}

      {/* Tagged users section */}
      {renderTaggedUsers()}

      <CardFooter className="flex flex-col p-0">
        {/* Likes and comments count - clean modern design */}
        {(post.likes > 0 || post.comments.length > 0) && (
          <div className="px-6 py-3 border-t">
            <div className="flex items-center gap-6">
              {post.likes > 0 && (
                <div className="text-sm text-muted-foreground">
                  {post.likes} {post.likes === 1 ? "like" : "likes"}
                </div>
              )}
              {post.comments.length > 0 && (
                <button
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => setShowComments(!showComments)}
                >
                  {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action buttons - modern minimal design */}
        <div className="grid grid-cols-3 border-t">
          <Button
            variant="ghost"
            className={cn(
              "flex items-center justify-center gap-2 rounded-none py-3 h-auto",
              post.isLiked ? "text-primary" : "",
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-transform duration-300 hover:scale-110",
                post.isLiked && "fill-current animate-pulse-once",
              )}
            />
            <span className="font-normal">Like</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center justify-center gap-2 rounded-none py-3 h-auto"
            onClick={handleCommentClick}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="font-normal">Comment</span>
          </Button>

          <Button
            variant="ghost"
            className="flex items-center justify-center gap-2 rounded-none py-3 h-auto"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
            <span className="font-normal">Share</span>
          </Button>
        </div>

        {/* Comments section - clean minimal design */}
        {showComments && (
          <div className="border-t px-4 py-6 space-y-6 animate-slide-up w-full">
            {/* Only show top-level comments (not replies) in the main list */}
            {post.comments.filter((comment) => !comment.replyTo).length > 0 && (
              <div className="space-y-4">
                {post.comments
                  .filter((comment) => !comment.replyTo)
                  .map((comment) => (
                    <div key={comment.id} className="space-y-2">
                      <div className="flex gap-3">
                        <Link href={`/profile/${comment.user}`} className="flex-shrink-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={comment.profilePicture || "/placeholder.svg?height=32&width=32"}
                              alt={comment.user}
                            />
                            <AvatarFallback>{comment.user.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="bg-muted rounded-xl px-4 py-2.5 group relative inline-block max-w-full">
                            <Link href={`/profile/${comment.user}`} className="font-medium text-sm hover:underline">
                              {comment.user}
                            </Link>
                            <div className="mt-1">
                              {/* Format text to highlight mentions */}
                              {formatTextWithMentions(comment.text)}
                            </div>

                            {comment.user === user?.username && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteComment(comment.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-4 mt-1.5 ml-1">
                            <button
                              className={`text-xs ${comment.isLiked ? "text-primary font-medium" : "text-muted-foreground"} hover:text-foreground`}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              {comment.isLiked ? "Liked" : "Like"} {comment.likeCount ? `(${comment.likeCount})` : ""}
                            </button>
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() => handleReplyToComment(comment.id, comment.user)}
                            >
                              Reply
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.timestamp || Date.now()), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Render replies to this comment */}
                      {renderCommentReplies(comment.id)}
                    </div>
                  ))}
              </div>
            )}

            {/* comment form */}
            <form onSubmit={handleAddComment} className="space-y-3">
              {replyingTo && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded-md">
                  <span>
                    Replying to <span className="font-medium">@{replyingTo.username}</span>
                  </span>
                  <Button
                    type="button" // Explicitly set type to button to prevent form submission
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-auto"
                    onClick={(e) => {
                      e.preventDefault() // Prevent any form submission
                      setReplyingTo(null)
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user?.profilePicture} alt={user?.username} />
                  <AvatarFallback>{user?.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      ref={commentInputRef}
                      placeholder="Write a comment... Use @ to mention users"
                      value={comment}
                      onChange={handleCommentChange}
                      className="bg-muted border-0 focus-visible:ring-1 w-full pr-10"
                      onKeyDown={(e) => {
                        // Prevent Enter key from triggering the close button
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          if (comment.trim()) {
                            handleAddComment(e)
                          }
                        }
                      }}
                    />
                    {/* Mention popover - improved to ensure it stays visible */}
                    {showMentionPopover && searchUsers.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
                        <div className="p-2 text-xs text-muted-foreground border-b sticky top-0 bg-background">
                          Select a user to mention
                        </div>
                        {searchUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer"
                            onClick={() => handleTagUser({ id: user.id, username: user.username })}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.profilePicture} alt={user.username} />
                              <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">@{user.username}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full"
                      onClick={() => {
                        setShowTagPopover(true)
                        setShowMentionPopover(false)
                      }}
                    >
                      <AtSign className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" variant="ghost" size="sm" disabled={!comment.trim()}>
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Share Dialog */}
        <ShareDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} post={post} className="animate-fade-in" />
      </CardFooter>
    </Card>
  )
}

