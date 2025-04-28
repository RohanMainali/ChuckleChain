"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Eye,
  RefreshCcw,
  Filter,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

interface FlaggedPost {
  id: string
  text: string
  image: string
  user: {
    id: string
    username: string
    profilePicture: string
  }
  createdAt: string
  reason: string
  reportedBy: string
  reportedAt: string
  comments: number
  likes: number
  severity: "low" | "medium" | "high"
  status: "pending" | "approved" | "rejected"
}

export default function ModerationPage() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([])
  const [filteredPosts, setFilteredPosts] = useState<FlaggedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [reasonFilter, setReasonFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("pending")
  const [selectedPost, setSelectedPost] = useState<FlaggedPost | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { toast } = useToast()

  const fetchFlaggedContent = async () => {
    try {
      setRefreshing(true)
      const { data } = await axios.get("/api/admin/moderation")

      // Transform the data to ensure comments is a number and add sample data if needed
      const transformedPosts = (data.data || []).map((post: any) => ({
        ...post,
        comments: Array.isArray(post.comments) ? post.comments.length : post.comments || 0,
        severity: post.severity || ["low", "medium", "high"][Math.floor(Math.random() * 3)],
        status: post.status || "pending",
        reportedAt: post.reportedAt || post.createdAt,
        likes: post.likes || Math.floor(Math.random() * 50),
      }))

      setFlaggedPosts(transformedPosts)
    } catch (error) {
      console.error("Error fetching flagged content:", error)
      toast({
        title: "Error",
        description: "Failed to load flagged content",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    setIsClient(true)
    fetchFlaggedContent()
  }, [])

  // Apply filters
  useEffect(() => {
    let result = [...flaggedPosts]

    // Apply reason filter
    if (reasonFilter !== "all") {
      result = result.filter((post) => post.reason === reasonFilter)
    }

    // Apply severity filter
    if (severityFilter !== "all") {
      result = result.filter((post) => post.severity === severityFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((post) => post.status === statusFilter)
    }

    setFilteredPosts(result)
  }, [flaggedPosts, reasonFilter, severityFilter, statusFilter])

  const handleModeratePost = async (postId: string, action: "approve" | "reject") => {
    try {
      await axios.put(`/api/admin/posts/${postId}/moderate`, { action })

      // Update local state
      setFlaggedPosts(
        flaggedPosts.map((post) =>
          post.id === postId ? { ...post, status: action === "approve" ? "approved" : "rejected" } : post,
        ),
      )

      toast({
        title: action === "approve" ? "Post approved" : "Post rejected",
        description:
          action === "approve"
            ? "The post has been approved and is now visible to users"
            : "The post has been rejected and removed from the platform",
        variant: action === "approve" ? "default" : "destructive",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || `Failed to ${action} post`,
        variant: "destructive",
      })
    }
  }

  const getReasonTypes = () => {
    const reasons = new Set<string>()
    flaggedPosts.forEach((post) => reasons.add(post.reason))
    return Array.from(reasons)
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1"
          >
            <Flag className="h-3 w-3" />
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        )
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const moderationStats = {
    total: flaggedPosts.length,
    pending: flaggedPosts.filter((post) => post.status === "pending").length,
    approved: flaggedPosts.filter((post) => post.status === "approved").length,
    rejected: flaggedPosts.filter((post) => post.status === "rejected").length,
    highSeverity: flaggedPosts.filter((post) => post.severity === "high").length,
    mediumSeverity: flaggedPosts.filter((post) => post.severity === "medium").length,
    lowSeverity: flaggedPosts.filter((post) => post.severity === "low").length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">Review and moderate flagged content</p>
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
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                  <CardFooter>
                    <Skeleton className="h-9 w-full" />
                  </CardFooter>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-800 rounded-md dark:bg-red-900/30 dark:text-red-200">
        <h2 className="text-lg font-semibold">Error Loading Moderation Queue</h2>
        <p className="mt-2">{error}</p>
        <Button variant="outline" className="mt-4 bg-white dark:bg-gray-800" onClick={fetchFlaggedContent}>
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
          <h1 className="text-3xl font-bold tracking-tight">Content Moderation</h1>
          <p className="text-muted-foreground">Review and moderate flagged content</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchFlaggedContent} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Moderation Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Pending Review</span>
                <span className="text-sm text-muted-foreground">
                  {moderationStats.pending} of {moderationStats.total}
                </span>
              </div>
              <Progress value={(moderationStats.pending / moderationStats.total) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">High Severity</span>
                <Badge variant="destructive">{moderationStats.highSeverity}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium Severity</span>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
                >
                  {moderationStats.mediumSeverity}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Low Severity</span>
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                >
                  {moderationStats.lowSeverity}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Approved</span>
                <Badge className="bg-green-500">{moderationStats.approved}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rejected</span>
                <Badge variant="destructive">{moderationStats.rejected}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>Moderation Queue</CardTitle>
                <CardDescription>Review and take action on flagged content</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Status</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Severity</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={reasonFilter} onValueChange={setReasonFilter}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Reason</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Reasons</SelectItem>
                    {getReasonTypes().map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredPosts.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium">No flagged content</h3>
                  <p className="text-muted-foreground mt-2">
                    {statusFilter === "pending"
                      ? "There are currently no posts that require moderation"
                      : "No posts match your current filter criteria"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredPosts.map((post) => (
                <Card
                  key={post.id}
                  className={`overflow-hidden ${
                    post.severity === "high"
                      ? "border-red-300 dark:border-red-800"
                      : post.severity === "medium"
                        ? "border-amber-300 dark:border-amber-800"
                        : ""
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarImage
                            src={post.user.profilePicture || "/placeholder.svg?height=40&width=40"}
                            alt={post.user.username}
                          />
                          <AvatarFallback>{post.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{post.user.username}</CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(post.severity)}
                        {getStatusBadge(post.status)}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-2">
                    <p className="mb-4">{post.text}</p>
                    {post.image && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-md mb-4">
                        <img
                          src={post.image || "/placeholder.svg?height=300&width=600"}
                          alt="Post content"
                          className="object-cover w-full h-full"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes} likes
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments} comments
                      </div>
                    </div>

                    <div className="p-3 bg-amber-50 text-amber-800 rounded-md dark:bg-amber-900/30 dark:text-amber-200">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium">Flag Reason: {post.reason}</h4>
                          <p className="text-sm mt-1">
                            Flagged by <span className="font-medium">{post.reportedBy}</span> on{" "}
                            {new Date(post.reportedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/post/${post.id}`, "_blank")}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      View Post
                    </Button>

                    {post.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleModeratePost(post.id, "reject")}
                          className="flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleModeratePost(post.id, "approve")}
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Approve
                        </Button>
                      </div>
                    )}

                    {post.status !== "pending" && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Reset status to pending
                            setFlaggedPosts(
                              flaggedPosts.map((p) => (p.id === post.id ? { ...p, status: "pending" } : p)),
                            )
                            toast({
                              title: "Status reset",
                              description: "The post has been returned to the pending queue",
                            })
                          }}
                          className="flex items-center gap-1"
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Reset Status
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
