"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { Profile } from "@/components/profile"
import { useAuth } from "@/components/auth-provider"
import axios from "axios"

export default function ProfilePage({ params }: { params: { username: string } }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          setLoading(true)
          const { data } = await axios.get(`/api/users/${params.username}`)
          if (data.success) {
            setProfile(data.data)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    if (user) {
      fetchProfile()
    }
  }, [params.username, user])

  return (
    <MainLayout>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <Profile profile={profile?.user} username={params.username} />
      )}
    </MainLayout>
  )
}

