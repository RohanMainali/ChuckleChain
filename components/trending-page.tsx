"use client"

import { useState, useEffect } from "react"
import type { Post as PostType } from "@/lib/types"
import { Post } from "@/components/post"
import axios from "axios"

export function TrendingPage() {
  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrendingPosts = async () => {
      try {
        setLoading(true)
        const { data } = await axios.get("/api/posts/trending")
        if (data.success) {
          setPosts(data.data || [])
        }
      } catch (error) {
        console.error("Error fetching trending posts:", error)
        setError("Failed to load trending posts. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchTrendingPosts()
  }, [])

  const handleDeletePost = async (postId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}`)
      setPosts(posts.filter((post) => post.id !== postId))
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const { data } = await axios.put(`/api/posts/${postId}/like`)

      if (data.success) {
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: data.data.isLiked,
                likes: data.data.isLiked ? post.likes + 1 : post.likes - 1,
              }
            }
            return post
          }),
        )
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleAddComment = async (postId: string, comment: { id: string; user: string; text: string }) => {
    try {
      const { data } = await axios.post(`/api/posts/${postId}/comments`, { text: comment.text })

      if (data.success) {
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, data.data],
              }
            }
            return post
          }),
        )
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive p-12 text-center">
          <h3 className="text-lg font-medium text-destructive">Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold mb-6">Trending Memes</h1>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No trending memes</h3>
          <p className="text-muted-foreground">Check back later for trending content.</p>
        </div>
      ) : (
        <div className="space-y-6">
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

