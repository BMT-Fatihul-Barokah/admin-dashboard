"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function NavigationProgress() {
  const pathname = usePathname();

  useEffect(() => {
    // Simple navigation indicator
    const startProgress = () => {
      const progressBar = document.getElementById("navigation-progress");
      if (progressBar) {
        progressBar.style.width = "100%";
        progressBar.style.opacity = "1";
      }
    };

    const finishProgress = () => {
      const progressBar = document.getElementById("navigation-progress");
      if (progressBar) {
        progressBar.style.width = "0%";
        progressBar.style.opacity = "0";
      }
    };

    finishProgress();
    return () => startProgress();
  }, [pathname]);

  return (
    <div
      id="navigation-progress"
      className="fixed top-0 left-0 h-1 bg-primary transition-all duration-300 ease-in-out opacity-0 w-0"
    />
  );
}
