"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Download, RefreshCcw } from "lucide-react"
import { PermissionGuard } from "@/components/permission-guard"
import { RoleBasedButton } from "@/components/role-based-button"

/**
 * Example component showing how to implement role-based UI elements
 * This demonstrates the proper way to hide or disable UI elements based on user permissions
 */
export function ApprovalsExample() {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mock data for demonstration
  const customer = {
    id: "1",
    name: "John Doe",
    submission_id: "SUB-123",
    noIdentitas: "1234567890",
    noTelepon: "+62812345678",
    created_at: "2025-05-01T12:00:00Z"
  };
  
  // Mock functions for demonstration
  const approveCustomer = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1000);
  };
  
  const rejectCustomer = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 1000);
  };
  
  const exportData = () => {
    console.log("Exporting data...");
  };
  
  const refreshData = () => {
    console.log("Refreshing data...");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Role-Based UI Implementation Example</h2>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">1. Action Buttons</h3>
        <p className="text-muted-foreground">
          These buttons are only shown to users with the appropriate permissions.
          Users without permissions will see disabled buttons with tooltips.
        </p>
        
        <div className="flex gap-2">
          {/* Refresh button - always visible to everyone */}
          <Button variant="outline" size="icon" onClick={refreshData}>
            <RefreshCcw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
          
          {/* Export button - only visible to users with generate_reports permission */}
          <RoleBasedButton 
            permission="generate_reports"
            variant="outline" 
            size="icon" 
            onClick={exportData}
            showDisabled={true}
            disabledTooltip="Anda tidak memiliki izin untuk mengekspor data"
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Export</span>
          </RoleBasedButton>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">2. Customer Approval Card</h3>
        <p className="text-muted-foreground">
          This card shows approval/rejection buttons only to users with the appropriate permissions.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription>ID: {customer.submission_id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">No. Identitas:</span>
              <span className="text-sm font-medium">{customer.noIdentitas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Telepon:</span>
              <span className="text-sm font-medium">{customer.noTelepon}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge variant="outline">Menunggu</Badge>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Lihat Detail</Button>
            <div className="flex gap-2">
              {/* Reject button - only visible to users with reject_customers permission */}
              <PermissionGuard 
                permission="reject_customers"
                fallback={
                  <Button 
                    variant="destructive" 
                    size="icon"
                    disabled={true}
                    title="Anda tidak memiliki izin untuk menolak nasabah"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                }
              >
                <Button 
                  variant="destructive" 
                  size="icon"
                  disabled={isProcessing}
                  onClick={rejectCustomer}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </PermissionGuard>
              
              {/* Approve button - only visible to users with approve_customers permission */}
              <PermissionGuard 
                permission="approve_customers"
                fallback={
                  <Button 
                    variant="default" 
                    size="icon" 
                    className="bg-green-500 hover:bg-green-600"
                    disabled={true}
                    title="Anda tidak memiliki izin untuk menyetujui nasabah"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                }
              >
                <Button 
                  variant="default" 
                  size="icon" 
                  className="bg-green-500 hover:bg-green-600"
                  disabled={isProcessing}
                  onClick={approveCustomer}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </PermissionGuard>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">3. Completely Hidden Elements</h3>
        <p className="text-muted-foreground">
          These elements are completely hidden from users without the appropriate permissions.
        </p>
        
        <PermissionGuard permission="manage_roles">
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium">Role Management Section</h4>
            <p className="text-sm text-muted-foreground">
              This entire section is only visible to users with the manage_roles permission.
            </p>
            <Button className="mt-2" variant="outline">Manage Roles</Button>
          </div>
        </PermissionGuard>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">4. Multiple Permission Check</h3>
        <p className="text-muted-foreground">
          This element is visible if the user has ANY of the specified permissions.
        </p>
        
        <PermissionGuard anyPermission={["approve_loans", "reject_loans"]}>
          <div className="p-4 border rounded-md bg-muted/20">
            <h4 className="font-medium">Loan Management Section</h4>
            <p className="text-sm text-muted-foreground">
              This section is visible to users with either approve_loans OR reject_loans permissions.
            </p>
            <div className="flex gap-2 mt-2">
              <RoleBasedButton permission="approve_loans" variant="default">
                Approve Loan
              </RoleBasedButton>
              <RoleBasedButton permission="reject_loans" variant="outline">
                Reject Loan
              </RoleBasedButton>
            </div>
          </div>
        </PermissionGuard>
      </div>
    </div>
  )
}
