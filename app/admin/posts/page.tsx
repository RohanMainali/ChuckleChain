"use client"

import { useState, useEffect, useMemo } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  MoreHorizontal,
  Flag,
  Eye,
  Trash2,
  ImageOff,
  RefreshCcw,
  SortAsc,
  SortDesc,
  ThumbsUp,
  MessageSquare,
  Filter,
  Download,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { BarChart, LineChart } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"

interface AdminPost {
  id: string
  text: string
  image: string
  user: {
    id: string
    username: string
    profilePicture: string
  }
  createdAt: string
  likes: number
  comments: number
  category: string
  flagged: boolean
}

export default function PostsPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<AdminPost[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [flaggedFilter, setFlaggedFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isClient, setIsClient] = useState(false)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  // Update the fetchPosts function to handle errors properly and validate data
  const fetchPosts = async () => {
    try {
      setRefreshing(true)
      const { data } = await axios.get("/api/admin/posts")

      if (!data || !data.data) {
        throw new Error("Invalid response format from server")
      }

      // Transform the data to ensure proper types for likes and comments
      const transformedPosts = (Array.isArray(data.data) ? data.data : []).map((post) => ({
        id: post.id || post._id || "",
        text: post.text || "",
        image: post.image || "",
        user: {
          id: post.user?.id || post.user?._id || "",
          username: post.user?.username || "Unknown",
          profilePicture: post.user?.profilePicture || "",
        },
        createdAt: post.createdAt || new Date().toISOString(),
        // Ensure likes is a number
        likes: typeof post.likes === "number" ? post.likes : Array.isArray(post.likes) ? post.likes.length : 0,
        // Ensure comments is a number
        comments:
          typeof post.comments === "number" ? post.comments : Array.isArray(post.comments) ? post.comments.length : 0,
        category: post.category || "other",
        flagged: !!post.flagged,
      }))

      setPosts(transformedPosts)
      setFilteredPosts(transformedPosts) // Initialize filtered posts too
    } catch (err: any) {
      console.error("Error loading posts:", err)
      setError(err.response?.data?.message || err.message || "Failed to load posts")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    fetchPosts()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...posts]

    // Apply search filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase()
      result = result.filter(
        (post) =>
          post.text.toLowerCase().includes(lowercaseQuery) ||
          post.user.username.toLowerCase().includes(lowercaseQuery) ||
          post.category.toLowerCase().includes(lowercaseQuery),
      )
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      result = result.filter((post) => post.category === categoryFilter)
    }

    // Apply flagged filter
    if (flaggedFilter !== "all") {
      result = result.filter((post) => (flaggedFilter === "flagged" ? post.flagged : !post.flagged))
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "text":
          comparison = a.text.localeCompare(b.text)
          break
        case "username":
          comparison = a.user.username.localeCompare(b.user.username)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "likes":
          comparison = a.likes - b.likes
          break
        case "comments":
          comparison = a.comments - b.comments
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredPosts(result)
  }, [searchQuery, posts, categoryFilter, flaggedFilter, sortField, sortDirection])

  const handleDeletePost = async (postId: string) => {
    try {
      await axios.delete(`/api/admin/posts/${postId}`)

      // Update local state
      setPosts(posts.filter((post) => post.id !== postId))
      setDeleteDialogOpen(false)
      setSelectedPost(null)

      toast({
        title: "Post deleted",
        description: "The post has been permanently deleted",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete post",
        variant: "destructive",
      })
    }
  }

  const handleFlagPost = async (postId: string, flagged: boolean) => {
    try {
      await axios.put(`/api/admin/posts/${postId}`, { flagged: !flagged })

      // Update local state
      setPosts(posts.map((post) => (post.id === postId ? { ...post, flagged: !flagged } : post)))

      toast({
        title: flagged ? "Post unflagged" : "Post flagged",
        description: flagged
          ? "The post has been unflagged and is now visible to users"
          : "The post has been flagged for moderation",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || `Failed to ${flagged ? "unflag" : "flag"} post`,
        variant: "destructive",
      })
    }
  }

  // Fix the handleDownloadPosts function to use a direct form submission approach
  const handleDownloadPosts = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Date range required",
        description: "Please select both start and end dates",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDownloading(true)

      // Format dates as YYYY-MM-DD
      const formattedStartDate = format(startDate, "yyyy-MM-dd")
      const formattedEndDate = format(endDate, "yyyy-MM-dd")

      toast({
        title: "Download started",
        description: "Your memes are being prepared for download. This may take a moment.",
      })

      // Create a form and submit it to trigger the download
      const form = document.createElement("form")
      form.method = "GET"
      form.action = "/api/admin/posts/download"
      form.target = "_blank" // Open in a new tab/window

      // Add start date parameter
      const startDateInput = document.createElement("input")
      startDateInput.type = "hidden"
      startDateInput.name = "startDate"
      startDateInput.value = formattedStartDate
      form.appendChild(startDateInput)

      // Add end date parameter
      const endDateInput = document.createElement("input")
      endDateInput.type = "hidden"
      endDateInput.name = "endDate"
      endDateInput.value = formattedEndDate
      form.appendChild(endDateInput)

      // Add the form to the document and submit it
      document.body.appendChild(form)
      form.submit()

      // Clean up
      document.body.removeChild(form)

      // Close the dialog after a short delay
      setTimeout(() => {
        setDownloadDialogOpen(false)
        setStartDate(undefined)
        setEndDate(undefined)
        setIsDownloading(false)
      }, 2000)
    } catch (err: any) {
      console.error("Download error:", err)
      toast({
        title: "Download failed",
        description: err.message || "Failed to download memes. Please try again.",
        variant: "destructive",
      })
      setIsDownloading(false)
    }
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
  }

  const postStats = useMemo(() => {
    const categories = posts.reduce(
      (acc, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const categoryData = Object.entries(categories).map(([name, total]) => ({
      name,
      total,
    }))

    // Ensure we're handling numeric values properly
    const totalLikes = posts.reduce((sum, post) => {
      const likes = typeof post.likes === "number" ? post.likes : 0
      return sum + likes
    }, 0)

    const totalComments = posts.reduce((sum, post) => {
      const comments = typeof post.comments === "number" ? post.comments : 0
      return sum + comments
    }, 0)

    return {
      total: posts.length,
      flagged: posts.filter((post) => post.flagged).length,
      categories: categoryData,
      totalLikes,
      totalComments,
      avgLikes: posts.length ? (totalLikes / posts.length).toFixed(1) : "0",
      avgComments: posts.length ? (totalComments / posts.length).toFixed(1) : "0",
    }
  }, [posts])

  const uniqueCategories = useMemo(() => {
    const categories = new Set<string>()
    posts.forEach((post) => categories.add(post.category))
    return Array.from(categories)
  }, [posts])

  // Generate data for analytics charts
  const getCategoryChartData = () => {
    return postStats.categories.map((category) => ({
      name: category.name,
      total: category.total,
    }))
  }

  const getEngagementChartData = () => {
    // Group posts by month and calculate average engagement
    const monthlyData = posts.reduce(
      (acc, post) => {
        const month = new Date(post.createdAt).toLocaleDateString("en-US", { month: "short" })

        if (!acc[month]) {
          acc[month] = {
            likes: 0,
            comments: 0,
            count: 0,
          }
        }

        acc[month].likes += post.likes
        acc[month].comments += post.comments
        acc[month].count += 1

        return acc
      },
      {} as Record<string, { likes: number; comments: number; count: number }>,
    )

    return Object.entries(monthlyData).map(([month, data]) => ({
      name: month,
      likes: Math.round(data.likes / data.count),
      comments: Math.round(data.comments / data.count),
    }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">View and manage all posts on the platform</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center mb-4">
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="rounded-md border">
              <div className="p-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
        <h2 className="text-lg font-semibold">Error Loading Posts</h2>
        <p className="mt-2">{error}</p>
        <Button variant="outline" className="mt-4 bg-white dark:bg-gray-800" onClick={fetchPosts}>
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
          <h1 className="text-3xl font-bold tracking-tight">Content Management</h1>
          <p className="text-muted-foreground">View and manage all posts on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchPosts} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Post List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-5">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Content Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Posts</span>
                  <Badge variant="secondary">{postStats.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Flagged Content</span>
                  <Badge
                    variant="outline"
                    className={
                      postStats.flagged > 0
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
                        : ""
                    }
                  >
                    {postStats.flagged}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Likes</span>
                  <Badge
                    variant="outline"
                    className="bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800"
                  >
                    {postStats.totalLikes}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Total Comments</span>
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                  >
                    {postStats.totalComments}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Avg. Engagement</span>
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-3 w-3 text-pink-500" />
                    <span className="text-sm">{postStats.avgLikes}</span>
                    <MessageSquare className="h-3 w-3 text-blue-500 ml-1" />
                    <span className="text-sm">{postStats.avgComments}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => setDownloadDialogOpen(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Memes
                </Button>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      toast({
                        title: "Export initiated",
                        description: "Content data export has started. You'll be notified when it's ready.",
                      })
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </a>
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle>Posts</CardTitle>
                <CardDescription>Total of {posts.length} posts on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search posts..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4" />
                          <span>Category</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {uniqueCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={flaggedFilter} onValueChange={setFlaggedFilter}>
                      <SelectTrigger className="w-[130px]">
                        <div className="flex items-center gap-2">
                          <Flag className="h-4 w-4" />
                          <span>Status</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Posts</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40%]">Content</TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("username")}>
                          <div className="flex items-center">Author {getSortIcon("username")}</div>
                        </TableHead>
                        <TableHead
                          className="hidden md:table-cell cursor-pointer"
                          onClick={() => toggleSort("category")}
                        >
                          <div className="flex items-center">Category {getSortIcon("category")}</div>
                        </TableHead>
                        <TableHead
                          className="hidden md:table-cell cursor-pointer"
                          onClick={() => toggleSort("createdAt")}
                        >
                          <div className="flex items-center">Posted {getSortIcon("createdAt")}</div>
                        </TableHead>
                        <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("likes")}>
                          <div className="flex items-center">Likes {getSortIcon("likes")}</div>
                        </TableHead>
                        <TableHead
                          className="hidden md:table-cell cursor-pointer"
                          onClick={() => toggleSort("comments")}
                        >
                          <div className="flex items-center">Comments {getSortIcon("comments")}</div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPosts.map((post) => (
                        <TableRow key={post.id} className={post.flagged ? "bg-red-50/50 dark:bg-red-900/10" : ""}>
                          <TableCell>
                            <div className="flex items-start gap-3">
                              {post.image ? (
                                <img
                                  src={post.image || "/placeholder.svg?height=48&width=48"}
                                  alt="Post thumbnail"
                                  className="h-12 w-12 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
                                  <ImageOff className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <div className="line-clamp-2 text-sm">{post.text}</div>
                                {post.flagged && (
                                  <Badge variant="destructive" className="mt-1">
                                    Flagged
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <img
                                src={post.user.profilePicture || "/placeholder.svg?height=24&width=24"}
                                alt={post.user.username}
                                className="h-6 w-6 rounded-full object-cover"
                              />
                              <span className="text-sm">{post.user.username}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">{post.category}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            <div className="flex items-center">
                              <ThumbsUp className="h-3 w-3 text-pink-500 mr-1" />
                              {post.likes}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm">
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 text-blue-500 mr-1" />
                              {post.comments}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => window.open(`/post/${post.id}`, "_blank")}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Post
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleFlagPost(post.id, post.flagged)}>
                                  <Flag className="mr-2 h-4 w-4" />
                                  {post.flagged ? "Unflag Post" : "Flag Post"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600"
                                  onClick={() => {
                                    setSelectedPost(post)
                                    setDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Post
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}

                      {filteredPosts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-6">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <ImageOff className="h-12 w-12 mb-2" />
                              <p>No posts found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content by Category</CardTitle>
                    <CardDescription>Distribution of posts across categories</CardDescription>
                  </div>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {isClient && (
                  <BarChart
                    data={getCategoryChartData()}
                    categories={["total"]}
                    index="name"
                    colors={["green"]}
                    valueFormatter={(value) => `${value} posts`}
                    className="aspect-[4/3]"
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Engagement Trends</CardTitle>
                    <CardDescription>Average likes and comments per post over time</CardDescription>
                  </div>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                {isClient && (
                  <LineChart
                    data={getEngagementChartData()}
                    categories={["likes", "comments"]}
                    index="name"
                    colors={["pink", "blue"]}
                    valueFormatter={(value) => `${value}`}
                    className="aspect-[4/3]"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Content Performance</CardTitle>
                    <CardDescription>Top performing posts by engagement</CardDescription>
                  </div>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Content</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Likes</TableHead>
                      <TableHead>Comments</TableHead>
                      <TableHead>Total Engagement</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...posts]
                      .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
                      .slice(0, 5)
                      .map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            <div className="line-clamp-1 max-w-[200px]">{post.text}</div>
                          </TableCell>
                          <TableCell>{post.user.username}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{post.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <ThumbsUp className="h-3 w-3 text-pink-500 mr-1" />
                              {post.likes}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MessageSquare className="h-3 w-3 text-blue-500 mr-1" />
                              {post.comments}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-500">{post.likes + post.comments}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Post Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone and will permanently remove the
              post and all associated comments.
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="flex items-start gap-3 py-2">
              {selectedPost.image ? (
                <img
                  src={selectedPost.image || "/placeholder.svg?height=64&width=64"}
                  alt="Post thumbnail"
                  className="h-16 w-16 rounded object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded bg-muted">
                  <ImageOff className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div>
                <div className="line-clamp-2 text-sm">{selectedPost.text}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Posted by {selectedPost.user.username} on {new Date(selectedPost.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => selectedPost && handleDeletePost(selectedPost.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Memes Dialog */}
      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Download Memes</DialogTitle>
            <DialogDescription>
              Select a date range to download all memes created within that period as a zip file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Start Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">End Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDownloadDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleDownloadPosts} disabled={!startDate || !endDate || isDownloading}>
              {isDownloading ? (
                <>
                  <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
