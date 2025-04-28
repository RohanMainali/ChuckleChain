"use client";

import { useState } from "react";
import { getHashtagPosts } from "@/lib/data";
import type { Post as PostType } from "@/lib/types";
import { Post } from "@/components/post";
import { Hash } from "lucide-react";

interface HashtagPageProps {
  tag: string;
}

export function HashtagPage({ tag }: HashtagPageProps) {
  const [posts, setPosts] = useState<PostType[]>(getHashtagPosts(tag));

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
  };

  // Update the handleLikePost function to handle post updates
  const handleLikePost = (postId: string) => {
    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      })
    );
  };

  // Update the handleAddComment function to handle the updatedPost property
  const handleAddComment = (
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

    setPosts(
      posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            comments: [...post.comments, comment],
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Hash className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">{tag}</h1>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-medium">No memes with #{tag}</h3>
          <p className="text-muted-foreground">
            Be the first to post a meme with this hashtag!
          </p>
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
  );
}
