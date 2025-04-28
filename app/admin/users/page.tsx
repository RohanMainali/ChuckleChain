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
  UserCog,
  Shield,
  UserX,
  Eye,
  Edit,
  Trash2,
  RefreshCcw,
  Filter,
  SortAsc,
  SortDesc,
  CheckCircle,
  XCircle,
  AlertCircle,
  UserPlus,
  Download,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

interface AdminUser {
  id: string
  username: string
  email: string
  profilePicture: string
  role: string
  createdAt: string
  lastActive: string
  postCount: number
  followerCount: number
  status?: "active" | "suspended" | "pending"
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortField, setSortField] = useState<string>("username")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const { toast } = useToast()

  const fetchUsers = async () => {
    try {
      setRefreshing(true)
      const { data } = await axios.get("/api/admin/users")

      // Add a status field if it doesn't exist
      const processedUsers = (data.data || []).map((user: AdminUser) => ({
        ...user,
        status: user.status || "active",
      }))

      setUsers(processedUsers)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let result = [...users]

    // Apply search filter
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase()
      result = result.filter(
        (user) =>
          user.username.toLowerCase().includes(lowercaseQuery) || user.email.toLowerCase().includes(lowercaseQuery),
      )
    }

    // Apply role filter
    if (roleFilter !== "all") {
      result = result.filter((user) => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((user) => user.status === statusFilter)
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "username":
          comparison = a.username.localeCompare(b.username)
          break
        case "email":
          comparison = a.email.localeCompare(b.email)
          break
        case "role":
          comparison = a.role.localeCompare(b.role)
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "postCount":
          comparison = a.postCount - b.postCount
          break
        case "followerCount":
          comparison = a.followerCount - b.followerCount
          break
        default:
          comparison = 0
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    setFilteredUsers(result)
  }, [searchQuery, users, roleFilter, statusFilter, sortField, sortDirection])

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      setRefreshing(true)
      await axios.put(`/api/admin/users/${userId}`, { role: newRole })

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`,
      })
    } catch (err: any) {
      console.error("Error updating user role:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update user role",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleStatusChange = async (userId: string, newStatus: "active" | "suspended" | "pending") => {
    try {
      setRefreshing(true)
      await axios.put(`/api/admin/users/${userId}`, { status: newStatus })

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)))

      toast({
        title: "Status updated",
        description: `User status has been updated to ${newStatus}`,
      })
    } catch (err: any) {
      console.error("Error updating user status:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update user status",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`)

      // Update local state
      setUsers(users.filter((user) => user.id !== userId))
      setDeleteDialogOpen(false)
      setSelectedUser(null)

      toast({
        title: "User deleted",
        description: "The user has been permanently deleted",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === "asc" ? <SortAsc className="h-3 w-3 ml-1" /> : <SortDesc className="h-3 w-3 ml-1" />
  }

  const userStats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((user) => user.role === "admin").length,
      active: users.filter((user) => user.status === "active").length,
      suspended: users.filter((user) => user.status === "suspended").length,
      pending: users.filter((user) => user.status === "pending").length,
    }
  }, [users])

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      case "pending":
        return (
          <Badge
            variant="outline"
            className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
          >
            Pending
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">View and manage user accounts</p>
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
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
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
        <h2 className="text-lg font-semibold">Error Loading Users</h2>
        <p className="mt-2">{error}</p>
        <Button variant="outline" className="mt-4 bg-white dark:bg-gray-800" onClick={fetchUsers}>
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
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">View and manage user accounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={refreshing}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button variant="default" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>User Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Users</span>
              <Badge variant="secondary">{userStats.total}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Administrators</span>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
              >
                {userStats.admins}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Active Users</span>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
              >
                {userStats.active}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Suspended</span>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              >
                {userStats.suspended}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Pending</span>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800"
              >
                {userStats.pending}
              </Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  toast({
                    title: "Export initiated",
                    description: "User data export has started. You'll be notified when it's ready.",
                  })
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </a>
            </Button>
          </CardFooter>
        </Card>

        <Card className="md:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle>Users</CardTitle>
            <CardDescription>Total of {users.length} users registered on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-4">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Role: {roleFilter}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[130px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <span>Status: {statusFilter}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("username")}>
                      <div className="flex items-center">User {getSortIcon("username")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => toggleSort("role")}>
                      <div className="flex items-center">Role {getSortIcon("role")}</div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("createdAt")}>
                      <div className="flex items-center">Joined {getSortIcon("createdAt")}</div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => toggleSort("postCount")}>
                      <div className="flex items-center">Posts {getSortIcon("postCount")}</div>
                    </TableHead>
                    <TableHead
                      className="hidden md:table-cell cursor-pointer"
                      onClick={() => toggleSort("followerCount")}
                    >
                      <div className="flex items-center">Followers {getSortIcon("followerCount")}</div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={user.profilePicture || "/placeholder.svg?height=40&width=40"}
                            alt={user.username}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{user.username}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <Badge className="bg-purple-500">Admin</Badge>
                          ) : (
                            <Badge variant="outline">User</Badge>
                          )}
                          {renderStatusBadge(user.status || "active")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.postCount}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.followerCount}</TableCell>
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
                            <DropdownMenuItem onClick={() => window.open(`/profile/${user.username}`, "_blank")}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user)
                                setEditDialogOpen(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Role Management</DropdownMenuLabel>
                            {user.role === "admin" ? (
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")}>
                                <UserCog className="mr-2 h-4 w-4" />
                                Demote to User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}>
                                <Shield className="mr-2 h-4 w-4" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Status Management</DropdownMenuLabel>
                            {user.status !== "active" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "active")}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Activate User
                              </DropdownMenuItem>
                            )}
                            {user.status !== "suspended" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "suspended")}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Suspend User
                              </DropdownMenuItem>
                            )}
                            {user.status !== "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(user.id, "pending")}>
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Mark as Pending
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600"
                              onClick={() => {
                                setSelectedUser(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <UserX className="h-12 w-12 mb-2" />
                          <p>No users found</p>
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

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove the
              user account and all associated data.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="flex items-center gap-3 py-2">
              <img
                src={selectedUser.profilePicture || "/placeholder.svg?height=40&width=40"}
                alt={selectedUser.username}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <div className="font-medium">{selectedUser.username}</div>
                <div className="text-sm text-muted-foreground">{selectedUser.email}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => selectedUser && handleDeleteUser(selectedUser.id)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Make changes to the user account details.</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    src={selectedUser.profilePicture || "/placeholder.svg?height=80&width=80"}
                    alt={selectedUser.username}
                    className="h-20 w-20 rounded-full object-cover"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="username" className="text-right text-sm font-medium">
                  Username
                </label>
                <Input id="username" defaultValue={selectedUser.username} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="email" className="text-right text-sm font-medium">
                  Email
                </label>
                <Input id="email" defaultValue={selectedUser.email} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="role" className="text-right text-sm font-medium">
                  Role
                </label>
                <Select defaultValue={selectedUser.role} id="role">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="status" className="text-right text-sm font-medium">
                  Status
                </label>
                <Select defaultValue={selectedUser.status || "active"} id="status">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedUser) {
                  // Get the form values
                  const username = (document.getElementById("username") as HTMLInputElement)?.value
                  const email = (document.getElementById("email") as HTMLInputElement)?.value
                  const role =
                    (document.querySelector("[data-value]") as HTMLElement)?.getAttribute("data-value") ||
                    selectedUser.role
                  const status =
                    (document.querySelector("[data-value]") as HTMLElement)?.getAttribute("data-value") ||
                    selectedUser.status ||
                    "active"

                  // Call the handleEditUser function with the updated data
                  handleEditUser(selectedUser.id, {
                    username,
                    email,
                    role,
                    status,
                  })
                }
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )

  // Update the edit user function to actually save changes
  async function handleEditUser(userId: string, userData: any) {
    try {
      setRefreshing(true)
      await axios.put(`/api/admin/users/${userId}`, userData)

      // Update local state
      setUsers(users.map((user) => (user.id === userId ? { ...user, ...userData } : user)))

      setEditDialogOpen(false)
      toast({
        title: "User updated",
        description: "The user details have been updated successfully.",
      })
    } catch (err: any) {
      console.error("Error updating user:", err)
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to update user",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }
}
