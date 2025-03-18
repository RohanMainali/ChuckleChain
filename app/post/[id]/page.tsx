"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Post } from "@/components/post"
import { useAuth } from "@/components/auth-provider"
import type { Post as PostType } from "@/lib/types"
import axios from "axios"

export default function PostPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [post, setPost] = useState<PostType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      if (user) {
        try {
          setLoading(true)
          const { data } = await axios.get(`/api/posts/${params.id}`)
          if (data.success) {
            setPost(data.data)
          }
        } catch (error) {
          console.error("Error fetching post:", error)
          setError("Post not found or you don't have permission to view it.")
        } finally {
          setLoading(false)
        }
      }
    }

    if (user) {
      fetchPost()
    }
  }, [params.id, user])

  const handleDeletePost = async (postId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}`)
      router.push("/feed")
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const handleLikePost = async (postId: string) => {
    try {
      const { data } = await axios.put(`/api/posts/${postId}/like`)

      if (data.success) {
        setPost((prevPost) => {
          if (!prevPost) return null
          return {
            ...prevPost,
            isLiked: data.data.isLiked,
            likes: data.data.isLiked ? prevPost.likes + 1 : prevPost.likes - 1,
          }
        })
      }
    } catch (error) {
      console.error("Error liking post:", error)
    }
  }

  const handleAddComment = async (postId: string, comment: { id: string; user: string; text: string }) => {
    try {
      const { data } = await axios.post(`/api/posts/${postId}/comments`, { text: comment.text })

      if (data.success) {
        setPost((prevPost) => {
          if (!prevPost) return null
          return {
            ...prevPost,
            comments: [...prevPost.comments, data.data],
          }
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }

  return (
    <MainLayout>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center justify-center rounded-lg border border-destructive p-12 text-center">
            <h3 className="text-lg font-medium text-destructive">Error</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : post ? (
        <div className="mx-auto max-w-2xl">
          <Post post={post} onDelete={handleDeletePost} onLike={handleLikePost} onComment={handleAddComment} />
        </div>
      ) : null}
    </MainLayout>
  )
}

