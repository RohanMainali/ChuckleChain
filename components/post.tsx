"use client";

import React from "react";

import { useState, useRef, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  MoreHorizontal,
  Share2,
  Trash2,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import type { Post as PostType } from "@/lib/types";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShareDialog } from "@/components/share-dialog";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

// Add this at the beginning of the file, after the imports
// Declare the global window type to include our comment ID mapping
declare global {
  interface Window {
    _commentIdMap?: Record<string, string>;
    _pendingDeletions?: Array<{
      postId: string;
      tempCommentId: string;
      text: string;
    }>;
  }
}

interface PostProps {
  post: PostType;
  onDelete: (postId: string) => void;
  onLike: (postId: string) => void;
  onComment: (
    postId: string,
    comment: {
      id: string;
      user: string;
      profilePicture?: string;
      text: string;
      replyTo?: string;
      isRefreshTrigger?: boolean;
    }
  ) => void;
}

export function Post({ post, onDelete, onLike, onComment }: PostProps) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [replyingTo, setReplyingTo] = useState<{
    id: string;
    username: string;
  } | null>(null);

  const isCurrentUserPost = post.user.id === user?.id;

  const handleLike = () => {
    onLike(post.id);
  };

  const handleDelete = () => {
    onDelete(post.id);
  };

  const handleCommentClick = () => {
    setShowComments(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  // Update the handleAddComment function to better track real IDs
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      if (replyingTo) {
        // Create an optimistic reply to update the UI immediately
        const tempId = `temp-${Date.now()}`;
        const optimisticReply = {
          id: tempId,
          user: user?.username || "",
          profilePicture: user?.profilePicture,
          text: comment,
          replyTo: replyingTo.id,
          timestamp: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
        };

        // Add the optimistic reply to the post's comments
        const updatedComments = [...post.comments, optimisticReply];
        post.comments = updatedComments;

        // Force a re-render
        onComment(post.id, {
          ...optimisticReply,
          isRefreshTrigger: true,
        });

        try {
          // Make the API call
          const endpoint = `/api/posts/${post.id}/comments/${replyingTo.id}/reply`;
          console.log(
            "Sending reply to endpoint:",
            endpoint,
            "with text:",
            comment
          );

          const { data } = await axios.post(endpoint, {
            text: comment,
          });

          if (data.success) {
            console.log("Reply added successfully:", data);

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
            };

            // Store a mapping from temp ID to real ID for future reference
            window._commentIdMap = window._commentIdMap || {};
            window._commentIdMap[tempId] = data.data.id;

            // Update the post's comments array by replacing the optimistic reply
            post.comments = post.comments.map((c) =>
              c.id === tempId ? realReply : c
            );

            // Force another re-render with the real data
            onComment(post.id, {
              ...realReply,
              isRefreshTrigger: true,
            });
          }
        } catch (error) {
          console.error("Error details:", error.response?.data || error);

          // Even if there's an error, we'll keep the optimistic update
          // This way the user still sees their reply
          toast({
            title: "Warning",
            description:
              "Your reply was saved but there was an error. You may need to refresh to see all replies.",
            variant: "destructive",
          });
        }
      } else {
        // Regular comment with optimistic update
        const tempId = `temp-${Date.now()}`;
        const optimisticComment = {
          id: tempId,
          user: user?.username || "",
          profilePicture: user?.profilePicture,
          text: comment,
          timestamp: new Date().toISOString(),
          likeCount: 0,
          isLiked: false,
        };

        // Add the optimistic comment
        post.comments.push(optimisticComment);

        // Force a re-render
        onComment(post.id, {
          ...optimisticComment,
          isRefreshTrigger: true,
        });

        try {
          // Make the API call
          const { data } = await axios.post(`/api/posts/${post.id}/comments`, {
            text: comment,
          });

          if (data.success) {
            // Store a mapping from temp ID to real ID for future reference
            window._commentIdMap = window._commentIdMap || {};
            window._commentIdMap[tempId] = data.data.id;

            // Replace the optimistic comment with the real one
            post.comments = post.comments.map((c) =>
              c.id === tempId ? data.data : c
            );

            // Force another re-render
            onComment(post.id, {
              ...data.data,
              isRefreshTrigger: true,
            });
          }
        } catch (error) {
          console.error("Error adding comment:", error);
          toast({
            title: "Warning",
            description:
              "Your comment was saved but there was an error. You may need to refresh to see all comments.",
            variant: "destructive",
          });
        }
      }

      // Reset form regardless of success or failure
      setComment("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error in comment handling:", error);
      toast({
        title: "Error",
        description: "There was a problem with your comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Update the handleDeleteComment function to handle immediate deletions better
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Check if this is a temporary ID (from optimistic updates)
      if (commentId.startsWith("temp-")) {
        // Check if we have a mapping to a real ID
        const realId = window._commentIdMap?.[commentId];

        if (realId) {
          // Use the real ID instead
          commentId = realId;
          console.log(
            `Using mapped real ID ${realId} for temp ID ${commentId}`
          );
        } else {
          // If we can't find a real ID yet, just remove it from the UI
          // and mark it for deletion when it becomes available
          const updatedComments = post.comments.filter(
            (comment) => comment.id !== commentId
          );

          // Update the post's comments array
          post.comments = updatedComments;

          // Force a re-render
          onComment(post.id, {
            id: "refresh-trigger",
            user: "",
            text: "",
            isRefreshTrigger: true,
          });

          // Store this temp ID to be deleted when it gets a real ID
          window._pendingDeletions = window._pendingDeletions || [];
          window._pendingDeletions.push({
            postId: post.id,
            tempCommentId: commentId,
            text: post.comments.find((c) => c.id === commentId)?.text || "",
          });

          toast({
            title: "Comment removed",
            description:
              "Your comment will be permanently deleted when processing completes",
          });

          return;
        }
      }

      // Add a small delay to ensure the comment is fully saved
      await new Promise((resolve) => setTimeout(resolve, 300));

      // IMPORTANT: Create a deep copy of the comments array to ensure React detects the change
      const updatedComments = [...post.comments].filter(
        (comment) => comment.id !== commentId && comment.replyTo !== commentId
      );

      // Update the local comments array immediately with the new array
      post.comments = updatedComments;

      // Force a re-render with the updated comments
      onComment(post.id, {
        id: "refresh-trigger",
        user: "",
        text: "",
        isRefreshTrigger: true,
      });

      console.log(`Deleting comment with ID: ${commentId}`);
      const { data } = await axios.delete(
        `/api/posts/${post.id}/comments/${commentId}`
      );

      if (data.success) {
        toast({
          title: "Success",
          description: "Comment deleted successfully",
        });

        // Force another re-render to ensure UI is updated
        setTimeout(() => {
          onComment(post.id, {
            id: "refresh-trigger-after-delete",
            user: "",
            text: "",
            isRefreshTrigger: true,
          });
        }, 100);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);

      // Check if it's a 404 error
      if (error.response && error.response.status === 404) {
        // The comment might not be fully saved yet, so we'll retry after a delay
        toast({
          title: "Processing",
          description: "Comment is still being processed. Retrying deletion...",
        });

        // Wait a bit longer and retry
        setTimeout(() => {
          handleDeleteComment(commentId);
        }, 1000);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete comment. Please try again.",
          variant: "destructive",
        });

        // Fetch fresh comments to restore correct state
        try {
          const { data } = await axios.get(`/api/posts/${post.id}`);
          if (data.success) {
            const freshPost = data.data;
            post.comments = freshPost.comments;
            onComment(post.id, {
              id: "refresh-trigger",
              user: "",
              text: "",
              isRefreshTrigger: true,
            });
          }
        } catch (refreshError) {
          console.error("Error refreshing comments:", refreshError);
        }
      }
    }
  };

  // Add this function to process any pending deletions
  const processPendingDeletions = () => {
    if (!window._pendingDeletions || window._pendingDeletions.length === 0)
      return;

    // Process each pending deletion
    const pendingDeletions = [...window._pendingDeletions];
    window._pendingDeletions = [];

    pendingDeletions.forEach(async (pending) => {
      if (pending.postId !== post.id) return;

      // Find if we now have a real ID for this comment
      const matchingComment = post.comments.find(
        (c) => c.text === pending.text && !c.id.startsWith("temp-")
      );

      if (matchingComment) {
        console.log(
          `Found real comment ID ${matchingComment.id} for pending deletion`
        );
        try {
          await axios.delete(
            `/api/posts/${post.id}/comments/${matchingComment.id}`
          );

          // Remove from UI
          const updatedComments = post.comments.filter(
            (comment) =>
              comment.id !== matchingComment.id &&
              comment.replyTo !== matchingComment.id
          );

          post.comments = updatedComments;

          // Force a re-render
          onComment(post.id, {
            id: "refresh-trigger",
            user: "",
            text: "",
            isRefreshTrigger: true,
          });
        } catch (error) {
          console.error("Error processing pending deletion:", error);
        }
      } else {
        // Put it back in the queue if we still can't find it
        window._pendingDeletions.push(pending);
      }
    });
  };

  // Add this effect to check for pending deletions whenever comments change
  useEffect(() => {
    processPendingDeletions();
  }, [post.comments]);

  // Update the handleReplyToComment function to ensure it works correctly
  const handleReplyToComment = (commentId: string, username: string) => {
    setReplyingTo({ id: commentId, username });
    setShowComments(true);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  // Fix the like comment functionality to update UI immediately
  const handleLikeComment = async (commentId: string) => {
    try {
      // Optimistically update UI first
      const updatedComments = post.comments.map((comment) => {
        if (comment.id === commentId) {
          const newIsLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: newIsLiked,
            likeCount: newIsLiked
              ? (comment.likeCount || 0) + 1
              : Math.max((comment.likeCount || 1) - 1, 0),
          };
        }
        return comment;
      });

      // Update the post with the new comments
      post.comments = updatedComments;

      // Force a re-render
      onComment(post.id, {
        id: "refresh-trigger",
        user: "",
        text: "",
        isRefreshTrigger: true,
      });

      // Then make the API call
      const { data } = await axios.put(
        `/api/posts/${post.id}/comments/${commentId}/like`
      );

      if (!data.success) {
        // If the API call fails, revert the optimistic update
        const revertedComments = post.comments.map((comment) => {
          if (comment.id === commentId) {
            const revertIsLiked = !comment.isLiked;
            return {
              ...comment,
              isLiked: revertIsLiked,
              likeCount: revertIsLiked
                ? (comment.likeCount || 0) + 1
                : Math.max((comment.likeCount || 1) - 1, 0),
            };
          }
          return comment;
        });

        post.comments = revertedComments;

        // Force a re-render
        onComment(post.id, {
          id: "refresh-trigger",
          user: "",
          text: "",
          isRefreshTrigger: true,
        });
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  // Render meme with custom text if available
  const renderMemeContent = () => {
    if (post.captionPlacement === "whitespace") {
      return (
        <div
          className="relative cursor-pointer overflow-hidden rounded-md"
          key={`post-${post.id}-whitespace`}
        >
          <div className="bg-white p-3 text-center border-b">
            <div
              className="text-black uppercase tracking-wide"
              style={{
                fontFamily: "'Impact', sans-serif",
                fontWeight: "600", // Less bold than before
                fontSize: "18px", // Controlled font size
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
          />
        </div>
      );
    } else if (!post.memeTexts || post.memeTexts.length === 0) {
      return (
        <div
          className="relative cursor-pointer"
          key={`post-${post.id}-default-content`}
        >
          <div className="absolute inset-x-0 top-0 bg-background/90 p-3 text-center font-medium">
            {post.text}
          </div>
          <img
            src={post.image || "/placeholder.svg?height=400&width=600"}
            alt={post.text}
            className="w-full pt-12"
          />
        </div>
      );
    }

    return (
      <div
        className="relative cursor-pointer"
        key={`post-${post.id}-meme-content`}
      >
        <img
          src={post.image || "/placeholder.svg?height=400&width=600"}
          alt={post.text}
          className="w-full"
        />
        {post.memeTexts.map((text) => (
          <div
            key={text.text}
            className="absolute left-1/2 transform -translate-x-1/2 text-center select-none px-2 py-1"
            style={{
              top: text.y + "%",
              fontFamily: text.fontFamily,
              fontSize: `${text.fontSize}px`,
              lineHeight: "1.2", // Added line height for better readability
              color: text.color,
              backgroundColor:
                text.backgroundColor !== "transparent"
                  ? text.backgroundColor
                  : "transparent",
              textAlign: text.textAlign,
              fontWeight: text.bold ? "bold" : "normal",
              fontStyle: text.italic ? "italic" : "normal",
              textDecoration: text.underline ? "underline" : "none",
              textTransform: text.uppercase ? "uppercase" : "none",
              textShadow: text.outline
                ? "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000"
                : "none", // Stronger shadow
              width: "90%", // Wider text area
              wordWrap: "break-word",
              transform: "translate(-50%, -50%)",
              whiteSpace: "pre-line", // This preserves line breaks
              position: "absolute", // Ensure absolute positioning
              zIndex: 10, // Make sure text is above the image
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
    );
  };

  // Function to render comment replies
  const renderCommentReplies = (commentId: string) => {
    const replies = post.comments.filter(
      (comment) => comment.replyTo === commentId
    );

    if (replies.length === 0) return null;

    return (
      <div className="ml-8 mt-2 space-y-3">
        {replies.map((reply) => (
          <div key={reply.id} className="flex gap-3">
            <Link href={`/profile/${reply.user}`} className="flex-shrink-0">
              <Avatar className="h-6 w-6">
                <AvatarImage
                  src={
                    reply.profilePicture ||
                    "/placeholder.svg?height=32&width=32"
                  }
                  alt={reply.user}
                />
                <AvatarFallback>
                  {reply.user.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="bg-muted/50 rounded-xl px-3 py-2 inline-block max-w-full group relative">
                <Link
                  href={`/profile/${reply.user}`}
                  className="font-medium text-xs hover:underline"
                >
                  {reply.user}
                </Link>
                <div className="mt-1 text-sm">{reply.text}</div>

                {reply.user === user?.username && (
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-full"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(reply.id)}
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
              <div className="flex gap-4 mt-1 ml-1">
                <button
                  className={`text-xs ${
                    reply.isLiked
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  } hover:text-foreground`}
                  onClick={() => handleLikeComment(reply.id)}
                >
                  {reply.isLiked ? "Liked" : "Like"}{" "}
                  {reply.likeCount ? `(${reply.likeCount})` : ""}
                </button>
                <button
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => handleReplyToComment(reply.id, reply.user)}
                >
                  Reply
                </button>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(
                    new Date(reply.timestamp || Date.now()),
                    { addSuffix: true }
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden animate-fade-in hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0 p-4">
        <Link href={`/profile/${post.user.username}`}>
          <Avatar>
            <AvatarImage
              src={post.user.profilePicture}
              alt={post.user.username}
            />
            <AvatarFallback>
              {post.user.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link
            href={`/profile/${post.user.username}`}
            className="hover:underline"
          >
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
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <Dialog>
        <DialogTrigger asChild>{renderMemeContent()}</DialogTrigger>
        <DialogContent className="max-w-3xl p-0">
          {renderMemeContent()}
        </DialogContent>
      </Dialog>

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
                  {post.comments.length}{" "}
                  {post.comments.length === 1 ? "comment" : "comments"}
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
              post.isLiked ? "text-primary" : ""
            )}
            onClick={handleLike}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-transform duration-300 hover:scale-110",
                post.isLiked && "fill-current animate-pulse-once"
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
                        <Link
                          href={`/profile/${comment.user}`}
                          className="flex-shrink-0"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src={
                                comment.profilePicture ||
                                "/placeholder.svg?height=32&width=32"
                              }
                              alt={comment.user}
                            />
                            <AvatarFallback>
                              {comment.user.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </Link>
                        <div className="flex-1">
                          <div className="bg-muted rounded-xl px-4 py-2.5 group relative inline-block max-w-full">
                            <Link
                              href={`/profile/${comment.user}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {comment.user}
                            </Link>
                            <div className="mt-1">{comment.text}</div>

                            {comment.user === user?.username && (
                              <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 rounded-full"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDeleteComment(comment.id)
                                      }
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
                              className={`text-xs ${
                                comment.isLiked
                                  ? "text-primary font-medium"
                                  : "text-muted-foreground"
                              } hover:text-foreground`}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              {comment.isLiked ? "Liked" : "Like"}{" "}
                              {comment.likeCount
                                ? `(${comment.likeCount})`
                                : ""}
                            </button>
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                handleReplyToComment(comment.id, comment.user)
                              }
                            >
                              Reply
                            </button>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(comment.timestamp || Date.now()),
                                { addSuffix: true }
                              )}
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
                    Replying to{" "}
                    <span className="font-medium">@{replyingTo.username}</span>
                  </span>
                  <Button
                    type="button" // Explicitly set type to button to prevent form submission
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-auto"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent any form submission
                      setReplyingTo(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={user?.profilePicture}
                    alt={user?.username}
                  />
                  <AvatarFallback>
                    {user?.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      ref={commentInputRef}
                      placeholder="Write a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="bg-muted border-0 focus-visible:ring-1 w-full"
                      onKeyDown={(e) => {
                        // Prevent Enter key from triggering the close button
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          if (comment.trim()) {
                            handleAddComment(e);
                          }
                        }
                      }}
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    disabled={!comment.trim()}
                  >
                    Post
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Share Dialog */}
        <ShareDialog
          open={shareDialogOpen}
          onOpenChange={setShareDialogOpen}
          post={post}
          className="animate-fade-in"
        />
      </CardFooter>
    </Card>
  );
}
