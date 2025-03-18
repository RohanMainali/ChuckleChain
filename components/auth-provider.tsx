"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/lib/types"
import axios from "axios"

// Configure axios
axios.defaults.baseURL = "http://localhost:5001"
axios.defaults.withCredentials = true

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

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const { data } = await axios.get("/api/auth/me")
        if (data.success) {
          setUser({
            id: data.data._id,
            username: data.data.username,
            profilePicture: data.data.profilePicture,
            email: data.data.email,
            bio: data.data.bio,
          })
        }
      } catch (error) {
        console.error("Authentication error:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await axios.post("/api/auth/login", { username, password })

      if (data.success) {
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

  const signup = async (username: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      const { data } = await axios.post("/api/auth/signup", { username, email, password })

      if (data.success) {
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

  const logout = async () => {
    try {
      await axios.get("/api/auth/logout")
      setUser(null)
    } catch (error) {
      console.error("Logout error:", error)
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

