"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [prevPathname, setPrevPathname] = useState("");

  useEffect(() => {
    // Store the current pathname
    if (pathname !== prevPathname) {
      setPrevPathname(pathname);
      
      // Start navigation progress
      setIsNavigating(true);
      setProgress(0);
      
      // Simulate progress
      const timer1 = setTimeout(() => setProgress(30), 50);
      const timer2 = setTimeout(() => setProgress(60), 150);
      const timer3 = setTimeout(() => setProgress(80), 300);
      const timer4 = setTimeout(() => {
        setProgress(100);
        const completeTimer = setTimeout(() => {
          setIsNavigating(false);
        }, 200); // Keep it visible briefly after completion
        return () => clearTimeout(completeTimer);
      }, 500);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [pathname, searchParams, prevPathname]);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-1 z-50 transition-all duration-300",
        isNavigating ? "opacity-100" : "opacity-0"
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
