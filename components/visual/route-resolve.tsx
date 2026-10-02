"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function RouteResolve({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="route-resolve">
      {children}
    </div>
  );
}
