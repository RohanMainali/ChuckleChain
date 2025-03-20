"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { ModeToggle } from "@/components/mode-toggle"
import { Flame, Star, Trophy } from "lucide-react"
import axios from "axios"

interface MobileRightSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileRightSidebar({ open, onOpenChange }: MobileRightSidebarProps) {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<"profile" | "achievements">("profile")
  const [userStats, setUserStats] = useState({
    posts: 0,
    followers: 0,
    likes: 0,
    streak: 0,
  })

  useEffect(() => {
    if (open && user) {
      // Fetch user stats when the sidebar opens
      const fetchUserStats = async () => {
        try {
          const { data } = await axios.get("/api/users/me")
          if (data.success) {
            // Calculate total likes across all posts
            const posts = data.data.posts || []
            const totalLikes = posts.reduce((sum, post) => sum + post.likes, 0)

            setUserStats({
              posts: posts.length,
              followers: data.data.user.followers || 0,
              likes: totalLikes,
              streak: data.data.user.currentStreak || 0,
            })

            // Add stats to user object for other components to use
            if (user) {
              user.stats = {
                posts: posts.length,
                followers: data.data.user.followers || 0,
                totalLikes: totalLikes,
                streak: data.data.user.currentStreak || 0,
              }
            }
          }
        } catch (error) {
          console.error("Error fetching user stats:", error)
        }
      }

      fetchUserStats()
    }
  }, [open, user])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />

      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-[85%] max-w-[350px] bg-background border-l shadow-xl animate-slide-right overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Profile</h2>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User profile section */}
        <div className="p-4">
          <div className="flex flex-col items-center text-center mb-6">
            <Avatar className="h-20 w-20 mb-3">
              <AvatarImage src={user?.profilePicture} alt={user?.username} />
              <AvatarFallback>{user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{user?.username}</h3>
            <p className="text-sm text-muted-foreground">{user?.bio || "No bio yet"}</p>

            <div className="flex justify-center gap-8 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold">{userStats.posts}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{userStats.followers}</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">{userStats.likes}</div>
                <div className="text-xs text-muted-foreground">Likes</div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-4">
            <button
              className={`flex-1 py-2 text-center ${activeTab === "profile" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("profile")}
            >
              Profile
            </button>
            <button
              className={`flex-1 py-2 text-center ${activeTab === "achievements" ? "border-b-2 border-primary font-medium" : "text-muted-foreground"}`}
              onClick={() => setActiveTab("achievements")}
            >
              Achievements
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "profile" ? (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <h4 className="font-medium mb-2">{userStats.streak}-day streak!</h4>
                <p className="text-sm">Post today to keep your streak going!</p>
              </div>

              <Link href={`/profile/${user?.username}`} className="block">
                <Button className="w-full">View Full Profile</Button>
              </Link>

              <Button variant="outline" className="w-full" onClick={() => logout()}>
                Logout
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-4 p-4">
                <h2 className="text-lg font-semibold">Badges & Achievements</h2>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-yellow-500/20 p-2 rounded-full">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Meme Lord</h3>
                        <p className="text-xs text-muted-foreground">Received 10,000 likes across all posts</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{ width: `${Math.min(user?.stats?.totalLikes || 0, 10000) / 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span>{user?.stats?.totalLikes || 0} / 10000</span>
                      <span>{Math.floor((user?.stats?.totalLikes || 0) / 100)}%</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-blue-500/20 p-2 rounded-full">
                        <Star className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Rising Star</h3>
                        <p className="text-xs text-muted-foreground">Received 100 likes across all posts</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${Math.min(user?.stats?.totalLikes || 0, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span>{Math.min(user?.stats?.totalLikes || 0, 100)} / 100</span>
                      <span>{Math.min(Math.floor(user?.stats?.totalLikes || 0), 100)}%</span>
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-orange-500/20 p-2 rounded-full">
                        <Flame className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">Daily Grinder</h3>
                        <p className="text-xs text-muted-foreground">Posted memes for 7 consecutive days</p>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${((user?.stats?.streak || 0) * 100) / 7}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs">
                      <span>{user?.stats?.streak || 0} / 7</span>
                      <span>{Math.floor(((user?.stats?.streak || 0) * 100) / 7)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

