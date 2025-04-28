"use client";

import { useState, useEffect } from "react";

export function useMediaQuery() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Function to check viewport size
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    // Initial check
    checkViewport();

    // Add event listener for window resize
    window.addEventListener("resize", checkViewport);

    // Clean up
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  return { isMobile, isTablet, isDesktop };
}
