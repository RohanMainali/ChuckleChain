"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/auth-provider";
import { Lock, Palette, User, Shield, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "axios";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const router = useRouter();
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModePreference, setDarkModePreference] = useState(
    theme || "system"
  );
  const [fontScale, setFontScale] = useState([1]);
  const [privacySettings, setPrivacySettings] = useState({
    allowTagging: true,
    showOnlineStatus: true,
    showReadReceipts: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({
    account: false,
    appearance: false,
    notifications: false,
    privacy: false,
    security: false,
  });
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Add account state
  const [accountSettings, setAccountSettings] = useState({
    username: user?.username || "",
    email: "",
    bio: "",
  });

  // Add security state
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Add validation errors state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Sync theme with darkModePreference
  useEffect(() => {
    if (theme) {
      setDarkModePreference(theme);
    }
  }, [theme]);

  // Apply font scaling to the document
  useEffect(() => {
    if (open) {
      const htmlElement = document.documentElement;
      const currentScale = Number.parseFloat(htmlElement.style.fontSize) || 16;
      // Store original font size when dialog opens
      if (!htmlElement.getAttribute("data-original-font-size")) {
        htmlElement.setAttribute(
          "data-original-font-size",
          `${currentScale}px`
        );
      }
    }
  }, [open]);

  useEffect(() => {
    if (user && open) {
      // In a real app, this would fetch the complete user profile
      // For now, use what we have in the auth context
      const fetchUserSettings = async () => {
        try {
          // setLoading(true) // setLoading is not defined
          // This would be an API call in a real app
          // const { data } = await axios.get("/api/users/settings")

          // For now, we'll use default settings
          // In a real app, these would come from the API
          setPrivacySettings({
            allowTagging: true,
            showOnlineStatus: true,
            showReadReceipts: true,
          });

          setNotificationsEnabled(true);

          setAccountSettings({
            username: user.username,
            email: user.email || "", // Add email to the auth context if not already there
            bio: user.bio || "",
          });

          // Reset security settings when dialog opens
          setSecuritySettings({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          });

          // Clear any previous errors
          setErrors({});

          // Email notification preferences
          // These would also come from the API in a real app
        } catch (error) {
          console.error("Error fetching user settings:", error);
        } finally {
          // setLoading(false) // setLoading is not defined
        }
      };

      fetchUserSettings();
    }
  }, [user, open]);

  // Add save settings function
  const handleSaveSettings = async (section: string) => {
    setIsSaving(true);
    setIsUpdatingSettings(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Apply settings based on section
      if (section === "appearance") {
        // Apply theme change
        setTheme(darkModePreference);

        // Apply font scaling
        const htmlElement = document.documentElement;
        const originalSize = Number.parseFloat(
          htmlElement.getAttribute("data-original-font-size") || "16px"
        );
        const newSize = originalSize * fontScale[0];
        htmlElement.style.fontSize = `${newSize}px`;

        // Store the setting in localStorage for persistence
        localStorage.setItem("fontScale", fontScale[0].toString());
      }

      if (section === "account") {
        // In a real app, we would update the user profile on the server
        try {
          const { data } = await axios.put("/api/users/me", accountSettings);
          if (data.success) {
            // Update the user in the auth context
            if (user) {
              updateUser({
                ...user,
                username: accountSettings.username,
                bio: accountSettings.bio,
              });
            }
          }
        } catch (error) {
          console.error("Error updating account settings:", error);
        }
      }

      if (section === "privacy") {
        // In a real app, we would update the user settings on the server
        try {
          // This would be an API call in a real app
          // await axios.put("/api/users/settings/privacy", privacySettings)

          // For now, we'll just log the settings
          console.log("Privacy settings updated:", privacySettings);

          // Emit socket event to update online status visibility if it changed
          const socket = window.socket;
          if (socket) {
            socket.emit("updateSettings", {
              showOnlineStatus: privacySettings.showOnlineStatus,
              showReadReceipts: privacySettings.showReadReceipts,
            });
          }
        } catch (error) {
          console.error("Error updating privacy settings:", error);
        }
      }

      if (section === "security") {
        // Validate passwords
        if (securitySettings.newPassword !== securitySettings.confirmPassword) {
          setErrors({ confirmPassword: "Passwords do not match" });
          throw new Error("Passwords do not match");
        }

        if (securitySettings.newPassword.length < 6) {
          setErrors({ newPassword: "Password must be at least 6 characters" });
          throw new Error("Password too short");
        }

        try {
          // Call API to change password
          const { data } = await axios.put("/api/users/change-password", {
            currentPassword: securitySettings.currentPassword,
            newPassword: securitySettings.newPassword,
          });

          if (data.success) {
            // Reset form
            setSecuritySettings({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });

            toast({
              title: "Success",
              description: "Your password has been updated successfully",
            });
          }
        } catch (error: any) {
          console.error("Error changing password:", error);

          // Handle specific error messages from the server
          if (error.response?.data?.message) {
            if (error.response.data.message.includes("current password")) {
              setErrors({ currentPassword: error.response.data.message });
            } else {
              setErrors({ general: error.response.data.message });
            }
          } else {
            setErrors({
              general: "Failed to update password. Please try again.",
            });
          }

          throw error;
        }
      }

      // Update success state for the specific section
      setSaveSuccess((prev) => ({ ...prev, [section]: true }));

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [section]: false }));
      }, 3000);
    } catch (error) {
      console.error(`Error saving ${section} settings:`, error);
    } finally {
      setIsSaving(false);
      setIsUpdatingSettings(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    // Validate confirmation text
    if (deleteConfirmText !== user?.username) {
      toast({
        title: "Error",
        description: "Please type your username correctly to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      // Call API to delete account
      const { data } = await axios.delete("/api/users/me");

      if (data.success) {
        // Close dialogs
        setDeleteConfirmOpen(false);
        onOpenChange(false);

        // Show success message
        toast({
          title: "Account deleted",
          description: "Your account has been permanently deleted",
        });

        // Log the user out and redirect to home page
        logout();
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Load saved font scale on component mount
  useEffect(() => {
    const savedFontScale = localStorage.getItem("fontScale");
    if (savedFontScale) {
      setFontScale([Number.parseFloat(savedFontScale)]);
    }
  }, []);

  return (
    <>
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
              <TabsTrigger
                value="appearance"
                className="flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Appearance</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Privacy</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
            </TabsList>

            {/* Account Settings */}
            <TabsContent value="account" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={accountSettings.username}
                  onChange={(e) =>
                    setAccountSettings({
                      ...accountSettings,
                      username: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={accountSettings.email}
                  onChange={(e) =>
                    setAccountSettings({
                      ...accountSettings,
                      email: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={accountSettings.bio}
                  onChange={(e) =>
                    setAccountSettings({
                      ...accountSettings,
                      bio: e.target.value,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end items-center gap-3">
                {saveSuccess.account && (
                  <span className="text-sm text-green-500">
                    Settings saved successfully!
                  </span>
                )}
                <Button
                  onClick={() => handleSaveSettings("account")}
                  disabled={isSaving}
                >
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
                  <span className="text-sm text-muted-foreground">
                    {fontScale[0]}x
                  </span>
                </div>
                <Slider
                  id="font-scale"
                  min={0.8}
                  max={1.4}
                  step={0.1}
                  value={fontScale}
                  onValueChange={setFontScale}
                />
              </div>

              <div className="pt-4 flex justify-end items-center gap-3">
                {saveSuccess.appearance && (
                  <span className="text-sm text-green-500">
                    Settings saved successfully!
                  </span>
                )}
                <Button
                  onClick={() => handleSaveSettings("appearance")}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>

            {/* Privacy Settings */}
            <TabsContent value="privacy" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-tagging">Allow Tagging</Label>
                  <div className="text-sm text-muted-foreground">
                    Let others tag you in their posts
                  </div>
                </div>
                <Switch
                  id="allow-tagging"
                  checked={privacySettings.allowTagging}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({
                      ...privacySettings,
                      allowTagging: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="online-status">Show Online Status</Label>
                  <div className="text-sm text-muted-foreground">
                    Let others see when you're active
                  </div>
                </div>
                <Switch
                  id="online-status"
                  checked={privacySettings.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showOnlineStatus: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="read-receipts">Show Read Receipts</Label>
                  <div className="text-sm text-muted-foreground">
                    Let others know when you've read their messages
                  </div>
                </div>
                <Switch
                  id="read-receipts"
                  checked={privacySettings.showReadReceipts}
                  onCheckedChange={(checked) =>
                    setPrivacySettings({
                      ...privacySettings,
                      showReadReceipts: checked,
                    })
                  }
                />
              </div>

              <div className="pt-4 flex justify-end items-center gap-3">
                {saveSuccess.privacy && (
                  <span className="text-sm text-green-500">
                    Settings saved successfully!
                  </span>
                )}
                <Button
                  onClick={() => handleSaveSettings("privacy")}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-4">
              <div className="space-y-4 border-b pb-6">
                <h3 className="text-lg font-medium">Change Password</h3>

                {errors.general && (
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {errors.general}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={securitySettings.currentPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        currentPassword: e.target.value,
                      })
                    }
                    className={
                      errors.currentPassword ? "border-destructive" : ""
                    }
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-destructive">
                      {errors.currentPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={securitySettings.newPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        newPassword: e.target.value,
                      })
                    }
                    className={errors.newPassword ? "border-destructive" : ""}
                  />
                  {errors.newPassword && (
                    <p className="text-sm text-destructive">
                      {errors.newPassword}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={securitySettings.confirmPassword}
                    onChange={(e) =>
                      setSecuritySettings({
                        ...securitySettings,
                        confirmPassword: e.target.value,
                      })
                    }
                    className={
                      errors.confirmPassword ? "border-destructive" : ""
                    }
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div className="flex justify-end items-center gap-3">
                  {saveSuccess.security && (
                    <span className="text-sm text-green-500">
                      Password updated successfully!
                    </span>
                  )}
                  <Button
                    onClick={() => handleSaveSettings("security")}
                    disabled={
                      isSaving ||
                      !securitySettings.currentPassword ||
                      !securitySettings.newPassword ||
                      !securitySettings.confirmPassword
                    }
                  >
                    {isSaving ? "Updating..." : "Update Password"}
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <h3 className="text-lg font-medium text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. This
                  action is permanent and will remove all your data.
                </p>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirm-delete">
                Please type <span className="font-bold">{user?.username}</span>{" "}
                to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={user?.username}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmText !== user?.username}
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
