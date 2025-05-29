"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProfileContent from "./profile-content";
import { Loader2 } from "lucide-react";

function ProfileUI() {
  // This is a dedicated wrapper just to handle the useSearchParams
  // Moving this hook to its own component correctly isolates it
  const searchParams = useSearchParams();
  
  // Pass any search params needed to the main content component
  const tab = searchParams?.get("tab") || "profile";
  
  return <ProfileContent defaultTab={tab} />;
}

export default function ProfileContentWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      }
    >
      <ProfileUI />
    </Suspense>
  );
}
