import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { CreateChangeLogDto } from './dto/create-change-log.dto';
import { UpdateChangeLogDto } from './dto/update-change-log.dto';
import { ChangeLogQueryDto } from './dto/change-log-query.dto';

const INCLUDE = {
  module: true,
  status: true,
  version: { select: { id: true, versionNumber: true, releaseName: true, productId: true, environmentId: true } },
  developer: { select: { id: true, firstName: true, lastName: true } },
  tester: { select: { id: true, firstName: true, lastName: true } },
  reviewer: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class ChangeLogsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: ChangeLogQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { deletedAt: null };
    if (query.versionId) where.versionId = query.versionId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.statusId) where.statusId = query.statusId;
    if (query.developerId) where.developerId = query.developerId;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { screenName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.changeLog.findMany({
        where,
        include: INCLUDE,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.changeLog.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const item = await this.prisma.changeLog.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
    if (!item) throw new NotFoundException('Change log not found');
    return item;
  }

  async create(dto: CreateChangeLogDto, actorId: string) {
    const item = await this.prisma.changeLog.create({ data: { ...dto, createdById: actorId }, include: INCLUDE });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'CHANGE_LOG', entityId: item.id, newValue: item });
    return item;
  }

  async update(id: string, dto: UpdateChangeLogDto, actorId: string) {
    const before = await this.prisma.changeLog.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Change log not found');
    const item = await this.prisma.changeLog.update({ where: { id }, data: { ...dto, updatedById: actorId }, include: INCLUDE });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'CHANGE_LOG', entityId: id, oldValue: before, newValue: item });
    return item;
  }

  async softDelete(id: string, actorId: string) {
    const before = await this.prisma.changeLog.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Change log not found');
    await this.prisma.changeLog.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'CHANGE_LOG', entityId: id, oldValue: before });
    return { success: true };
  }
}
