"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Flame,
  Hash,
  Laugh,
  Layers,
  Music,
  PanelLeft,
  Popcorn,
  Rocket,
  Shirt,
  Sparkles,
  Trophy,
  Tv2,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

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

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg md:hidden transition-all duration-300 hover:scale-110"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4 animate-spin-slow" /> : <PanelLeft className="h-4 w-4 animate-pulse" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-full flex-col">
          <div className="p-4">
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Discover</h2>
            <div className="space-y-1">
              <Link href="/feed">
                <Button
                  variant={pathname === "/feed" ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  For You
                </Button>
              </Link>
              <Link href="/trending">
                <Button
                  variant={pathname === "/trending" ? "secondary" : "ghost"}
                  className="w-full justify-start transition-all duration-300 hover:translate-x-1"
                >
                  <Flame className="mr-2 h-4 w-4" />
                  Trending
                </Button>
              </Link>
              <Link href="/fresh">
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
                    <Link key={category.name} href={category.href}>
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
                    <Link key={hashtag} href={`/hashtag/${hashtag.substring(1)}`}>
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

