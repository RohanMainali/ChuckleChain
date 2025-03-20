"use client";

import type React from "react";
import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { useRouter, usePathname } from "next/navigation";

const MobileContext = createContext({
  isMobile: false,
  setupSwipeNavigation: (
    onMenuToggle: (open: boolean) => void,
    sidebarOpen: boolean
  ) => {},
});

export function useMobile() {
  return useContext(MobileContext);
}

export function MobileProvider({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpenInternal, setSidebarOpenInternal] = useState(false); // Internal state for sidebarOpen

  useEffect(() => {
    // Function to check if viewport is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up event listener
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const setupSwipeNavigation = useCallback(
    (onMenuToggle: (open: boolean) => void, sidebarOpen: boolean) => {
      if (!isMobile) return;

      let touchStartX = 0;
      let touchEndX = 0;

      const handleTouchStart = (e: TouchEvent) => {
        touchStartX = e.touches[0].clientX;
      };

      const handleTouchEnd = (e: TouchEvent) => {
        touchEndX = e.changedTouches[0].clientX;
        handleSwipe();
      };

      const handleSwipe = () => {
        const currentPath = pathname || "";

        // When in feed: right swipe opens menu, left swipe opens messages
        if (currentPath.includes("/feed")) {
          // Right to left swipe (open messages)
          if (touchStartX - touchEndX > 100) {
            router.push("/messages");
          }
          // Left to right swipe (open sidebar)
          if (touchEndX - touchStartX > 100) {
            onMenuToggle(true);
          }
        }
        // When in messages: right swipe goes back to feed
        else if (currentPath.includes("/messages")) {
          // Left to right swipe (go back to feed)
          if (touchEndX - touchStartX > 100) {
            router.push("/feed");
          }
        }
        // When in sidebar/menu: left swipe goes back to feed
        else if (sidebarOpen) {
          // Right to left swipe (go back to feed)
          if (touchStartX - touchEndX > 100) {
            onMenuToggle(false);
            router.push("/feed");
          }
        }
      };

      document.addEventListener("touchstart", handleTouchStart, false);
      document.addEventListener("touchend", handleTouchEnd, false);

      return () => {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    },
    [isMobile, router, pathname]
  );

  useEffect(() => {
    // This useEffect now only handles the event listeners setup and teardown
    if (isMobile) {
      // Dummy onMenuToggle function to satisfy the type definition
      const dummyOnMenuToggle = (open: boolean) => {
        setSidebarOpenInternal(open); // Update internal state
      };

      const cleanup = setupSwipeNavigation(
        dummyOnMenuToggle,
        sidebarOpenInternal
      );

      return () => {
        if (cleanup && typeof cleanup === "function") {
          cleanup();
        }
      };
    }
  }, [isMobile, router, pathname, setupSwipeNavigation, sidebarOpenInternal]);

  return (
    <MobileContext.Provider value={{ isMobile, setupSwipeNavigation }}>
      {children}
    </MobileContext.Provider>
  );
}
