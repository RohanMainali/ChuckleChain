"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from "@/components/ui/card"
import { useAuth } from "@/components/auth-provider"
import { LaughIcon } from "lucide-react"

export function LoginForm() {
  const router = useRouter()
  const { login, signup } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })

  // Signup form state
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const success = await login(loginData.username, loginData.password)
      if (success) {
        router.push("/feed")
      } else {
        setErrors({ login: "Invalid username or password" })
      }
    } catch (error) {
      console.error("Login error:", error)
      setErrors({ login: "An error occurred during login" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" })
      setIsLoading(false)
      return
    }

    try {
      const success = await signup(signupData.username, signupData.email, signupData.password)
      if (success) {
        router.push("/feed")
      } else {
        setErrors({ signup: "Error creating account" })
      }
    } catch (error) {
      setErrors({ signup: "An error occurred during signup" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg animate-fade-in">
      <CardHeader className="space-y-2 text-center">
        <div className="flex justify-center">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <LaughIcon className="h-8 w-8 text-primary" />
            ChuckleChain
          </div>
        </div>
        <CardDescription>Share memes, spread laughter</CardDescription>
      </CardHeader>
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="signup">Sign Up</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <form onSubmit={handleLoginSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="#" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
              </div>
              {errors.login && <p className="text-sm text-destructive">{errors.login}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full transition-all duration-300 hover:scale-105" disabled={isLoading}>
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                ) : null}
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={handleSignupSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  placeholder="Choose a username"
                  value={signupData.username}
                  onChange={(e) => setSignupData({ ...signupData, username: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={signupData.email}
                  onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  required
                  className="transition-all duration-300 focus:scale-102"
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>
              {errors.signup && <p className="text-sm text-destructive">{errors.signup}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full transition-all duration-300 hover:scale-105" disabled={isLoading}>
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
                ) : null}
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
            </CardFooter>
          </form>
        </TabsContent>
      </Tabs>
    </Card>
  )
}
