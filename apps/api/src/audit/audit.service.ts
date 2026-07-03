import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const SENSITIVE_KEYS = new Set([
  'passwordHash',
  'password',
  'passwordResetTokenHash',
  'smtpPasswordEnc',
  'tokenHash',
]);

export function sanitizeForAudit(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeForAudit);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k)) continue;
      out[k] = sanitizeForAudit(v);
    }
    return out;
  }
  return value;
}

export interface AuditLogInput {
  actorId?: string | null;
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  description?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actorId ?? null,
          action: input.action,
          entityType: input.entityType,
          entityId: input.entityId,
          oldValue: (sanitizeForAudit(input.oldValue) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          newValue: (sanitizeForAudit(input.newValue) as Prisma.InputJsonValue) ?? Prisma.JsonNull,
          description: input.description,
          ipAddress: input.ipAddress,
          userAgent: input.userAgent,
        },
      });
    } catch {
      // Auditing must never break the primary request flow.
    }
  }
}
