import { SetMetadata } from '@nestjs/common';
import { PermissionAction, PermissionModule, permissionCode } from '../constants/permissions.constants';

export const PERMISSION_KEY = 'requiredPermission';

/** Requires the caller's role to hold `module:action` (see PermissionsGuard). */
export const RequirePermission = (module: PermissionModule, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, permissionCode(module, action));
