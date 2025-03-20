"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Navbar } from "@/components/navbar";
import { Sidebar } from "@/components/sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { MobileRightSidebar } from "@/components/mobile-right-sidebar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const { isMobile } = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false);
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !user) {
      router.push("/");
    }
  }, [user, isLoading, router]);

  // Handle body class for mobile menu open state
  useEffect(() => {
    if (isMobile) {
      if (sidebarOpen || mobileRightSidebarOpen) {
        document.body.classList.add("overflow-hidden");
      } else {
        document.body.classList.remove("overflow-hidden");
      }
    }

    return () => {
      document.body.classList.remove("overflow-hidden");
    };
  }, [sidebarOpen, mobileRightSidebarOpen, isMobile]);

  useEffect(() => {
    if (isMobile) {
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
        const swipeThreshold = 100;
        const swipeDistance = touchEndX - touchStartX;

        // Swipe right to open menu (works on all pages)
        if (swipeDistance > swipeThreshold) {
          setIsSidebarOpen(true);
        }
        // Swipe left to open messages (only on feed page)
        else if (swipeDistance < -swipeThreshold && pathname === "/feed") {
          router.push("/messages");
        }
      };

      document.addEventListener("touchstart", handleTouchStart, false);
      document.addEventListener("touchend", handleTouchEnd, false);

      return () => {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isMobile, router, pathname, setIsSidebarOpen]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="flex h-screen flex-col">
      <Navbar
        onMenuToggle={setSidebarOpen}
        sidebarOpen={sidebarOpen}
        onRightSidebarToggle={setMobileRightSidebarOpen}
        rightSidebarOpen={mobileRightSidebarOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 animate-fade-in">
          {children}
        </main>
        {!isMobile ? (
          <RightSidebar />
        ) : (
          <MobileRightSidebar
            open={mobileRightSidebarOpen}
            onOpenChange={setMobileRightSidebarOpen}
          />
        )}
      </div>
    </div>
  );
}
