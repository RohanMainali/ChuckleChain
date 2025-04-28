"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"

interface MobileContextProps {
  isMobile: boolean
  setupSwipeNavigation: (onMenuToggle: (open: boolean) => void, sidebarOpen: boolean) => (() => void) | undefined
}

const MobileContext = createContext<MobileContextProps>({
  isMobile: false,
  setupSwipeNavigation: () => undefined,
})

export const MobileProvider = ({ children }: { children: ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkIsMobile()
    window.addEventListener("resize", checkIsMobile)

    return () => window.removeEventListener("resize", checkIsMobile)
  }, [])

  const setupSwipeNavigation = (onMenuToggle: (open: boolean) => void, sidebarOpen: boolean) => {
    if (typeof window === "undefined") return undefined

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].clientX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 100
      const swipeDistance = touchEndX - touchStartX

      if (swipeDistance > swipeThreshold) {
        onMenuToggle(true)
      }
    }

    document.addEventListener("touchstart", handleTouchStart, false)
    document.addEventListener("touchend", handleTouchEnd, false)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }

  return <MobileContext.Provider value={{ isMobile, setupSwipeNavigation }}>{children}</MobileContext.Provider>
}

export const useMobile = () => {
  return useContext(MobileContext)
}

