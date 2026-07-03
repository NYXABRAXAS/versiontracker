import { Injectable, NotFoundException } from '@nestjs/common';
import { ApprovalStatus, AuditAction, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApprovalDto } from './dto/create-approval.dto';

const INCLUDE = {
  requestedBy: { select: { id: true, firstName: true, lastName: true } },
  approver: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class ApprovalsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(status?: ApprovalStatus) {
    return this.prisma.approvalRequest.findMany({
      where: status ? { status } : {},
      include: INCLUDE,
      orderBy: { requestedAt: 'desc' },
    });
  }

  async create(dto: CreateApprovalDto, actorId: string) {
    const request = await this.prisma.approvalRequest.create({
      data: { ...dto, requestedById: actorId },
      include: INCLUDE,
    });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'APPROVAL_REQUEST', entityId: request.id, newValue: request });
    return request;
  }

  private async decide(id: string, status: ApprovalStatus, comments: string | undefined, approverId: string) {
    const request = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Approval request not found');

    const updated = await this.prisma.approvalRequest.update({
      where: { id },
      data: { status, comments, approverId, decidedAt: new Date() },
      include: INCLUDE,
    });

    if (request.entityType === 'VERSION' && status === ApprovalStatus.APPROVED) {
      await this.prisma.version.update({ where: { id: request.entityId }, data: { approvedById: approverId } }).catch(() => undefined);
    }

    await this.notificationsService.notify(
      request.requestedById,
      status === ApprovalStatus.APPROVED ? NotificationType.RELEASE_APPROVED : NotificationType.GENERAL,
      status === ApprovalStatus.APPROVED ? 'Your request was approved' : 'Your request was rejected',
      `${request.action} for ${request.entityType} was ${status.toLowerCase()}.${comments ? ` Comments: ${comments}` : ''}`,
      request.entityType,
      request.entityId,
    );

    await this.auditService.log({
      actorId: approverId,
      action: status === ApprovalStatus.APPROVED ? AuditAction.APPROVE : AuditAction.REJECT,
      entityType: 'APPROVAL_REQUEST',
      entityId: id,
      description: comments,
    });

    return updated;
  }

  approve(id: string, comments: string | undefined, approverId: string) {
    return this.decide(id, ApprovalStatus.APPROVED, comments, approverId);
  }

  reject(id: string, comments: string | undefined, approverId: string) {
    return this.decide(id, ApprovalStatus.REJECTED, comments, approverId);
  }
}
