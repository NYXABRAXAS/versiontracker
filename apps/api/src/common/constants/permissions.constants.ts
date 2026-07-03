// Central catalog of permission modules/actions. Adding a module here and
// re-seeding is the only "code change" ever needed for RBAC - role-to-permission
// assignment itself is fully admin-editable at runtime via /roles/:id/permissions.

export const PERMISSION_MODULES = [
  'DASHBOARD',
  'USERS',
  'ROLES',
  'MASTERS',
  'VERSIONS',
  'CHANGE_LOGS',
  'BUG_FIXES',
  'DEPLOYMENTS',
  'ATTACHMENTS',
  'COMPARISON',
  'REPORTS',
  'AUDIT_LOGS',
  'LOGIN_HISTORY',
  'SETTINGS',
  'APPROVALS',
  'ANNOUNCEMENTS',
  'BOOKMARKS',
  'CALENDAR',
  'SEARCH',
  'BACKUP',
  'NOTIFICATIONS',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];

export const PERMISSION_ACTIONS = [
  'view',
  'create',
  'edit',
  'delete',
  'approve',
  'export',
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export function permissionCode(module: PermissionModule, action: PermissionAction): string {
  return `${module}:${action}`;
}
