"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/components/auth-provider"
import { Bell, Lock, Palette, User } from "lucide-react"
import axios from "axios"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useTheme()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModePreference, setDarkModePreference] = useState(theme || "system")
  const [contentFilter, setContentFilter] = useState("standard")
  const [fontScale, setFontScale] = useState([1])
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    allowTagging: true,
    showOnlineStatus: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({
    account: false,
    appearance: false,
    notifications: false,
    privacy: false,
  })

  // Add account state
  const [accountSettings, setAccountSettings] = useState({
    username: user?.username || "",
    email: "",
    bio: "",
  })

  // Sync theme with darkModePreference
  useEffect(() => {
    if (theme) {
      setDarkModePreference(theme)
    }
  }, [theme])

  // Apply font scaling to the document
  useEffect(() => {
    if (open) {
      const htmlElement = document.documentElement
      const currentScale = Number.parseFloat(htmlElement.style.fontSize) || 16
      // Store original font size when dialog opens
      if (!htmlElement.getAttribute("data-original-font-size")) {
        htmlElement.setAttribute("data-original-font-size", `${currentScale}px`)
      }
    }
  }, [open])

  useEffect(() => {
    if (user && open) {
      // In a real app, we would fetch the complete user profile
      // For now, use what we have in the auth context
      setAccountSettings({
        username: user.username,
        email: user.email || "", // Add email to the auth context if not already there
        bio: user.bio || "",
      })
    }
  }, [user, open])

  // Add save settings function
  const handleSaveSettings = async (section: string) => {
    setIsSaving(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Apply settings based on section
    if (section === "appearance") {
      // Apply theme change
      setTheme(darkModePreference)

      // Apply font scaling
      const htmlElement = document.documentElement
      const originalSize = Number.parseFloat(htmlElement.getAttribute("data-original-font-size") || "16px")
      const newSize = originalSize * fontScale[0]
      htmlElement.style.fontSize = `${newSize}px`

      // Store the setting in localStorage for persistence
      localStorage.setItem("fontScale", fontScale[0].toString())
    }

    if (section === "account") {
      // In a real app, we would update the user profile on the server
      try {
        const { data } = await axios.put("/api/users/me", accountSettings)
        if (data.success) {
          // Update the user in the auth context
          if (user) {
            updateUser({
              ...user,
              username: accountSettings.username,
              bio: accountSettings.bio,
            })
          }
        }
      } catch (error) {
        console.error("Error updating account settings:", error)
      }
    }

    // Update success state for the specific section
    setSaveSuccess((prev) => ({ ...prev, [section]: true }))

    // Reset success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess((prev) => ({ ...prev, [section]: false }))
    }, 3000)

    setIsSaving(false)

    // In a real app, we would save the settings to the server
    console.log(`Saving ${section} settings:`, {
      account: accountSettings,
      appearance: { darkModePreference, fontScale },
      notifications: { notificationsEnabled },
      privacy: privacySettings,
      contentFilter,
    })
  }

  // Load saved font scale on component mount
  useEffect(() => {
    const savedFontScale = localStorage.getItem("fontScale")
    if (savedFontScale) {
      setFontScale([Number.parseFloat(savedFontScale)])
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="account" className="mt-4">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
          </TabsList>

          {/* Account Settings */}
          <TabsContent value="account" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={accountSettings.username}
                onChange={(e) => setAccountSettings({ ...accountSettings, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={accountSettings.email}
                onChange={(e) => setAccountSettings({ ...accountSettings, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={accountSettings.bio}
                onChange={(e) => setAccountSettings({ ...accountSettings, bio: e.target.value })}
              />
            </div>

            <div className="pt-4 flex justify-end items-center gap-3">
              {saveSuccess.account && <span className="text-sm text-green-500">Settings saved successfully!</span>}
              <Button onClick={() => handleSaveSettings("account")} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <Label>Theme Preference</Label>
              <RadioGroup
                value={darkModePreference}
                onValueChange={setDarkModePreference}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light">Light</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark">Dark</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system">System</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="font-scale">Font Size</Label>
                <span className="text-sm text-muted-foreground">{fontScale[0]}x</span>
              </div>
              <Slider id="font-scale" min={0.8} max={1.4} step={0.1} value={fontScale} onValueChange={setFontScale} />
            </div>

            <div className="pt-4 flex justify-end items-center gap-3">
              {saveSuccess.appearance && <span className="text-sm text-green-500">Settings saved successfully!</span>}
              <Button onClick={() => handleSaveSettings("appearance")} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications-toggle">Push Notifications</Label>
                <div className="text-sm text-muted-foreground">Receive notifications for activity on your posts</div>
              </div>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>

            <div className="space-y-2">
              <Label>Email Notification Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-likes" className="text-sm">
                    Likes on your posts
                  </Label>
                  <Switch id="email-likes" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-comments" className="text-sm">
                    Comments on your posts
                  </Label>
                  <Switch id="email-comments" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-followers" className="text-sm">
                    New followers
                  </Label>
                  <Switch id="email-followers" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-messages" className="text-sm">
                    Direct messages
                  </Label>
                  <Switch id="email-messages" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end items-center gap-3">
              {saveSuccess.notifications && (
                <span className="text-sm text-green-500">Settings saved successfully!</span>
              )}
              <Button onClick={() => handleSaveSettings("notifications")} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-visibility">Profile Visibility</Label>
              <Select
                value={privacySettings.profileVisibility}
                onValueChange={(value) => setPrivacySettings({ ...privacySettings, profileVisibility: value })}
              >
                <SelectTrigger id="profile-visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="followers">Followers Only</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content-filter">Content Filter</Label>
              <Select value={contentFilter} onValueChange={setContentFilter}>
                <SelectTrigger id="content-filter">
                  <SelectValue placeholder="Select filter level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-tagging">Allow Tagging</Label>
                <div className="text-sm text-muted-foreground">Let others tag you in their posts</div>
              </div>
              <Switch
                id="allow-tagging"
                checked={privacySettings.allowTagging}
                onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, allowTagging: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="online-status">Show Online Status</Label>
                <div className="text-sm text-muted-foreground">Let others see when you're active</div>
              </div>
              <Switch
                id="online-status"
                checked={privacySettings.showOnlineStatus}
                onCheckedChange={(checked) => setPrivacySettings({ ...privacySettings, showOnlineStatus: checked })}
              />
            </div>

            <div className="pt-4 flex justify-end items-center gap-3">
              {saveSuccess.privacy && <span className="text-sm text-green-500">Settings saved successfully!</span>}
              <Button onClick={() => handleSaveSettings("privacy")} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

