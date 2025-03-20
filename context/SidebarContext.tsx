"use client";

import type React from "react";
import { createContext, useState, useContext } from "react";

interface SidebarContextProps {
  sidebarOpen: boolean;
  onMenuToggle: ((open: boolean) => void) | undefined;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const onMenuToggle = (open: boolean) => {
    setSidebarOpen(open);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, onMenuToggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export { SidebarContext };
