import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { getAccessScope, applyAccessScope } from '../common/utils/access-scope.util';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { VersionQueryDto } from './dto/version-query.dto';

export const VERSION_INCLUDE = {
  releaseType: true,
  environment: true,
  product: true,
  module: true,
  priority: true,
  severity: true,
  status: true,
  client: true,
  developer: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  tester: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  approvedBy: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
  rollbackVersion: { select: { id: true, versionNumber: true, releaseName: true } },
  _count: { select: { changeLogs: true, bugFixes: true, deploymentHistory: true } },
} as const;

@Injectable()
export class VersionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: VersionQueryDto, userId: string) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const scope = await getAccessScope(this.prisma, userId);
    const where: any = applyAccessScope({ deletedAt: null }, scope);

    if (query.productId) where.productId = query.productId;
    if (query.environmentId) where.environmentId = query.environmentId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.releaseTypeId) where.releaseTypeId = query.releaseTypeId;
    if (query.priorityId) where.priorityId = query.priorityId;
    if (query.severityId) where.severityId = query.severityId;
    if (query.statusId) where.statusId = query.statusId;
    if (query.clientId) where.clientId = query.clientId;
    if (query.developerId) where.developerId = query.developerId;
    if (query.testerId) where.testerId = query.testerId;
    if (query.dateFrom || query.dateTo) {
      where.releaseDate = {};
      if (query.dateFrom) where.releaseDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.releaseDate.lte = new Date(query.dateTo);
    }
    if (query.search) {
      where.OR = [
        { versionNumber: { contains: query.search, mode: 'insensitive' } },
        { releaseName: { contains: query.search, mode: 'insensitive' } },
        { releaseTitle: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { gitCommitId: { contains: query.search, mode: 'insensitive' } },
        { buildNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const sortBy = query.sortBy || 'releaseDate';
    const [data, total] = await Promise.all([
      this.prisma.version.findMany({
        where,
        include: VERSION_INCLUDE,
        orderBy: { [sortBy]: query.sortOrder || 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.version.count({ where }),
    ]);

    return paginate(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const version = await this.prisma.version.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...VERSION_INCLUDE,
        changeLogs: { where: { deletedAt: null }, orderBy: { date: 'desc' }, include: { module: true, status: true } },
        bugFixes: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, include: { module: true, status: true, severity: true, priority: true } },
        deploymentHistory: { orderBy: { deployedAt: 'asc' }, include: { environment: true, deployedBy: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  async create(dto: CreateVersionDto, actorId: string) {
    const version = await this.prisma.version.create({
      data: { ...dto, createdById: actorId },
      include: VERSION_INCLUDE,
    });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'VERSION', entityId: version.id, newValue: version });
    return version;
  }

  async update(id: string, dto: UpdateVersionDto, actorId: string) {
    const before = await this.prisma.version.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Version not found');

    const version = await this.prisma.version.update({
      where: { id },
      data: { ...dto, updatedById: actorId },
      include: VERSION_INCLUDE,
    });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'VERSION', entityId: id, oldValue: before, newValue: version });
    return version;
  }

  async softDelete(id: string, actorId: string) {
    const version = await this.prisma.version.findFirst({ where: { id, deletedAt: null } });
    if (!version) throw new NotFoundException('Version not found');
    await this.prisma.version.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'VERSION', entityId: id, oldValue: version });
    return { success: true };
  }

  async recordRollback(id: string, rollbackVersionId: string, actorId: string) {
    if (id === rollbackVersionId) throw new BadRequestException('A version cannot roll back to itself.');
    const version = await this.prisma.version.update({
      where: { id },
      data: { rollbackAvailable: true, rollbackVersionId, updatedById: actorId },
      include: VERSION_INCLUDE,
    });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'VERSION', entityId: id, description: 'Rollback recorded', newValue: { rollbackVersionId } });
    return version;
  }

  async findAllForExport(query: VersionQueryDto, userId: string) {
    const scope = await getAccessScope(this.prisma, userId);
    const where: any = applyAccessScope({ deletedAt: null }, scope);
    if (query.productId) where.productId = query.productId;
    if (query.environmentId) where.environmentId = query.environmentId;
    if (query.statusId) where.statusId = query.statusId;
    return this.prisma.version.findMany({ where, include: VERSION_INCLUDE, orderBy: { releaseDate: 'desc' } });
  }
}
