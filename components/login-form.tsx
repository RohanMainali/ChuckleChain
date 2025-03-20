"use client"

import type React from "react"

import { useState } from "react"
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

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })

  // Update the signup form state
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Add this function to validate and format the username
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    // Convert to lowercase
    const lowercaseValue = value.toLowerCase()

    // Remove any characters that aren't lowercase letters, numbers, or underscores
    const validValue = lowercaseValue.replace(/[^a-z0-9_]/g, "")

    // Update the form state with the valid value
    setSignupData({ ...signupData, username: validValue })

    // Show error if the original input had invalid characters
    if (value !== validValue) {
      setErrors({
        ...errors,
        username: "Username can only contain lowercase letters, numbers, and underscores (_)",
      })
    } else {
      // Clear the error if input is valid
      const { username, ...remainingErrors } = errors
      setErrors(remainingErrors)
    }
  }

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
      setErrors({ login: "An error occurred during login" })
    } finally {
      setIsLoading(false)
    }
  }

  // Update the handleSignupSubmit function to include additional validation
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate username format
    if (!/^[a-z0-9_]+$/.test(signupData.username)) {
      setErrors({ username: "Username can only contain lowercase letters, numbers, and underscores (_)" })
      setIsLoading(false)
      return
    }

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
              {/* Update the username input in the signup form */}
              <div className="space-y-2">
                <Label htmlFor="signup-username">Username</Label>
                <Input
                  id="signup-username"
                  placeholder="Choose a username"
                  value={signupData.username}
                  onChange={handleUsernameChange}
                  required
                  className={`transition-all duration-300 focus:scale-102 ${errors.username ? "border-destructive" : ""}`}
                />
                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and underscores only</p>
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

