"use client";

import { useState, useEffect } from "react";
import type { Post as PostType } from "@/lib/types";
import { Post } from "@/components/post";
import axios from "axios";

interface CategoryPageProps {
  category: string;
}

export function CategoryPage({ category }: CategoryPageProps) {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryPosts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/posts/category/${category}`);
        if (data.success) {
          setPosts(data.data || []);
        }
      } catch (error) {
        console.error(`Error fetching ${category} posts:`, error);
        setError(`Failed to load ${category} memes. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPosts();
  }, [category]);

  const handleDeletePost = async (postId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  // Update the handleLikePost function to handle post updates
  const handleLikePost = async (postId: string) => {
    try {
      const { data } = await axios.put(`/api/posts/${postId}/like`);

      if (data.success) {
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                isLiked: data.data.isLiked,
                likes: data.data.isLiked ? post.likes + 1 : post.likes - 1,
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleAddComment = async (
    postId: string,
    comment: {
      id: string;
      user: string;
      text: string;
      isRefreshTrigger?: boolean;
      updatedPost?: PostType; // Add this property
    }
  ) => {
    // If this is just a refresh trigger, don't make an API call
    if (comment.isRefreshTrigger) {
      // If an updated post was provided, use it directly
      if (comment.updatedPost) {
        setPosts((currentPosts) => {
          return currentPosts.map((post) =>
            post.id === postId ? comment.updatedPost! : post
          );
        });
        return;
      }

      // Otherwise, create a new posts array to force a re-render
      setPosts((currentPosts) => {
        // Find the post and create a new reference to trigger re-render
        return currentPosts.map((post) =>
          post.id === postId ? { ...post } : post
        );
      });
      return;
    }

    try {
      const { data } = await axios.post(`/api/posts/${postId}/comments`, {
        text: comment.text,
      });

      if (data.success) {
        setPosts(
          posts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: [...post.comments, data.data],
              };
            }
            return post;
          })
        );
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  // Format category name for display
  const formatCategoryName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive p-12 text-center">
          <h3 className="text-lg font-medium text-destructive">Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        {formatCategoryName(category)} Memes
      </h1>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No memes in this category</h3>
          <p className="text-muted-foreground">
            Be the first to post a {category} meme!
          </p>
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
  );
}
