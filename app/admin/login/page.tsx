"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Shield } from "lucide-react"
import { useAuth } from "@/components/auth-provider"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const success = await login(username, password)

      if (success) {
        // Redirect to admin dashboard after successful login
        router.push("/admin/dashboard")
      } else {
        setError("Invalid credentials")
      }
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
          <div className="flex flex-col items-center space-y-2 text-center">
            <div className="p-2 bg-purple-500/20 rounded-full">
              <Shield className="h-10 w-10 text-purple-500" />
            </div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              role="alert"
            >
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
                placeholder="admin"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-md dark:border-gray-700 dark:bg-gray-800"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="pt-4 text-center text-sm border-t dark:border-gray-700">
            <Link href="/" className="text-purple-600 hover:underline">
              Return to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

