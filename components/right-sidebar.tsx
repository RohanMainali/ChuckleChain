"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import {
  Award,
  Flame,
  TrendingUp,
  Trophy,
  ChevronRight,
  Calendar,
  MessageSquare,
} from "lucide-react";
import axios from "axios";

// Badge definitions with more detailed descriptions
const badges = [
  {
    id: "meme-lord",
    name: "Meme Lord",
    icon: <Trophy className="h-5 w-5 text-yellow-500" />,
    description: "Received 10,000 likes across all posts",
    longDescription:
      "The ultimate achievement! Become a Meme Lord by collecting 10,000 likes on your posts. Your memes are legendary!",
    requirement: 10000,
    color: "from-yellow-400 to-yellow-600",
    textColor: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  {
    id: "rising-star",
    name: "Rising Star",
    icon: <TrendingUp className="h-5 w-5 text-blue-500" />,
    description: "Received 100 likes across all posts",
    longDescription:
      "You're on your way up! Earn this badge by getting 100 likes on your posts. Keep creating great content!",
    requirement: 100,
    color: "from-blue-400 to-blue-600",
    textColor: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  {
    id: "daily-grinder",
    name: "Daily Grinder",
    icon: <Calendar className="h-5 w-5 text-orange-500" />,
    description: "Posted memes for 7 consecutive days",
    longDescription:
      "Consistency is key! Post memes for 7 days in a row to earn this badge. Show your dedication!",
    requirement: 7,
    color: "from-orange-400 to-orange-600",
    textColor: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
  },
  {
    id: "community-pillar",
    name: "Community Pillar",
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    description: "Received 50 comments across all posts",
    longDescription:
      "Engage the community! Earn this badge when your posts receive a total of 50 comments. Start conversations!",
    requirement: 50,
    color: "from-green-400 to-green-600",
    textColor: "text-green-500",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
  },
  {
    id: "award-winner",
    name: "Award Winner",
    icon: <Award className="h-5 w-5 text-purple-500" />,
    description: "Had a post featured in the top memes of the week",
    longDescription:
      "Quality content gets recognized! Earn this badge when one of your posts makes it to the weekly top memes list.",
    requirement: 1,
    color: "from-purple-400 to-purple-600",
    textColor: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
  },
];

interface TopMeme {
  id: string;
  username: string;
  profilePic: string;
  title: string;
  likes: number;
  image?: string;
}

interface TopUser {
  id: string;
  username: string;
  profilePic: string;
  posts: number;
  likes: number;
}

export function RightSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const [streak, setStreak] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [timeFrame, setTimeFrame] = useState("day");
  const [loading, setLoading] = useState(true);
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalComments, setTotalComments] = useState(0);
  const [lastPostDate, setLastPostDate] = useState<Date | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Initialize with empty arrays
  const [topMemes, setTopMemes] = useState<TopMeme[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  // Add a function to fetch top memes and users
  useEffect(() => {
    const fetchTopContent = async () => {
      if (!user) return;

      try {
        // Fetch top memes
        const memesResponse = await axios.get(
          `/api/posts/trending?timeFrame=${timeFrame}`
        );
        if (memesResponse.data.success) {
          // Transform the data to match the TopMeme interface
          const formattedMemes = memesResponse.data.data.map((post: any) => ({
            id: post.id,
            username: post.user.username,
            profilePic: post.user.profilePicture,
            title: post.text,
            likes: post.likes,
            image: post.image,
          }));
          setTopMemes(formattedMemes);
        }

        // Fetch top users
        try {
          const usersResponse = await axios.get(
            `/api/users/top?timeFrame=${timeFrame}`
          );
          if (usersResponse.data.success) {
            // Transform the data to match the TopUser interface
            const formattedUsers = usersResponse.data.data.map(
              (userData: any) => ({
                id: userData._id,
                username: userData.username,
                profilePic: userData.profilePicture,
                posts: userData.postCount,
                likes: userData.likeCount,
              })
            );
            setTopUsers(formattedUsers);
          }
        } catch (error) {
          console.error("Error fetching top users:", error);
          // If the endpoint doesn't exist yet, use the current user as a fallback
          if (user) {
            setTopUsers([
              {
                id: user.id,
                username: user.username,
                profilePic: user.profilePicture,
                posts: userProfile?.posts?.length || 1,
                likes:
                  userProfile?.posts?.reduce(
                    (sum: number, post: any) => sum + post.likes,
                    0
                  ) || 0,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Error fetching top content:", error);
      }
    };

    if (user && !loading) {
      fetchTopContent();
    }
  }, [user, timeFrame, loading, userProfile]);

  // Fetch user profile data from API
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          setLoading(true);
          const { data } = await axios.get("/api/users/me");
          if (data.success) {
            setUserProfile(data.data);

            // Calculate total likes across all posts
            const posts = data.data.posts || [];
            const totalLikes = posts.reduce(
              (sum: number, post: any) => sum + post.likes,
              0
            );
            setTotalLikes(totalLikes);

            // Calculate total comments
            const totalComments = posts.reduce(
              (sum: number, post: any) => sum + post.comments.length,
              0
            );
            setTotalComments(totalComments);

            // Calculate streak
            calculateStreak(posts);

            // Calculate progress to next badge (Meme Lord)
            const nextBadgeRequirement = 10000;
            const progressValue = Math.min(
              (totalLikes / nextBadgeRequirement) * 100,
              100
            );
            setProgress(progressValue);

            // If we don't have top memes yet, use the user's posts as a fallback
            if (topMemes.length === 0 && posts.length > 0) {
              const formattedMemes = posts.map((post: any) => ({
                id: post.id,
                username: user.username,
                profilePic: user.profilePicture,
                title: post.text,
                likes: post.likes,
                image: post.image,
              }));
              setTopMemes(formattedMemes);
            }

            // If we don't have top users yet, use the current user as a fallback
            if (topUsers.length === 0) {
              setTopUsers([
                {
                  id: user.id,
                  username: user.username,
                  profilePic: user.profilePicture,
                  posts: posts.length,
                  likes: totalLikes,
                },
              ]);
            }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Calculate streak based on post dates
  const calculateStreak = (posts: any[]) => {
    if (!posts || posts.length === 0) {
      setStreak(0);
      return;
    }

    // Sort posts by date (newest first)
    const sortedPosts = [...posts].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Get the most recent post date
    const mostRecentPost = new Date(sortedPosts[0].createdAt);
    setLastPostDate(mostRecentPost);

    // Check if the most recent post is from today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const mostRecentPostDate = new Date(mostRecentPost);
    mostRecentPostDate.setHours(0, 0, 0, 0);

    // If the most recent post is not from today or yesterday, streak is broken
    if (mostRecentPostDate.getTime() < yesterday.getTime()) {
      setStreak(0);
      return;
    }

    // Count consecutive days with posts
    let currentStreak = 1; // Start with 1 for the most recent day
    let currentDate = mostRecentPostDate;

    // Create a map of dates with posts
    const postDates = new Map();
    for (const post of posts) {
      const postDate = new Date(post.createdAt);
      postDate.setHours(0, 0, 0, 0);
      postDates.set(postDate.getTime(), true);
    }

    // Count back from the most recent post date
    while (true) {
      // Move to previous day
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() - 1);

      // Check if there's a post on this day
      if (postDates.has(currentDate.getTime())) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  // Skip rendering if no user or on certain pages
  if (!user || loading) {
    return null;
  }

  // Determine which badges the user has earned
  const earnedBadges = badges.filter((badge) => {
    if (badge.id === "rising-star") {
      return totalLikes >= badge.requirement;
    }
    if (badge.id === "daily-grinder") {
      return streak >= badge.requirement;
    }
    if (badge.id === "community-pillar") {
      return totalComments >= badge.requirement;
    }
    // For Award Winner badge, check if any of the user's posts are in top memes
    if (badge.id === "award-winner" && userProfile?.posts) {
      const userPostIds = userProfile.posts.map((post: any) => post.id);
      const topMemeIds = topMemes.map((meme) => meme.id);
      return userPostIds.some((id) => topMemeIds.includes(id));
    }
    return false;
  });

  // Check if streak is active (posted today)
  const isStreakActive = lastPostDate
    ? new Date(lastPostDate).toDateString() === new Date().toDateString()
    : false;

  // Format time frame for display
  const formatTimeFrame = (timeFrame: string) => {
    switch (timeFrame) {
      case "day":
        return "Today";
      case "week":
        return "This Week";
      case "month":
        return "This Month";
      default:
        return "Today";
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="hidden w-80 flex-col gap-4 lg:flex overflow-y-auto max-h-[calc(100vh-5rem)] pr-2 pb-4 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent"
    >
      {/* User Profile Card */}
      <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 pb-0 flex flex-row items-center gap-3">
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 mb-2 hover:opacity-90 transition-opacity"
          >
            <Avatar className="h-14 w-14 border-2 border-primary/20">
              <AvatarImage src={user.profilePicture} alt={user.username} />
              <AvatarFallback>
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-bold text-lg">{user.username}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                {userProfile?.user?.bio || "No bio yet"}
              </div>
            </div>
          </Link>
        </CardHeader>

        <CardContent className="p-4 pt-3">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/50 p-2">
              <div className="text-sm font-medium">
                {userProfile?.posts?.length || 0}
              </div>
              <div className="text-xs text-muted-foreground">Posts</div>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <div className="text-sm font-medium">
                {userProfile?.user?.followers || 0}
              </div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <div className="text-sm font-medium">{totalLikes}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
            <div
              className={`relative ${isStreakActive ? "animate-pulse" : ""}`}
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {streak}
              </span>
            </div>
            <div className="text-sm">
              <div className="font-bold text-orange-500">
                {streak}-day streak!
              </div>
              <div className="text-xs text-muted-foreground">
                {isStreakActive
                  ? "You've posted today!"
                  : "Post today to keep your streak going!"}
              </div>
            </div>
          </div>

          {/* View Profile Button */}
          <div className="mt-4">
            <Link href={`/profile/${user.username}`} className="w-full">
              <Button variant="outline" className="w-full">
                View Full Profile
              </Button>
            </Link>
          </div>
        </CardContent>

        {/* Badges Section */}
        <div className="px-4 pb-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium">Badges & Achievements</span>
          </div>

          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-2">
                Earned Badges
              </div>
              <div className="flex flex-wrap gap-2">
                <TooltipProvider>
                  {earnedBadges.map((badge) => (
                    <Tooltip key={badge.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${badge.color} transition-transform duration-300 hover:scale-110`}
                        >
                          {badge.icon}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        align="center"
                        className="max-w-[200px] animate-fade-in z-50"
                      >
                        <div className="text-sm font-semibold">
                          {badge.name}
                        </div>
                        <div className="text-xs">{badge.description}</div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Available Badges */}
          <div className="space-y-3">
            <div className="text-xs text-muted-foreground">
              Available Badges
            </div>
            {badges
              .filter(
                (badge) =>
                  !earnedBadges.some((earned) => earned.id === badge.id)
              )
              .map((badge) => {
                // Calculate progress
                let progress = 0;
                let currentValue = 0;

                if (badge.id === "meme-lord") {
                  currentValue = totalLikes;
                  progress = Math.min(
                    (totalLikes / badge.requirement) * 100,
                    100
                  );
                } else if (badge.id === "rising-star") {
                  currentValue = totalLikes;
                  progress = Math.min(
                    (totalLikes / badge.requirement) * 100,
                    100
                  );
                } else if (badge.id === "daily-grinder") {
                  currentValue = streak;
                  progress = Math.min((streak / badge.requirement) * 100, 100);
                } else if (badge.id === "community-pillar") {
                  currentValue = totalComments;
                  progress = Math.min(
                    (totalComments / badge.requirement) * 100,
                    100
                  );
                } else if (badge.id === "award-winner") {
                  currentValue = 0;
                  progress = 0;
                }

                return (
                  <div
                    key={badge.id}
                    className={`p-3 rounded-lg ${badge.bgColor} border ${badge.borderColor}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`h-10 w-10 rounded-full bg-gradient-to-br ${badge.color} flex items-center justify-center opacity-70`}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <div className={`text-sm font-bold ${badge.textColor}`}>
                          {badge.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {badge.description}
                        </div>
                      </div>
                    </div>

                    {badge.id !== "award-winner" && (
                      <div className="mt-1">
                        <div className="flex justify-between text-xs mb-1">
                          <span>
                            {currentValue} / {badge.requirement}
                          </span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full bg-gradient-to-r ${badge.color}`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {badge.id === "award-winner" && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Get featured in top memes of the week
                      </div>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="link" className="p-0 text-xs">
                            Learn More
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="right"
                          align="center"
                          className="max-w-[200px] animate-fade-in z-50"
                        >
                          <div className="text-sm font-semibold">
                            {badge.name}
                          </div>
                          <div className="text-xs">{badge.longDescription}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                );
              })}
          </div>
        </div>
      </Card>

      {/* Achievements Board */}
      <Card className="border shadow-sm bg-card/50 backdrop-blur-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-lg">Trending</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="memes" className="w-full">
            <div className="px-4">
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="memes">Top Memes</TabsTrigger>
                <TabsTrigger value="users">Top Users</TabsTrigger>
              </TabsList>

              <div className="flex items-center justify-end gap-2 mb-2">
                <div className="text-xs text-muted-foreground">Time frame:</div>
                <select
                  className="text-xs bg-transparent border rounded px-2 py-1"
                  value={timeFrame}
                  onChange={(e) => setTimeFrame(e.target.value)}
                >
                  <option value="day">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            <TabsContent value="memes" className="mt-0">
              <div className="px-4 pb-4">
                {topMemes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-muted-foreground">
                      No memes to show yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topMemes.slice(0, 5).map((meme, index) => (
                      <button
                        key={meme.id}
                        className="w-full rounded-lg overflow-hidden border border-muted hover:border-muted-foreground/30 transition-all duration-300 hover:scale-102 animate-fade-in"
                        style={{ animationDelay: `${index * 0.1}s` }}
                        onClick={() => router.push(`/post/${meme.id}`)}
                      >
                        <div className="relative">
                          <img
                            src={
                              meme.image ||
                              "/placeholder.svg?height=100&width=300"
                            }
                            alt={meme.title}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center gap-2">
                            <div
                              className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white",
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                  ? "bg-gray-300 text-gray-800"
                                  : index === 2
                                  ? "bg-amber-700"
                                  : "bg-muted"
                              )}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="text-xs font-medium text-white truncate">
                                {meme.title}
                              </div>
                              <div className="text-[10px] text-white/80">
                                @{meme.username}
                              </div>
                            </div>
                            <div className="text-xs font-medium text-white whitespace-nowrap flex items-center gap-1">
                              {meme.likes} ❤️
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {topMemes.length > 5 && (
                      <Button
                        variant="ghost"
                        className="w-full text-xs text-muted-foreground"
                        onClick={() => router.push("/trending")}
                      >
                        View all trending memes
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <div className="px-4 pb-4">
                {topUsers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <p className="text-muted-foreground">
                      No users to show yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {topUsers.slice(0, 5).map((user, index) => (
                      <button
                        key={user.username}
                        className="flex w-full items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-muted-foreground/20"
                        onClick={() => router.push(`/profile/${user.username}`)}
                      >
                        <div
                          className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                            index === 0
                              ? "bg-yellow-500 text-yellow-950"
                              : index === 1
                              ? "bg-gray-300 text-gray-700"
                              : index === 2
                              ? "bg-amber-700 text-amber-50"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {index + 1}
                        </div>
                        <Avatar className="h-8 w-8 border border-muted">
                          <AvatarImage
                            src={user.profilePic}
                            alt={user.username}
                          />
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="text-sm font-medium truncate">
                            @{user.username}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.posts} posts
                          </div>
                        </div>
                        <div className="text-xs font-medium">
                          {user.likes.toLocaleString()} ❤️
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
