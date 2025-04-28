"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Flame, Hash, Laugh, Layers, Music, Popcorn, Rocket, Shirt, Sparkles, Trophy, Tv2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/use-mobile"

type Category = {
  name: string
  icon: React.ElementType
  href: string
}

const categories: Category[] = [
  { name: "Entertainment", icon: Popcorn, href: "/category/entertainment" },
  { name: "Sports", icon: Trophy, href: "/category/sports" },
  { name: "Gaming", icon: Layers, href: "/category/gaming" },
  { name: "Technology", icon: Rocket, href: "/category/technology" },
  { name: "Fashion", icon: Shirt, href: "/category/fashion" },
  { name: "Music", icon: Music, href: "/category/music" },
  { name: "TV Shows", icon: Tv2, href: "/category/tv" },
]

const trendingHashtags = [
  "#MemeMonday",
  "#FunnyFriday",
  "#DadJokes",
  "#CatMemes",
  "#WorkFromHome",
  "#ProgrammerHumor",
  "#RelationshipMemes",
  "#GamingLife",
]

interface SidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function Sidebar({ open, onOpenChange }: SidebarProps) {
  const pathname = usePathname()
  const { isMobile } = useMobile()

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile) {
      onOpenChange(false)
    }
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobile && open && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => onOpenChange(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          {isMobile && (
            <div className="flex justify-end p-4">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="p-4">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Discover</h2>
            <div className="space-y-1">
              <Link href="/feed" onClick={handleLinkClick}>
                <Button
                  variant={pathname === "/feed" ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  For You
                </Button>
              </Link>
              <Link href="/trending" onClick={handleLinkClick}>
                <Button
                  variant={pathname === "/trending" ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  Trending
                </Button>
              </Link>
              <Link href="/fresh" onClick={handleLinkClick}>
                <Button
                  variant={pathname === "/fresh" ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                >
                  <Laugh className="mr-2 h-4 w-4" />
                  Fresh Memes
                </Button>
              </Link>
            </div>
          </div>

          <ScrollArea className="flex-1 px-4">
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Categories</h2>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <Link key={category.name} href={category.href} onClick={handleLinkClick}>
                      <Button
                        variant={pathname === category.href ? "secondary" : "ghost"}
                        className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                      >
                        <category.icon className="mr-2 h-4 w-4" />
                        {category.name}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Trending Hashtags</h2>
                <div className="space-y-1">
                  {trendingHashtags.map((hashtag) => (
                    <Link key={hashtag} href={`/hashtag/${hashtag.substring(1)}`} onClick={handleLinkClick}>
                      <Button
                        variant="ghost"
                        className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                      >
                        <Hash className="mr-2 h-4 w-4" />
                        {hashtag}
                      </Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}
