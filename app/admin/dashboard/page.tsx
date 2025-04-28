"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart } from "@/components/ui/chart"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { AdminStats, CloudinaryStats } from "@/lib/types"
import {
  Users,
  ImageIcon,
  Flag,
  CloudCog,
  TrendingUp,
  BarChart3,
  RefreshCcw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [cloudinaryStats, setCloudinaryStats] = useState<CloudinaryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  const fetchStats = async () => {
    try {
      setRefreshing(true)
      const { data } = await axios.get("/api/admin/stats")

      // Process the data
      const statsData = data.data || {
        users: {
          total: 0,
          lastWeek: 0,
          growth: 0,
          history: [],
        },
        posts: {
          total: 0,
          lastWeek: 0,
          growth: 0,
          flagged: 0,
          history: [],
        },
        engagement: {
          comments: 0,
          likes: 0,
          shares: 0,
        },
        storage: {
          used: 0,
          limit: 1000,
          percentage: 0,
        },
      }

      setStats(statsData)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    fetchStats()
  }, [])

  // Transform API data for charts
  const getUserChartData = () => {
    if (!stats?.users?.history || stats.users.history.length === 0) {
      // Provide fallback data that's clearly labeled as placeholder
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (6 - i))
        return {
          name: date.toLocaleDateString("en-US", { month: "short" }),
          total: 0,
        }
      })
    }

    // Ensure we're mapping the data correctly
    return stats.users.history.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", { month: "short" }),
      total: typeof item.count === "number" ? item.count : 0,
    }))
  }

  const getPostChartData = () => {
    if (!stats?.posts?.history || stats.posts.history.length === 0) {
      // Provide fallback data that's clearly labeled as placeholder
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (6 - i))
        return {
          name: date.toLocaleDateString("en-US", { month: "short" }),
          total: 0,
        }
      })
    }

    // Ensure we're mapping the data correctly
    return stats.posts.history.map((item) => ({
      name: new Date(item.date).toLocaleDateString("en-US", { month: "short" }),
      total: typeof item.count === "number" ? item.count : 0,
    }))
  }

  const userChartData = getUserChartData()
  const postChartData = getPostChartData()

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform's performance and content.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
        <h2 className="text-lg font-semibold">Error Loading Dashboard</h2>
        <p className="mt-2">{error}</p>
        <Button variant="outline" className="mt-4 bg-white dark:bg-gray-800" onClick={fetchStats}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform's performance and content.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          <span>{refreshing ? "Refreshing..." : "Refresh Data"}</span>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.users?.total.toLocaleString() || 0}</div>
            <div className="flex items-center mt-1">
              {stats?.users?.growth && stats.users.growth > 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stats.users.growth}% growth
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(stats?.users?.growth || 0)}% decline
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">+{stats?.users?.lastWeek || 0} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <ImageIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.posts?.total.toLocaleString() || 0}</div>
            <div className="flex items-center mt-1">
              {stats?.posts?.growth && stats.posts.growth > 0 ? (
                <Badge
                  variant="outline"
                  className="text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  {stats.posts.growth}% growth
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                >
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {Math.abs(stats?.posts?.growth || 0)}% decline
                </Badge>
              )}
              <span className="text-xs text-muted-foreground ml-2">+{stats?.posts?.lastWeek || 0} this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
            <CardTitle className="text-sm font-medium">Flagged Content</CardTitle>
            <Flag className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats?.posts?.flagged || 0}</div>
            <div className="flex items-center mt-1">
              <Badge
                variant={stats?.posts?.flagged > 0 ? "outline" : "secondary"}
                className={
                  stats?.posts?.flagged > 0
                    ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
                    : ""
                }
              >
                {stats?.posts?.flagged > 0 ? "Needs attention" : "All clear"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-gradient-to-r from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20">
            <CardTitle className="text-sm font-medium">Storage Usage</CardTitle>
            <CloudCog className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {stats?.storage?.used ? Math.round(stats.storage.used / 1024 / 1024) : 0} MB
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{stats?.storage?.percentage || 0}% used</span>
                <span>{stats?.storage?.limit ? Math.round(stats.storage.limit / 1024 / 1024) : 0} MB limit</span>
              </div>
              <Progress
                value={stats?.storage?.percentage || 0}
                className="h-2"
                indicatorClassName={
                  (stats?.storage?.percentage || 0) > 80
                    ? "bg-red-500"
                    : (stats?.storage?.percentage || 0) > 60
                      ? "bg-amber-500"
                      : "bg-cyan-500"
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platform Growth</CardTitle>
                <CardDescription>User and content growth over time</CardDescription>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last 7 months
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {isClient && (
              <Tabs defaultValue="line">
                <TabsList className="mb-4">
                  <TabsTrigger value="line" className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Line
                  </TabsTrigger>
                  <TabsTrigger value="bar" className="flex items-center gap-1">
                    <BarChart3 className="h-4 w-4" />
                    Bar
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="line">
                  <LineChart
                    data={[...userChartData, ...postChartData]}
                    categories={["Users", "Posts"]}
                    index="name"
                    colors={["purple", "blue"]}
                    valueFormatter={(value) => `${value}`}
                    className="aspect-[16/9]"
                  />
                </TabsContent>
                <TabsContent value="bar">
                  <BarChart
                    data={[...userChartData, ...postChartData]}
                    categories={["Users", "Posts"]}
                    index="name"
                    colors={["purple", "blue"]}
                    valueFormatter={(value) => `${value}`}
                    className="aspect-[16/9]"
                  />
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Overview</CardTitle>
            <CardDescription>User interaction metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Comments</div>
                <div className="text-sm text-muted-foreground">{stats?.engagement?.comments || 0}</div>
              </div>
              <Progress
                value={
                  stats?.engagement?.comments
                    ? Math.min(100, (stats.engagement.comments / (stats.posts.total || 1)) * 100)
                    : 0
                }
                className="h-2"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Likes</div>
                <div className="text-sm text-muted-foreground">{stats?.engagement?.likes || 0}</div>
              </div>
              <Progress
                value={
                  stats?.engagement?.likes
                    ? Math.min(100, (stats.engagement.likes / (stats.posts.total || 1)) * 100)
                    : 0
                }
                className="h-2"
                indicatorClassName="bg-pink-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Shares</div>
                <div className="text-sm text-muted-foreground">{stats?.engagement?.shares || 0}</div>
              </div>
              <Progress
                value={
                  stats?.engagement?.shares
                    ? Math.min(100, (stats.engagement.shares / (stats.posts.total || 1)) * 100)
                    : 0
                }
                className="h-2"
                indicatorClassName="bg-green-500"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <a href="/admin/posts">View Content Analytics</a>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
