import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentQueryDto } from './dto/deployment-query.dto';

const INCLUDE = {
  environment: true,
  deployedBy: { select: { id: true, firstName: true, lastName: true } },
  version: { select: { id: true, versionNumber: true, releaseName: true, productId: true } },
} as const;

@Injectable()
export class DeploymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: DeploymentQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { deletedAt: null };
    if (query.versionId) where.versionId = query.versionId;
    if (query.environmentId) where.environmentId = query.environmentId;
    if (query.result) where.result = query.result;

    const [data, total] = await Promise.all([
      this.prisma.deploymentHistory.findMany({
        where,
        include: INCLUDE,
        orderBy: { deployedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.deploymentHistory.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async pipelineForVersion(versionId: string) {
    return this.prisma.deploymentHistory.findMany({
      where: { versionId, deletedAt: null },
      include: INCLUDE,
      orderBy: { deployedAt: 'asc' },
    });
  }

  async create(dto: CreateDeploymentDto, actorId: string) {
    const item = await this.prisma.deploymentHistory.create({
      data: {
        ...dto,
        deployedAt: dto.deployedAt ? new Date(dto.deployedAt) : new Date(),
        deployedById: dto.deployedById ?? actorId,
      },
      include: INCLUDE,
    });

    // Keep the parent version's headline deployment date/environment roughly in sync
    // for the most recently recorded deployment step.
    await this.prisma.version.update({
      where: { id: dto.versionId },
      data: { deploymentDate: item.deployedAt },
    });

    await this.auditService.log({
      actorId,
      action: AuditAction.DEPLOYMENT,
      entityType: 'DEPLOYMENT',
      entityId: item.id,
      newValue: item,
      description: `Deployed version ${item.version.versionNumber} to ${item.environment.name}`,
    });
    return item;
  }

  async remove(id: string, actorId: string) {
    const item = await this.prisma.deploymentHistory.findFirst({ where: { id, deletedAt: null } });
    if (!item) throw new NotFoundException('Deployment record not found');
    await this.prisma.deploymentHistory.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'DEPLOYMENT', entityId: id, oldValue: item });
    return { success: true };
  }
}
