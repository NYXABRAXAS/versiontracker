import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'auditEntity';

/**
 * Marks a mutating controller method for automatic audit logging by
 * AuditInterceptor. `entityType` should match the domain entity name
 * (e.g. "VERSION", "USER"). The action (CREATE/UPDATE/DELETE) is inferred
 * from the HTTP method; entityId is read from the response body's `id`
 * field, falling back to the `id` route param.
 */
export const Audit = (entityType: string) => SetMetadata(AUDIT_ENTITY_KEY, entityType);
