"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageLoadingSkeletonProps {
  className?: string;
  variant?: "default" | "minimal";
}

export function PageLoadingSkeleton({
  className,
  variant = "default",
}: PageLoadingSkeletonProps) {
  if (variant === "minimal") {
    return (
      <div className={cn("flex justify-center items-center py-8", className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-6 p-8", className)}>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
      </div>
      
      {/* Filter/search bar skeleton */}
      <div className="flex flex-wrap gap-4">
        <div className="h-10 w-64 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-10 w-32 rounded-md bg-muted animate-pulse" />
      </div>
      
      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="h-12 border-b bg-muted/20 px-4 flex items-center">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-24 rounded bg-muted animate-pulse mr-8" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 border-b px-4 flex items-center">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="h-4 w-24 rounded bg-muted animate-pulse mr-8" />
            ))}
          </div>
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
