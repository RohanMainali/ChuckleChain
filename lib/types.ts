export interface User {
  id: string;
  username: string;
  profilePicture: string;
  email?: string;
  bio?: string;
}

export interface UserProfile extends User {
  fullName?: string;
  bio?: string;
  website?: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  posts: Post[];
}

export interface MemeText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  bold: boolean;
  italic: boolean;
  underline: boolean;
  uppercase: boolean;
  outline: boolean;
}

export interface Post {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  text: string;
  image: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  comments: {
    id: string;
    user: string;
    profilePicture?: string;
    text: string;
    replyTo?: string;
    timestamp?: string;
    likeCount?: number;
    isLiked?: boolean;
  }[];
  category?: string;
  memeTexts?: MemeText[];
  captionPlacement?: "on-image" | "whitespace";
}

export interface SharedPost {
  id: string;
  text: string;
  image: string;
  user: {
    id: string;
    username: string;
  };
}

export interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  messages: Message[];
  lastMessage: {
    text: string;
    timestamp: string;
  };
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  conversationId?: string;
  read?: boolean;
  sharedPost?: SharedPost;
  image?: string | null;
  replyTo?: string;
}

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow";
  user: {
    id: string;
    username: string;
    profilePicture: string;
  };
  content?: string;
  postId?: string;
  postText?: string;
  read?: boolean;
  timestamp: string;
}
