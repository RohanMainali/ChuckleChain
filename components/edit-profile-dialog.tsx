"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/lib/types";
import { ImageIcon } from "lucide-react";
import axios from "axios";
// import { toast } from "@/components/ui/use-toast"

interface EditProfileDialogProps {
  profile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (profile: Partial<UserProfile>) => void;
}

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
  onUpdate,
}: EditProfileDialogProps) {
  const [formData, setFormData] = useState({
    fullName: profile.fullName || "",
    bio: profile.bio || "",
    website: profile.website || "",
    profilePicture: profile.profilePicture,
  });

  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePictureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // Show an error if the file is too large
        alert("Profile picture size should be less than 5MB");
        return;
      }

      // Add a loading state message
      setIsUploading(true);
      // toast({
      //   title: "Uploading profile picture",
      //   description: "Your image will be cropped to a square format while maintaining quality",
      // })

      try {
        // Convert the file to a data URL
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
          const imageData = reader.result as string;

          // Upload the image to the server
          const uploadResponse = await axios.post("/api/upload", {
            image: imageData,
            preserveAspectRatio: true, // Signal to server to maintain aspect ratio
            isProfilePicture: true, // Explicitly mark as profile picture
          });

          if (uploadResponse.data.success) {
            // Update the form data with the new profile picture URL
            setFormData({
              ...formData,
              profilePicture: uploadResponse.data.data.url,
            });
          } else {
            alert("Failed to upload profile picture");
          }
          setIsUploading(false);
        };
      } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Error uploading profile picture");
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // In a real app, we would update the profile on the server
      await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
      onUpdate(formData);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] animate-slide-up">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>

          <div className="mt-4 flex flex-col items-center gap-4">
            <Avatar className="h-20 w-20 transition-all duration-300 hover:scale-105">
              <AvatarImage
                src={formData.profilePicture}
                alt={profile.username}
              />
              <AvatarFallback>
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleProfilePictureChange}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Change Photo
                </>
              )}
            </Button>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="transition-all duration-300 hover:scale-105"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent mr-2"></div>
              ) : null}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
