"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type BreadcrumbTitle = { pathname: string; label: string } | null;

const BreadcrumbContext = createContext<{
  title: BreadcrumbTitle;
  setTitle: (title: BreadcrumbTitle) => void;
} | null>(null);

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<BreadcrumbTitle>(null);
  return (
    <BreadcrumbContext.Provider value={{ title, setTitle }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbTitle() {
  const context = useContext(BreadcrumbContext);
  if (!context) throw new Error("BreadcrumbProvider is required");
  return context;
}
