"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Users, Settings, AlertTriangle, FileImage, Download } from "lucide-react"

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
  },
  {
    title: "Posts",
    href: "/admin/posts",
    icon: <FileImage className="h-5 w-5" />,
  },
  {
    title: "Moderation",
    href: "/admin/moderation",
    icon: <AlertTriangle className="h-5 w-5" />,
  },
  {
    title: "Downloads",
    href: "/admin/download",
    icon: <Download className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: <Settings className="h-5 w-5" />,
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col gap-2">
      {sidebarItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-accent ${
            pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground"
          }`}
        >
          {item.icon}
          <span>{item.title}</span>
        </Link>
      ))}
    </div>
  )
}
