"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { getActivityLogs, ActivityLogType } from "@/lib/activity-logger";
import { RoleProtected } from "@/components/role-protected";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Search, RefreshCcw, Download, Filter } from "lucide-react";

export default function ActivityLogsPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [activityLogs, setActivityLogs] = useState<ActivityLogType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  
  // Fetch activity logs
  const fetchActivityLogs = async () => {
    setIsLoading(true);
    try {
      const logs = await getActivityLogs({
        limit: 100
      });
      setActivityLogs(logs);
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat log aktivitas. Silakan coba lagi.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load activity logs on component mount
  useEffect(() => {
    fetchActivityLogs();
  }, []);
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm:ss', { locale: id });
    } catch (error) {
      return dateString;
    }
  };
  
  // Filter logs based on search query and filters
  const filteredLogs = activityLogs.filter(log => {
    const matchesSearch = 
      log.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesActionType = actionTypeFilter ? log.action_type === actionTypeFilter : true;
    const matchesEntityType = entityTypeFilter ? log.entity_type === entityTypeFilter : true;
    const matchesUser = userFilter ? log.user_id === userFilter : true;
    
    // Date filter logic
    let matchesDate = true;
    if (dateFilter) {
      const logDate = new Date(log.created_at).toISOString().split('T')[0];
      matchesDate = logDate === dateFilter;
    }
    
    return matchesSearch && matchesActionType && matchesEntityType && matchesUser && matchesDate;
  });
  
  // Get unique action types for filter
  const actionTypes = [...new Set(activityLogs.map(log => log.action_type))];
  
  // Get unique entity types for filter
  const entityTypes = [...new Set(activityLogs.map(log => log.entity_type))];
  
  // Get unique users for filter
  const users = [...new Set(activityLogs.map(log => ({ id: log.user_id, name: log.admin_users?.nama || 'Unknown' })))];
  
  // Export logs to CSV
  const exportLogs = () => {
    if (filteredLogs.length === 0) {
      toast({
        title: 'Info',
        description: 'Tidak ada data untuk diekspor',
        variant: 'default'
      });
      return;
    }
    
    // Prepare CSV data
    const headers = ['Tanggal', 'Pengguna', 'Tipe Aksi', 'Tipe Entitas', 'Deskripsi'];
    const csvData = [
      headers.join(','),
      ...filteredLogs.map(log => [
        formatDate(log.created_at),
        log.admin_users?.nama || 'Unknown',
        log.action_type,
        log.entity_type,
        `"${log.description?.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Berhasil',
      description: 'Data log aktivitas berhasil diekspor',
      variant: 'default'
    });
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
  
  return (
    <RoleProtected allowedRoles={['admin', 'ketua']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Log Aktivitas</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchActivityLogs}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={exportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Log Aktivitas</CardTitle>
            <CardDescription>
              Filter log aktivitas berdasarkan kriteria tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Cari log aktivitas..." 
                  className="pl-8" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipe Aksi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Tipe Aksi</SelectItem>
                    {actionTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipe Entitas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Tipe Entitas</SelectItem>
                    {entityTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pengguna" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Pengguna</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Input 
                  type="date" 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Daftar Log Aktivitas</CardTitle>
            <CardDescription>
              {filteredLogs.length} log aktivitas ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Tidak ada log aktivitas ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Pengguna</TableHead>
                      <TableHead>Tipe Aksi</TableHead>
                      <TableHead>Tipe Entitas</TableHead>
                      <TableHead>Deskripsi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.admin_users?.nama || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{log.admin_users?.role || 'Unknown'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${getActionTypeColor(log.action_type)}`}>
                            {log.action_type}
                          </span>
                        </TableCell>
                        <TableCell>{log.entity_type}</TableCell>
                        <TableCell className="max-w-md truncate">{log.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleProtected>
  );
}
