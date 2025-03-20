"use client";

import React from "react";

import { useState, useRef, type ChangeEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, X, AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import type { Post } from "@/lib/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

// Categories for memes
const categories = [
  { name: "Entertainment", value: "entertainment" },
  { name: "Sports", value: "sports" },
  { name: "Gaming", value: "gaming" },
  { name: "Technology", value: "technology" },
  { name: "Fashion", value: "fashion" },
  { name: "Music", value: "music" },
  { name: "TV Shows", value: "tv" },
  { name: "Other", value: "other" },
];

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [textPosition, setTextPosition] = useState<"top" | "bottom">("top");
  const [captionPlacement, setCaptionPlacement] = useState<
    "on-image" | "whitespace"
  >("on-image");
  const isMobile = useMediaQuery("(max-width: 768px)");

  // User tagging state
  const [taggedUsers, setTaggedUsers] = useState<
    Array<{ id: string; username: string }>
  >([]);
  const [searchUsers, setSearchUsers] = useState<
    Array<{ id: string; username: string; profilePicture: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showTagPopover, setShowTagPopover] = useState(false);

  // Mobile optimization for the create post component
  // Adjust textarea size for mobile screens
  const textareaStyle = isMobile
    ? "min-h-[100px] resize-none border-none p-0 focus-visible:ring-0 text-base"
    : "min-h-[120px] resize-none border-none p-0 focus-visible:ring-0";

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
    if (error) setError(null);

    // Check for @ symbol to trigger user search
    const lastAtSymbol = e.target.value.lastIndexOf("@");
    if (lastAtSymbol !== -1) {
      const afterAt = e.target.value.substring(lastAtSymbol + 1);
      const spaceAfterAt = afterAt.indexOf(" ");
      const searchTerm =
        spaceAfterAt === -1 ? afterAt : afterAt.substring(0, spaceAfterAt);

      if (searchTerm.length > 0) {
        searchForUsers(searchTerm);
      }
    }
  };

  const searchForUsers = async (query: string) => {
    if (query.length < 2) return;

    try {
      const { data } = await axios.get(
        `/api/users/search?q=${encodeURIComponent(query)}`
      );
      if (data.success) {
        setSearchUsers(data.data);
      }
    } catch (error) {
      console.error("Error searching for users:", error);
    }
  };

  const handleTagUser = (selectedUser: { id: string; username: string }) => {
    // Check if user is already tagged
    if (!taggedUsers.some((user) => user.id === selectedUser.id)) {
      setTaggedUsers([...taggedUsers, selectedUser]);
    }
    setShowTagPopover(false);
  };

  const removeTaggedUser = (userId: string) => {
    setTaggedUsers(taggedUsers.filter((user) => user.id !== userId));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size should be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setImage(reader.result as string);
        if (error) setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = async () => {
    if (!caption) {
      setError("Please add a caption for your meme");
      return;
    }

    if (!image) {
      setError("Please add an image for your meme");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // First upload the image to Cloudinary
      const uploadResponse = await axios.post("/api/upload", { image });

      if (!uploadResponse.data.success) {
        throw new Error("Failed to upload image");
      }

      const imageUrl = uploadResponse.data.data.url;

      // Prepare meme text if needed
      let memeText;
      if (captionPlacement === "on-image") {
        memeText = {
          id: uuidv4(),
          text: caption,
          x: 50,
          y: textPosition === "top" ? 10 : 85, // Adjusted bottom position to prevent overflow
          fontSize: 24, // Reduced font size to prevent overflow
          fontFamily: "Impact, sans-serif",
          color: "#FFFFFF",
          backgroundColor: "transparent",
          textAlign: "center",
          bold: false,
          italic: false,
          underline: false,
          uppercase: true,
          outline: true,
        };
      }

      // Create the post with the Cloudinary image URL
      const postData = {
        text: caption,
        image: imageUrl,
        category: category || undefined,
        memeTexts: captionPlacement === "on-image" ? [memeText] : undefined,
        captionPlacement: captionPlacement,
        taggedUsers: taggedUsers.map((user) => user.id),
      };

      const { data } = await axios.post("/api/posts", postData);

      if (data.success) {
        onPostCreated(data.data);
        setCaption("");
        setImage(null);
        setCategory(null);
        setTaggedUsers([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex gap-3">
          <Avatar>
            <AvatarImage src={user?.profilePicture} alt={user?.username} />
            <AvatarFallback>
              {user?.username.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind? (Press Enter for new lines)"
              value={caption}
              onChange={handleCaptionChange}
              className={textareaStyle}
              rows={isMobile ? 3 : 4}
            />

            {/* Tagged users display */}
            {taggedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {taggedUsers.map((taggedUser) => (
                  <Badge
                    key={taggedUser.id}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    @{taggedUser.username}
                    <button
                      onClick={() => removeTaggedUser(taggedUser.id)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {image && (
              <div className="mt-4 animate-fade-in">
                <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-2 z-50 rounded-full bg-background/80 shadow-md"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>

                    <div className="relative w-full max-w-full overflow-hidden">
                      {/* Add responsive classes */}
                      {captionPlacement === "whitespace" ? (
                        <div className="flex flex-col overflow-hidden rounded-md">
                          <div className="bg-white p-3 text-center border-b">
                            <div
                              className="text-black uppercase tracking-wide"
                              style={{
                                fontFamily: "'Impact', sans-serif",
                                fontWeight: "600", // Less bold than before
                                fontSize: "18px", // Controlled font size
                                letterSpacing: "0.5px", // Better letter spacing
                              }}
                            >
                              {caption || "ADD YOUR CAPTION HERE"}
                            </div>
                          </div>
                          <img
                            src={
                              image || "/placeholder.svg?height=400&width=600"
                            }
                            alt="Meme template"
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <>
                          <img
                            src={
                              image || "/placeholder.svg?height=400&width=600"
                            }
                            alt="Meme template"
                            className="w-full rounded-md"
                          />
                          <div
                            className="absolute left-1/2 transform -translate-x-1/2 text-center select-none px-2 py-1 w-[90%]"
                            style={{
                              top: textPosition === "top" ? "10%" : "85%", // Adjusted bottom position to prevent overflow
                              fontFamily: "Impact, sans-serif",
                              fontSize: "24px", // Reduced font size to prevent overflow
                              lineHeight: "1.2", // Added line height for better readability
                              color: "#FFFFFF",
                              textTransform: "uppercase",
                              textShadow:
                                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000", // Stronger text shadow
                              wordWrap: "break-word",
                              transform: "translate(-50%, -50%)",
                              whiteSpace: "pre-line", // This preserves line breaks
                              position: "absolute", // Ensure absolute positioning
                              zIndex: 10, // Make sure text is above the image
                              maxHeight: "80%", // Limit height to prevent overflow
                              overflow: "hidden", // Hide overflow text
                            }}
                          >
                            {caption
                              ? caption.split("\n").map((line, i) => (
                                  <React.Fragment key={i}>
                                    {i > 0 && <br />}
                                    {line ||
                                      (textPosition === "top"
                                        ? "TOP TEXT"
                                        : "BOTTOM TEXT")}
                                  </React.Fragment>
                                ))
                              : textPosition === "top"
                              ? "TOP TEXT"
                              : "BOTTOM TEXT"}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stack controls vertically on mobile */}
                  <div
                    className={`${
                      isMobile
                        ? "grid grid-cols-1 gap-2"
                        : "flex flex-col gap-4"
                    }`}
                  >
                    {/* Caption placement control */}
                    <div className="border rounded-md p-4">
                      <Label className="mb-2 block">Caption Style</Label>
                      <RadioGroup
                        value={captionPlacement}
                        onValueChange={(value) =>
                          setCaptionPlacement(
                            value as "on-image" | "whitespace"
                          )
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="on-image" id="on-image" />
                          <Label htmlFor="on-image">Overlay Text</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="whitespace" id="whitespace" />
                          <Label htmlFor="whitespace">White Header</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Only show text position control when caption is on the image */}
                    {captionPlacement === "on-image" && (
                      <div className="border rounded-md p-4">
                        <Label className="mb-2 block">Text Position</Label>
                        <RadioGroup
                          value={textPosition}
                          onValueChange={(value) =>
                            setTextPosition(value as "top" | "bottom")
                          }
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="top" id="top" />
                            <Label htmlFor="top">Top</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="bottom" id="bottom" />
                            <Label htmlFor="bottom">Bottom</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    )}
                  </div>

                  {/* Category selection */}
                  <div className="mt-4">
                    <Label htmlFor="category">Category (optional)</Label>
                    <Select value={category || ""} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {error && (
                  <Alert
                    variant="destructive"
                    className="mt-3 animate-slide-up"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-3 animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-3">
        <div className="flex gap-4">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <Button
            variant="ghost"
            size="icon"
            className="mobile-touch-target"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>

          {/* Tag User Button */}
          <Popover open={showTagPopover} onOpenChange={setShowTagPopover}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="mobile-touch-target"
              >
                <UserPlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start" side="top">
              <Command>
                <CommandInput
                  placeholder="Search for users to tag..."
                  onValueChange={searchForUsers}
                />
                <CommandList>
                  <CommandEmpty>No users found</CommandEmpty>
                  <CommandGroup>
                    {searchUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={user.username}
                        onSelect={() =>
                          handleTagUser({
                            id: user.id,
                            username: user.username,
                          })
                        }
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={user.profilePicture}
                            alt={user.username}
                          />
                          <AvatarFallback>
                            {user.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>@{user.username}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <Button
          onClick={handleCreatePost}
          disabled={isCreating}
          className="transition-all duration-300 hover:scale-105 bg-primary text-primary-foreground"
        >
          {isCreating ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
          ) : (
            "Post Meme"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
