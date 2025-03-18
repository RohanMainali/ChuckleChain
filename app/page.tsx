import { redirect } from "next/navigation"
import { LoginForm } from "@/components/login-form"

export default function Home() {
  // In a real app, we would check if the user is authenticated
  // For demo purposes, we'll just show the login page
  // If authenticated, redirect to /feed
  const isAuthenticated = false

  if (isAuthenticated) {
    redirect("/feed")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted">
      <LoginForm />
    </div>
  )
}

