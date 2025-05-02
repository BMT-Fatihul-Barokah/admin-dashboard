"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getActivityLogs, ActivityLogType } from "@/lib/activity-logger";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RefreshCcw, Clock } from "lucide-react";

interface ActivityLogViewerProps {
  entityType?: string;
  entityId?: string;
  userId?: string;
  limit?: number;
  showTitle?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export function ActivityLogViewer({
  entityType,
  entityId,
  userId,
  limit = 5,
  showTitle = true,
  showRefresh = true,
  className = "",
}: ActivityLogViewerProps) {
  const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getActivityLogs({
        entityType,
        entityId,
        userId,
        limit
      });
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load activity logs on component mount
  useEffect(() => {
    fetchActivityLogs();
  }, [entityType, entityId, userId, limit]);

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: id });
    } catch (error) {
      return dateString;
    }
  };

  // Get action type badge color
  const getActionTypeColor = (actionType: string) => {
    switch (actionType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      case 'approve':
        return 'bg-emerald-100 text-emerald-800';
      case 'reject':
        return 'bg-amber-100 text-amber-800';
      case 'login':
        return 'bg-purple-100 text-purple-800';
      case 'logout':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'ketua':
        return 'bg-blue-100 text-blue-800';
      case 'sekretaris':
        return 'bg-green-100 text-green-800';
      case 'bendahara':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className={className}>
      {showTitle && (
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Riwayat Aktivitas</CardTitle>
              <CardDescription>
                {entityId 
                  ? `Aktivitas untuk ${entityType || 'entitas'} ini` 
                  : userId 
                    ? 'Aktivitas pengguna' 
                    : 'Aktivitas terbaru'}
              </CardDescription>
            </div>
            {showRefresh && (
              <Button variant="outline" size="sm" onClick={fetchActivityLogs}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : activityLogs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p>Belum ada aktivitas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Deskripsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{log.admin_users?.nama || 'Unknown'}</span>
                        <Badge variant="outline" className={`text-xs px-1 py-0 ${getRoleBadgeColor(log.admin_users?.role || '')}`}>
                          {log.admin_users?.role || 'Unknown'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getActionTypeColor(log.action_type)}`}>
                        {log.action_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {log.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
