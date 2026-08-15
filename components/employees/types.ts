export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  active: boolean;
  lastLoginAt: string | null;
};

export type RoleOption = { id: string; name: string };

export type RoleWithPermissions = {
  id: string;
  name: string;
  permissionIds: string[];
  userCount: number;
};

export type PermissionOption = { id: string; key: string; description: string | null };

export type AuditLogRow = {
  id: string;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
};
