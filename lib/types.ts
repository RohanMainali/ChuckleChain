export interface User {
  id: string
  username: string
  profilePicture: string
  email?: string
  bio?: string
  role?: string
  fullName?: string
}

export interface UserProfile {
  id: string
  username: string
  profilePicture: string
  fullName: string
  bio: string
  website: string
  followers: number
  following: number
  isFollowing: boolean
  posts: Post[]
  joinDate?: string
}

export interface Post {
  id: string
  user: {
    id: string
    username: string
    profilePicture: string
  }
  text: string
  image: string
  createdAt: string
  likes: number
  isLiked: boolean
  comments: Comment[]
  category: string
  memeTexts?: MemeText[]
  captionPlacement: string
  taggedUsers?: Array<{ id: string; username: string }>
}

export interface Comment {
  id: string
  user: string
  profilePicture?: string
  text: string
  replyTo?: string
  timestamp?: string
  likeCount?: number
  isLiked?: boolean
}

export interface MemeText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  textAlign: string
  bold: boolean
  italic: boolean
  underline: boolean
  uppercase: boolean
  outline: boolean
}

export interface Conversation {
  id: string
  user: {
    id: string
    username: string
    profilePicture: string
  }
  messages: Message[]
  lastMessage: {
    text: string
    timestamp: string
  }
}

export interface Message {
  id: string
  senderId: string
  text: string
  timestamp: string
  read: boolean
  conversationId: string
  image?: string | null
  replyTo?: string | null
  sharedPost?: SharedPost | null
}

export interface SharedPost {
  id: string
  text: string
  image: string
  user: {
    id: string
    username: string
  }
}

export interface Notification {
  id: string
  type: string
  user: {
    id: string
    username: string
    profilePicture: string
  }
  content: string
  postId?: string
  commentId?: string
  read: boolean
  timestamp: string
  userFollowedBack?: boolean
}

export interface AdminStats {
  users: {
    total: number
    lastWeek: number
  }
  posts: {
    total: number
    lastWeek: number
    flagged: number
  }
}

export interface CloudinaryStats {
  usage: {
    storage: {
      used: number
      limit: number
    }
  }
}

