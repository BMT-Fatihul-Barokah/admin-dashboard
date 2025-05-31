"use client";

import { useEffect, useState } from "react";
import { getAdminSession } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a session
    const session = getAdminSession();
    setSessionData(session);
    setIsLoading(false);
    
    // Log the session to console for debugging
    console.log("Current session:", session);
  }, []);

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading session data...</p>
          ) : sessionData ? (
            <div>
              <p className="text-green-600 font-bold">✅ Authenticated</p>
              <pre className="bg-gray-100 p-4 rounded mt-4 overflow-auto max-h-96">
                {JSON.stringify(sessionData, null, 2)}
              </pre>
            </div>
          ) : (
            <p className="text-red-600 font-bold">❌ Not authenticated</p>
          )}
          
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Debug Actions:</h3>
            <div className="space-x-4">
              <button 
                onClick={() => window.location.href = '/admin/login'} 
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Go to Login
              </button>
              <button 
                onClick={() => window.location.href = '/admin'} 
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Go to Dashboard
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('adminSession');
                  window.location.reload();
                }} 
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Clear Session
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
