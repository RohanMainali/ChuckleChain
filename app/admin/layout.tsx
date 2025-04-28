import type { Metadata } from "next"
import ClientLayout from "./clientLayout"
import type React from "react"
import "./admin.css"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "ChuckleChain Admin Dashboard",
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout children={children} />
}
