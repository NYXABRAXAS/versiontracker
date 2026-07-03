import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuditAction } from '@prisma/client';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AUDIT_ENTITY_KEY } from '../decorators/audit.decorator';
import { AuditService } from '../../audit/audit.service';

const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PUT: AuditAction.UPDATE,
  PATCH: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityType = this.reflector.getAllAndOverride<string>(AUDIT_ENTITY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    const action = METHOD_ACTION[request.method as string];

    if (!entityType || !action) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((responseBody) => {
        const entityId = responseBody?.id ?? request.params?.id;
        void this.auditService.log({
          actorId: request.user?.id ?? null,
          action,
          entityType,
          entityId,
          newValue: action === AuditAction.DELETE ? undefined : responseBody,
          ipAddress: request.ip,
          userAgent: request.headers?.['user-agent'],
        });
      }),
    );
  }
}
