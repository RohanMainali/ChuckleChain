import type { User, UserProfile, Post, Conversation, Notification } from "./types"

// Replace the mock data with empty arrays and minimal data

// Replace the users array with just the current user
const currentUser: User = {
  id: "user1",
  username: "user",
  profilePicture: "/placeholder.svg?height=150&width=150",
}

// Replace the users array
const users = [currentUser]

// Replace the posts array with an empty array
const posts: Post[] = []

// Replace the userProfiles with just the current user
const userProfiles: Record<string, UserProfile> = {
  user: {
    ...currentUser,
    fullName: "",
    bio: "",
    website: "",
    followers: 0,
    following: 0,
    isFollowing: false,
    posts: [],
  },
}

// Replace the conversations with an empty array
const conversations: Conversation[] = []

// Replace the notifications with an empty array
const notifications: Notification[] = []

// Data access functions
export function getCurrentUser(): User {
  return currentUser
}

export function getUserProfile(username: string): UserProfile {
  return userProfiles[username] || userProfiles.user
}

export function getPosts(): Post[] {
  return [...posts]
}

export function getConversations(): Conversation[] {
  return [...conversations]
}

export function getNotifications(): Notification[] {
  return [...notifications]
}

// Add new functions to support the additional pages

// Update the data access functions to return empty arrays
export function getTrendingPosts(): Post[] {
  return []
}

export function getFreshPosts(): Post[] {
  return []
}

// Get posts by category
export function getCategoryPosts(category: string): Post[] {
  return []
}

// Get posts by hashtag
export function getHashtagPosts(tag: string): Post[] {
  return []
}

