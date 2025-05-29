"use client";

import { useState, useEffect, Suspense } from "react";
import { Loader2, Plus, Trash, Edit, Save } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoleProtected } from "@/components/role-protected";

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

interface Permission {
  id: string;
  name: string;
  description: string;
}

interface AdminUser {
  id: string;
  username: string;
  role: string;
  nama: string;
  email: string;
}

function RoleManagementContent(): React.ReactElement {
  const { user } = useAdminAuth();
  const { toast } = useToast();
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: rolesData, error: rolesError } = await supabase
          .from("admin_roles")
          .select("*");

        if (rolesError) throw rolesError;

        const { data: permissionsData, error: permissionsError } = await supabase
          .from("admin_permissions")
          .select("*");

        if (permissionsError) throw permissionsError;

        const { data: rolePermissionsData, error: rolePermissionsError } = await supabase
          .from("admin_role_permissions")
          .select("*");

        if (rolePermissionsError) throw rolePermissionsError;

        const { data: usersData, error: usersError } = await supabase
          .from("admin_users")
          .select("*");

        if (usersError) throw usersError;

        const processedRoles = rolesData?.map((role) => {
          const rolePermissions = rolePermissionsData
            ?.filter((rp) => rp.role_id === role.id)
            .map((rp) => rp.permission_id) || [];

          return {
            ...role,
            permissions: rolePermissions,
          };
        }) || [];

        setRoles(processedRoles);
        setPermissions(permissionsData || []);
        setUsers(usersData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Gagal memuat data. Silakan coba lagi.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getPermissionName = (permissionId: string) => {
    const permission = permissions.find((p) => p.id === permissionId);
    return permission ? permission.name : "Unknown";
  };

  const openEditDialog = (role: Role) => {
    setSelectedRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions || []);
    setIsEditRoleDialogOpen(true);
  };

  const handleAddRole = async () => {
    if (!newRoleName) {
      toast({
        title: "Error",
        description: "Nama role tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .insert([
          {
            name: newRoleName,
            description: newRoleDescription,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Add role permissions
        if (selectedPermissions.length > 0) {
          const { error: permissionsError } = await supabase
            .from('admin_role_permissions')
            .insert(
              selectedPermissions.map(permissionId => ({
                role_id: data.id,
                permission_id: permissionId,
              }))
            );

          if (permissionsError) throw permissionsError;
        }

        setRoles([...roles, { ...data, permissions: selectedPermissions }]);
        toast({
          title: 'Success',
          description: 'Role berhasil ditambahkan',
          variant: 'default'
        });
        handleCloseDialogs();
      }
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: 'Gagal menambahkan role. Silakan coba lagi.',
        variant: 'destructive'
      });
    }
  };

  const handleEditRole = async () => {
    try {
      if (!selectedRole || !newRoleName.trim()) {
        toast({
          title: "Error",
          description: "Role name is required",
          variant: "destructive",
        });
        return;
      }

      const { error: roleError } = await supabase
        .from("admin_roles")
        .update({
          name: newRoleName.trim(),
          description: newRoleDescription.trim(),
        })
        .eq("id", selectedRole.id);

      if (roleError) throw roleError;

      // Update role permissions
      const { error: deletePermError } = await supabase
        .from("admin_role_permissions")
        .delete()
        .eq("role_id", selectedRole.id);

      if (deletePermError) throw deletePermError;

      if (selectedPermissions.length > 0) {
        const { error: addPermError } = await supabase
          .from("admin_role_permissions")
          .insert(
            selectedPermissions.map((permissionId) => ({
              role_id: selectedRole.id,
              permission_id: permissionId,
            }))
          );

        if (addPermError) throw addPermError;
      }

      const updatedRoles = roles.map((role) =>
        role.id === selectedRole.id
          ? {
              ...role,
              name: newRoleName.trim(),
              description: newRoleDescription.trim(),
              permissions: selectedPermissions,
            }
          : role
      );

      setRoles(updatedRoles);
      handleCloseDialogs();

      toast({
        title: "Success",
        description: "Role updated successfully",
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      // Delete role permissions first
      const { error: permError } = await supabase
        .from("admin_role_permissions")
        .delete()
        .eq("role_id", roleId);

      if (permError) throw permError;

      // Then delete the role
      const { error } = await supabase
        .from("admin_roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;

      setRoles(roles.filter((role) => role.id !== roleId));
      toast({
        title: "Success",
        description: "Role deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      toast({
        title: "Error",
        description: "Failed to delete role",
        variant: "destructive",
      });
    }
  };

  const handlePermissionChange = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleOpenEditDialog = (role: Role) => {
    setSelectedRole(role);
    setNewRoleName(role.name);
    setNewRoleDescription(role.description);
    setSelectedPermissions(role.permissions);
    setIsEditRoleDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsAddRoleDialogOpen(false);
    setIsEditRoleDialogOpen(false);
    setSelectedRole(null);
    setNewRoleName("");
    setNewRoleDescription("");
    setSelectedPermissions([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Role Management</h2>
        <Button onClick={() => setIsAddRoleDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Permissions</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>{role.description}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-2">
                  {role.permissions.map((permId) => {
                    const permission = permissions.find((p) => p.id === permId);
                    return (
                      <Badge key={permId} variant="secondary">
                        {permission?.name || "Unknown"}
                      </Badge>
                    );
                  })}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(role)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isAddRoleDialogOpen} onOpenChange={setIsAddRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
            <DialogDescription>
              Create a new role with specific permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.id}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() =>
                        handlePermissionChange(permission.id)
                      }
                    />
                    <Label htmlFor={permission.id} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>
              Cancel
            </Button>
            <Button onClick={handleAddRole}>
              Add Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Modify role details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="Enter role name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={newRoleDescription}
                onChange={(e) => setNewRoleDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </div>
            <div>
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${permission.id}`}
                      checked={selectedPermissions.includes(permission.id)}
                      onCheckedChange={() =>
                        handlePermissionChange(permission.id)
                      }
                    />
                    <Label htmlFor={`edit-${permission.id}`} className="text-sm">
                      {permission.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialogs}>
              Cancel
            </Button>
            <Button onClick={handleEditRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RoleManagement(): React.ReactElement {
  return (
    <RoleProtected
      requiredPermission="view_roles"
      allowedRoles={["admin"]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Manage roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            }
          >
            <RoleManagementContent />
          </Suspense>
        </CardContent>
      </Card>
    </RoleProtected>
  );
}
