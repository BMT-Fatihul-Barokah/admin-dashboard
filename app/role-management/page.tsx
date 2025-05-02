"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useAdminAuth } from "@/lib/admin-auth-context";
import { createClient } from '@supabase/supabase-js';
import { RoleProtected } from "@/components/role-protected";
import { Loader2, Plus, Trash, Edit, Save } from "lucide-react";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Permission types
interface Permission {
  id: string;
  name: string;
  description: string;
}

// Role types
interface Role {
  id: string;
  name: string;
  description: string;
  created_at: string;
  permissions: string[];
}

// User types
interface AdminUser {
  id: string;
  username: string;
  role: string;
  nama: string;
  email?: string;
}

export default function RoleManagementPage() {
  const { toast } = useToast();
  const { user } = useAdminAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDescription, setNewRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // Fetch roles, permissions, and users on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('admin_roles')
          .select('*');

        if (rolesError) throw rolesError;

        // Fetch permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('admin_permissions')
          .select('*');

        if (permissionsError) throw permissionsError;

        // Fetch role permissions
        const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
          .from('admin_role_permissions')
          .select('*');

        if (rolePermissionsError) throw rolePermissionsError;

        // Fetch users
        const { data: usersData, error: usersError } = await supabase
          .from('admin_users')
          .select('*');

        if (usersError) throw usersError;

        // Process roles with their permissions
        const processedRoles = rolesData.map(role => {
          const rolePermissions = rolePermissionsData
            .filter(rp => rp.role_id === role.id)
            .map(rp => rp.permission_id);
          
          return {
            ...role,
            permissions: rolePermissions
          };
        });

        setRoles(processedRoles);
        setPermissions(permissionsData);
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Gagal memuat data. Silakan coba lagi.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle adding a new role
  const handleAddRole = async () => {
    if (!newRoleName.trim()) {
      toast({
        title: 'Error',
        description: 'Nama peran harus diisi.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Insert new role
      const { data: newRole, error: roleError } = await supabase
        .from('admin_roles')
        .insert({
          name: newRoleName,
          description: newRoleDescription
        })
        .select()
        .single();

      if (roleError) throw roleError;

      // Insert role permissions
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: newRole.id,
          permission_id: permissionId
        }));

        const { error: permissionsError } = await supabase
          .from('admin_role_permissions')
          .insert(rolePermissions);

        if (permissionsError) throw permissionsError;
      }

      // Update local state
      setRoles([...roles, { ...newRole, permissions: selectedPermissions }]);
      
      // Reset form
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
      setIsAddRoleDialogOpen(false);

      toast({
        title: 'Berhasil',
        description: `Peran ${newRoleName} telah ditambahkan.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan peran. Silakan coba lagi.',
        variant: 'destructive'
      });
    }
  };

  // Handle editing a role
  const handleEditRole = async () => {
    if (!selectedRole || !newRoleName.trim()) {
      toast({
        title: 'Error',
        description: 'Nama peran harus diisi.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update role
      const { error: roleError } = await supabase
        .from('admin_roles')
        .update({
          name: newRoleName,
          description: newRoleDescription
        })
        .eq('id', selectedRole.id);

      if (roleError) throw roleError;

      // Delete existing role permissions
      const { error: deleteError } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      if (deleteError) throw deleteError;

      // Insert new role permissions
      if (selectedPermissions.length > 0) {
        const rolePermissions = selectedPermissions.map(permissionId => ({
          role_id: selectedRole.id,
          permission_id: permissionId
        }));

        const { error: permissionsError } = await supabase
          .from('admin_role_permissions')
          .insert(rolePermissions);

        if (permissionsError) throw permissionsError;
      }

      // Update local state
      const updatedRoles = roles.map(role => 
        role.id === selectedRole.id 
          ? { ...role, name: newRoleName, description: newRoleDescription, permissions: selectedPermissions }
          : role
      );
      
      setRoles(updatedRoles);
      
      // Reset form
      setNewRoleName("");
      setNewRoleDescription("");
      setSelectedPermissions([]);
      setSelectedRole(null);
      setIsEditRoleDialogOpen(false);

      toast({
        title: 'Berhasil',
        description: `Peran ${newRoleName} telah diperbarui.`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui peran. Silakan coba lagi.',
        variant: 'destructive'
      });
    }
  };

  // Handle deleting a role
  const handleDeleteRole = async (roleId: string) => {
    // Check if role is assigned to any users
    const usersWithRole = users.filter(user => user.role === roleId);
    
    if (usersWithRole.length > 0) {
      toast({
        title: 'Error',
        description: 'Tidak dapat menghapus peran yang sedang digunakan oleh pengguna.',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Delete role permissions first
      const { error: permissionsError } = await supabase
        .from('admin_role_permissions')
        .delete()
        .eq('role_id', roleId);

      if (permissionsError) throw permissionsError;

      // Delete role
      const { error: roleError } = await supabase
        .from('admin_roles')
        .delete()
        .eq('id', roleId);

      if (roleError) throw roleError;

      // Update local state
      setRoles(roles.filter(role => role.id !== roleId));

      toast({
        title: 'Berhasil',
        description: 'Peran telah dihapus.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus peran. Silakan coba lagi.',
        variant: 'destructive'
      });
    }
  };

  // Handle permission checkbox change
  const handlePermissionChange = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Get permission name by ID
  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find(p => p.id === permissionId);
    return permission ? permission.name : 'Unknown';
  };

  // Open edit role dialog
  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || '');
    setSelectedPermissions(role.permissions || []);
    setIsEditRoleDialogOpen(true);
  };

  return (
    <RoleProtected allowedRoles={['admin']}>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Manajemen Peran</h1>
          <Button onClick={() => setIsAddRoleDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Peran
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Daftar Peran</CardTitle>
              <CardDescription>Kelola peran dan izin akses untuk pengguna admin</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Peran</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Izin Akses</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map(role => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map(permissionId => (
                            <span key={permissionId} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs">
                              {getPermissionName(permissionId)}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(role)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteRole(role.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Add Role Dialog */}
        <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Peran Baru</DialogTitle>
              <DialogDescription>
                Buat peran baru dan tetapkan izin akses yang sesuai.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Nama Peran</Label>
                <Input
                  id="role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Masukkan nama peran"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role-description">Deskripsi</Label>
                <Input
                  id="role-description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Masukkan deskripsi peran"
                />
              </div>
              <div className="space-y-2">
                <Label>Izin Akses</Label>
                <div className="grid grid-cols-2 gap-2">
                  {permissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionChange(permission.id)}
                      />
                      <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddRoleDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddRole}>
                <Save className="mr-2 h-4 w-4" /> Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Role Dialog */}
        <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Peran</DialogTitle>
              <DialogDescription>
                Ubah detail peran dan izin akses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-role-name">Nama Peran</Label>
                <Input
                  id="edit-role-name"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Masukkan nama peran"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role-description">Deskripsi</Label>
                <Input
                  id="edit-role-description"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Masukkan deskripsi peran"
                />
              </div>
              <div className="space-y-2">
                <Label>Izin Akses</Label>
                <div className="grid grid-cols-2 gap-2">
                  {permissions.map(permission => (
                    <div key={permission.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-permission-${permission.id}`}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionChange(permission.id)}
                      />
                      <Label htmlFor={`edit-permission-${permission.id}`} className="text-sm">
                        {permission.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleEditRole}>
                <Save className="mr-2 h-4 w-4" /> Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleProtected>
  );
}
