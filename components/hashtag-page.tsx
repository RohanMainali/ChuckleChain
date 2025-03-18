"use client"

import { useState } from "react"
import { getHashtagPosts } from "@/lib/data"
import type { Post as PostType } from "@/lib/types"
import { Post } from "@/components/post"
import { Hash } from "lucide-react"

interface HashtagPageProps {
  tag: string
}

export function HashtagPage({ tag }: HashtagPageProps) {
  const [posts, setPosts] = useState<PostType[]>(getHashtagPosts(tag))

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId))
  }

  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          }
        }
        return post
      }),
    )
  }

  const handleAddComment = (postId: string, comment: { id: string; user: string; text: string }) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment],
          }
        }
        return post
      }),
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Hash className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{tag}</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No memes with #{tag}</h3>
          <p className="text-muted-foreground">Be the first to post a meme with this hashtag!</p>
        </div>
      ) : (
        <div className="space-y-6 mt-6">
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              onDelete={handleDeletePost}
              onLike={handleLikePost}
              onComment={handleAddComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}

