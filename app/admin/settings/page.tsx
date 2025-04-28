"use client"

import { useState } from "react"
import axios from "axios"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { CloudCog, ShieldAlert, Settings, Save, RefreshCw } from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Cloudinary settings
  const [cloudinarySettings, setCloudinarySettings] = useState({
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: "chucklechain_uploads",
    folder: "chucklechain",
    resourceType: "image",
    maxFileSize: 10485760, // 10MB
  })

  // Content moderation settings
  const [moderationSettings, setModerationSettings] = useState({
    autoModeration: true,
    profanityFilter: true,
    sensitiveContentDetection: true,
    userReportThreshold: 3,
  })

  // Admin registration settings
  const [adminSettings, setAdminSettings] = useState({
    adminRegistrationEnabled: false,
    adminToken: "",
  })

  const handleSaveCloudinarySettings = async () => {
    setLoading(true)
    try {
      await axios.put("/api/admin/settings/cloudinary", cloudinarySettings)
      toast({
        title: "Settings saved",
        description: "Cloudinary settings have been updated successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveModerationSettings = async () => {
    setLoading(true)
    try {
      await axios.put("/api/admin/settings/moderation", moderationSettings)
      toast({
        title: "Settings saved",
        description: "Content moderation settings have been updated successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAdminSettings = async () => {
    setLoading(true)
    try {
      await axios.put("/api/admin/settings/admin", adminSettings)
      toast({
        title: "Settings saved",
        description: "Admin registration settings have been updated successfully",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateAdminToken = () => {
    // Generate a random token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

    setAdminSettings({
      ...adminSettings,
      adminToken: token,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">Configure system-wide settings for your platform</p>
      </div>

      <Tabs defaultValue="cloudinary">
        <TabsList>
          <TabsTrigger value="cloudinary" className="flex items-center gap-1">
            <CloudCog className="h-4 w-4" />
            <span>Cloudinary</span>
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-1">
            <ShieldAlert className="h-4 w-4" />
            <span>Content Moderation</span>
          </TabsTrigger>
          <TabsTrigger value="admin" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>Admin Access</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cloudinary" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CloudCog className="h-5 w-5" />
                Cloudinary Configuration
              </CardTitle>
              <CardDescription>Configure your Cloudinary settings for image uploads and storage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cloudName">Cloud Name</Label>
                <Input
                  id="cloudName"
                  value={cloudinarySettings.cloudName}
                  onChange={(e) => setCloudinarySettings({ ...cloudinarySettings, cloudName: e.target.value })}
                  placeholder="your_cloud_name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uploadPreset">Upload Preset</Label>
                <Input
                  id="uploadPreset"
                  value={cloudinarySettings.uploadPreset}
                  onChange={(e) => setCloudinarySettings({ ...cloudinarySettings, uploadPreset: e.target.value })}
                  placeholder="your_upload_preset"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                <Input
                  id="folder"
                  value={cloudinarySettings.folder}
                  onChange={(e) => setCloudinarySettings({ ...cloudinarySettings, folder: e.target.value })}
                  placeholder="chucklechain"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxFileSize">Max File Size (bytes)</Label>
                <Input
                  id="maxFileSize"
                  type="number"
                  value={cloudinarySettings.maxFileSize}
                  onChange={(e) =>
                    setCloudinarySettings({ ...cloudinarySettings, maxFileSize: Number.parseInt(e.target.value) })
                  }
                  placeholder="10485760"
                />
                <p className="text-xs text-muted-foreground">
                  Current: {(cloudinarySettings.maxFileSize / 1048576).toFixed(1)} MB
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveCloudinarySettings} disabled={loading} className="flex items-center gap-1">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="moderation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5" />
                Content Moderation Settings
              </CardTitle>
              <CardDescription>Configure how content is moderated on your platform</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoModeration">Automatic Moderation</Label>
                  <p className="text-sm text-muted-foreground">Automatically flag potentially inappropriate content</p>
                </div>
                <Switch
                  id="autoModeration"
                  checked={moderationSettings.autoModeration}
                  onCheckedChange={(checked) =>
                    setModerationSettings({ ...moderationSettings, autoModeration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profanityFilter">Profanity Filter</Label>
                  <p className="text-sm text-muted-foreground">Filter out profanity and offensive language</p>
                </div>
                <Switch
                  id="profanityFilter"
                  checked={moderationSettings.profanityFilter}
                  onCheckedChange={(checked) =>
                    setModerationSettings({ ...moderationSettings, profanityFilter: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sensitiveContentDetection">Sensitive Content Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect and flag potentially sensitive images</p>
                </div>
                <Switch
                  id="sensitiveContentDetection"
                  checked={moderationSettings.sensitiveContentDetection}
                  onCheckedChange={(checked) =>
                    setModerationSettings({ ...moderationSettings, sensitiveContentDetection: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userReportThreshold">User Report Threshold</Label>
                <Input
                  id="userReportThreshold"
                  type="number"
                  value={moderationSettings.userReportThreshold}
                  onChange={(e) =>
                    setModerationSettings({
                      ...moderationSettings,
                      userReportThreshold: Number.parseInt(e.target.value),
                    })
                  }
                  placeholder="3"
                />
                <p className="text-xs text-muted-foreground">Number of reports needed to automatically flag content</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveModerationSettings} disabled={loading} className="flex items-center gap-1">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="admin" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin Registration Settings
              </CardTitle>
              <CardDescription>Configure admin registration access and security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="adminRegistrationEnabled">Enable Admin Registration</Label>
                  <p className="text-sm text-muted-foreground">Allow new admin accounts to be created with the token</p>
                </div>
                <Switch
                  id="adminRegistrationEnabled"
                  checked={adminSettings.adminRegistrationEnabled}
                  onCheckedChange={(checked) =>
                    setAdminSettings({ ...adminSettings, adminRegistrationEnabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminToken">Admin Registration Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="adminToken"
                    value={adminSettings.adminToken}
                    onChange={(e) => setAdminSettings({ ...adminSettings, adminToken: e.target.value })}
                    placeholder="Secret token for admin registration"
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleGenerateAdminToken} className="flex items-center gap-1">
                    <RefreshCw className="h-4 w-4" />
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This token is required when registering a new admin account
                </p>
              </div>

              <div className="rounded-md bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Security Notice</h4>
                    <p className="text-sm mt-1">
                      Keep your admin token secure. Anyone with this token can register as an admin if admin
                      registration is enabled.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAdminSettings} disabled={loading} className="flex items-center gap-1">
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

