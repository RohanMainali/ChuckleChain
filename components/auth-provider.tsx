"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/lib/types"
import axios from "axios"

// Update the axios configuration to use environment variables
axios.defaults.baseURL = process.env.NEXT_PUBLIC_API_URL || "https://chucklechain-api.onrender.com"
axios.defaults.withCredentials = true
axios.defaults.timeout = 10000 // 10 second timeout

// Add request interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    // Add auth token from localStorage to requests if available
    const token = localStorage.getItem("authToken")
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`)
    return config
  },
  (error) => {
    console.error("Request error:", error)
    return Promise.reject(error)
  },
)

// Add response interceptor for debugging
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      console.error(`Response error ${error.response.status}:`, error.response.data)
    } else if (error.request) {
      console.error("No response received:", error.request)
    } else {
      console.error("Error setting up request:", error.message)
    }
    return Promise.reject(error)
  },
)

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<boolean>
  signup: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Update the useEffect to check for token in localStorage
  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem("authToken")

        if (token) {
          // Set default auth header
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

          const { data } = await axios.get("/api/auth/me")
          if (data.success) {
            setUser({
              id: data.data._id,
              username: data.data.username,
              profilePicture: data.data.profilePicture,
              email: data.data.email,
              bio: data.data.bio,
            })
          } else {
            // If API returns unsuccessful but no error, clear token
            localStorage.removeItem("authToken")
            delete axios.defaults.headers.common["Authorization"]
          }
        }
      } catch (error) {
        console.error("Authentication error:", error)
        // Clear token if invalid
        localStorage.removeItem("authToken")
        delete axios.defaults.headers.common["Authorization"]
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Update the login function to store token in localStorage
  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await axios.post("/api/auth/login", { username, password })

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem("authToken", data.token)

        // Add token to axios default headers for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

        setUser({
          id: data.data._id,
          username: data.data.username,
          profilePicture: data.data.profilePicture,
          email: data.data.email,
          bio: data.data.bio,
        })
        return true
      }
      return false
    } catch (error) {
      console.error("Login error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update the signup function to store token in localStorage
  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await axios.post("/api/auth/signup", { username, email, password })

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem("authToken", data.token)

        // Add token to axios default headers for future requests
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`

        setUser({
          id: data.data._id,
          username: data.data.username,
          profilePicture: data.data.profilePicture,
          email: data.data.email,
          bio: data.data.bio,
        })
        return true
      }
      return false
    } catch (error) {
      console.error("Signup error:", error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update the logout function to clear localStorage
  const logout = async () => {
    try {
      await axios.get("/api/auth/logout")
      // Clear token from localStorage
      localStorage.removeItem("authToken")
      // Remove Authorization header
      delete axios.defaults.headers.common["Authorization"]
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
      // Even if the API call fails, clear local storage and user state
      localStorage.removeItem("authToken")
      delete axios.defaults.headers.common["Authorization"]
      setUser(null)
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        const { data } = await axios.put("/api/users/me", updates)
        if (data.success) {
          setUser({
            ...user,
            ...updates,
          })
        }
      } catch (error) {
        console.error("Update user error:", error)
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

