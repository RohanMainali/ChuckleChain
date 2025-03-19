"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Edit,
  Grid3X3,
  MessageSquare,
  Settings,
  Heart,
  MessageCircle,
  Bug,
} from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Post } from "@/components/post";
import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import type { UserProfile, Post as PostType } from "@/lib/types";
import axios from "axios";
import { toast } from "@/hooks/use-toast";

interface ProfileProps {
  profile: UserProfile;
  username: string;
}

interface FollowUser {
  id: string;
  username: string;
  profilePicture: string;
  isFollowing?: boolean;
}

export function Profile({ profile: initialProfile, username }: ProfileProps) {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(
    initialProfile?.isFollowing || false
  );
  const [followerCount, setFollowerCount] = useState(
    initialProfile?.followers || 0
  );
  const [followingCount, setFollowingCount] = useState(
    initialProfile?.following || 0
  );
  const [posts, setPosts] = useState<PostType[]>(initialProfile?.posts || []);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentProfile, setCurrentProfile] =
    useState<UserProfile>(initialProfile);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Followers/Following dialog state
  const [followDialogOpen, setFollowDialogOpen] = useState(false);
  const [followDialogType, setFollowDialogType] = useState<
    "followers" | "following"
  >("followers");
  const [followUsers, setFollowUsers] = useState<FollowUser[]>([]);
  const [loadingFollowUsers, setLoadingFollowUsers] = useState(false);

  const isCurrentUser = user?.username === username;

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const endpoint = isCurrentUser
          ? "/api/users/me"
          : `/api/users/${username}`;
        const { data } = await axios.get(endpoint);

        if (data.success) {
          setCurrentProfile(data.data.user);
          setPosts(data.data.posts);
          setIsFollowing(data.data.user.isFollowing);
          setFollowerCount(data.data.user.followers);
          setFollowingCount(data.data.user.following);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, username, isCurrentUser]);

  // Update profile when user changes (for username updates from settings)
  useEffect(() => {
    if (isCurrentUser && user) {
      setCurrentProfile((prev) => ({
        ...prev,
        username: user.username,
        profilePicture: user.profilePicture,
      }));
    }
  }, [user, isCurrentUser]);

  const handleFollow = async () => {
    try {
      const { data } = await axios.put(`/api/users/${username}/follow`);

      if (data.success) {
        setIsFollowing(data.data.isFollowing);
        setFollowerCount((prev) =>
          data.data.isFollowing ? prev + 1 : prev - 1
        );

        // Show toast notification
        if (data.data.isFollowing) {
          toast({
            title: "Success",
            description: `You are now following ${username}`,
          });
        } else {
          toast({
            title: "Success",
            description: `You have unfollowed ${username}`,
          });
        }

        // Refresh the profile to ensure counts are accurate
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast({
        title: "Error",
        description: "Failed to follow/unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await axios.delete(`/api/posts/${postId}`);
      setPosts(posts.filter((post) => post.id !== postId));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

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
    }
  ) => {
    // If this is just a refresh trigger, don't make an API call
    if (comment.isRefreshTrigger) {
      // Create a new posts array to force a re-render
      setPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? { ...post } : post))
      );
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

  const handleProfileUpdate = async (updatedProfile: Partial<UserProfile>) => {
    try {
      const { data } = await axios.put("/api/users/me", updatedProfile);

      if (data.success) {
        // Update the profile
        setCurrentProfile((prev) => ({
          ...prev,
          ...updatedProfile,
        }));

        // If this is the current user, also update the auth context
        if (isCurrentUser && user) {
          updateUser({
            ...user,
            username: updatedProfile.username || user.username,
            profilePicture:
              updatedProfile.profilePicture || user.profilePicture,
            bio: updatedProfile.bio || user.bio,
          });
        }
      }

      setIsEditProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleMessageUser = () => {
    // Create or get conversation with this user
    if (currentProfile.id) {
      axios
        .get(`/api/messages/conversations/${currentProfile.id}`)
        .then(({ data }) => {
          if (data.success) {
            // Navigate to messages page
            router.push("/messages");
          }
        })
        .catch((error) => {
          console.error("Error creating conversation:", error);
        });
    }
  };

  const openFollowDialog = async (type: "followers" | "following") => {
    setFollowDialogType(type);
    setFollowDialogOpen(true);
    setLoadingFollowUsers(true);

    try {
      const { data } = await axios.get(`/api/users/${username}/${type}`);
      if (data.success) {
        setFollowUsers(data.data || []);
      } else {
        toast({
          title: "Error",
          description: `Failed to load ${type}. Please try again.`,
          variant: "destructive",
        });
        setFollowUsers([]);
      }
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setFollowUsers([]); // Initialize with empty array to avoid undefined issues
      toast({
        title: "Error",
        description: `Failed to load ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoadingFollowUsers(false);
    }
  };

  const handleFollowFromDialog = async (userId: string) => {
    try {
      const userToFollow = followUsers.find((u) => u.id === userId);
      if (!userToFollow) return;

      const { data } = await axios.put(
        `/api/users/${userToFollow.username}/follow`
      );

      if (data.success) {
        // Update the follow status in the list
        setFollowUsers(
          followUsers.map((u) =>
            u.id === userId ? { ...u, isFollowing: data.data.isFollowing } : u
          )
        );

        // Show toast notification
        if (data.data.isFollowing) {
          toast({
            title: "Success",
            description: `You are now following ${userToFollow.username}`,
          });
        } else {
          toast({
            title: "Success",
            description: `You have unfollowed ${userToFollow.username}`,
          });
        }

        // Refresh the profile data after following/unfollowing
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      toast({
        title: "Error",
        description: "Failed to follow/unfollow user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Debug function to help diagnose relationship issues
  const handleDebugRelationships = async () => {
    try {
      const { data } = await axios.get("/api/users/debug-relationships");
      console.log("Debug relationships:", data);
      toast({
        title: "Debug Info",
        description: `Check console for relationship data`,
      });
    } catch (error) {
      console.error("Error debugging relationships:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="animate-fade-in">
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <Avatar className="h-24 w-24 md:h-32 md:w-32">
              <AvatarImage
                src={currentProfile.profilePicture}
                alt={currentProfile.username}
              />
              <AvatarFallback className="text-2xl">
                {currentProfile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex flex-1 flex-col items-center text-center md:items-start md:text-left">
              <div className="flex flex-wrap items-center gap-4">
                <h1 className="text-2xl font-bold">
                  {currentProfile.username}
                </h1>

                {isCurrentUser ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditProfileOpen(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleDebugRelationships}
                      title="Debug Relationships"
                    >
                      <Bug className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      onClick={handleFollow}
                      className="transition-all duration-300 hover:scale-105"
                    >
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    <Button variant="outline" onClick={handleMessageUser}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Message
                    </Button>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-6">
                <button
                  className="text-center hover:opacity-80"
                  onClick={() => openFollowDialog("followers")}
                >
                  <div className="font-bold">{followerCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </button>
                <button
                  className="text-center hover:opacity-80"
                  onClick={() => openFollowDialog("following")}
                >
                  <div className="font-bold">{followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </button>
                <div className="text-center">
                  <div className="font-bold">{posts.length}</div>
                  <div className="text-sm text-muted-foreground">Posts</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="font-bold">{currentProfile.fullName}</div>
                <p className="mt-1 max-w-md">{currentProfile.bio}</p>
                {currentProfile.website && (
                  <a
                    href={currentProfile.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-primary hover:underline"
                  >
                    {currentProfile.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="posts">
        <div className="flex justify-between items-center">
          <TabsList className="grid w-full max-w-[200px] grid-cols-1">
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Grid3X3 className="h-4 w-4" />
              Posts
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-list"
              >
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>

        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
              <h3 className="text-lg font-medium">No posts yet</h3>
              <p className="text-muted-foreground">
                {isCurrentUser
                  ? "Create your first meme to get started."
                  : `${currentProfile.username} hasn't posted any memes yet.`}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {posts.map((post, index) => (
                <div
                  key={post.id}
                  className="relative group overflow-hidden rounded-md border animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <Link href={`/post/${post.id}`}>
                    <div className="aspect-square overflow-hidden">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.text}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white flex gap-4">
                        <div className="flex items-center gap-1">
                          <Heart className="h-5 w-5 fill-white" />
                          <span>{post.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5" />
                          <span>{post.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
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
        </TabsContent>
      </Tabs>

      <EditProfileDialog
        profile={currentProfile}
        open={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        onUpdate={handleProfileUpdate}
      />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />

      {/* Followers/Following Dialog */}
      <Dialog open={followDialogOpen} onOpenChange={setFollowDialogOpen}>
        <DialogContent className="sm:max-w-[425px] animate-slide-up">
          <DialogHeader>
            <DialogTitle>
              {followDialogType === "followers" ? "Followers" : "Following"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] pr-4">
            {loadingFollowUsers ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
              </div>
            ) : followUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {followDialogType === "followers"
                  ? `${currentProfile.username} doesn't have any followers yet`
                  : `${currentProfile.username} isn't following anyone yet`}
              </div>
            ) : (
              <div className="space-y-4">
                {followUsers.map((followUser) => (
                  <div
                    key={followUser.id}
                    className="flex items-center justify-between"
                  >
                    <Link
                      href={`/profile/${followUser.username}`}
                      className="flex items-center gap-3 hover:opacity-80"
                      onClick={() => setFollowDialogOpen(false)}
                    >
                      <Avatar>
                        <AvatarImage
                          src={followUser.profilePicture}
                          alt={followUser.username}
                        />
                        <AvatarFallback>
                          {followUser.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{followUser.username}</div>
                    </Link>

                    {followUser.id !== user?.id && (
                      <Button
                        variant={followUser.isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollowFromDialog(followUser.id)}
                      >
                        {followUser.isFollowing ? "Following" : "Follow"}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
