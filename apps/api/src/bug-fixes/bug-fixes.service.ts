import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { CreateBugFixDto } from './dto/create-bug-fix.dto';
import { UpdateBugFixDto } from './dto/update-bug-fix.dto';
import { BugFixQueryDto } from './dto/bug-fix-query.dto';

const INCLUDE = {
  module: true,
  status: true,
  severity: true,
  priority: true,
  environment: true,
  version: { select: { id: true, versionNumber: true, releaseName: true } },
  fixedBy: { select: { id: true, firstName: true, lastName: true } },
  testedBy: { select: { id: true, firstName: true, lastName: true } },
} as const;

@Injectable()
export class BugFixesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(query: BugFixQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { deletedAt: null };
    if (query.versionId) where.versionId = query.versionId;
    if (query.moduleId) where.moduleId = query.moduleId;
    if (query.statusId) where.statusId = query.statusId;
    if (query.severityId) where.severityId = query.severityId;
    if (query.priorityId) where.priorityId = query.priorityId;
    if (query.environmentId) where.environmentId = query.environmentId;
    if (query.search) {
      where.OR = [
        { bugCode: { contains: query.search, mode: 'insensitive' } },
        { ticketNumber: { contains: query.search, mode: 'insensitive' } },
        { issue: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.bugFix.findMany({
        where,
        include: INCLUDE,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.bugFix.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }

  async findOne(id: string) {
    const item = await this.prisma.bugFix.findFirst({ where: { id, deletedAt: null }, include: INCLUDE });
    if (!item) throw new NotFoundException('Bug fix not found');
    return item;
  }

  private async nextBugCode(): Promise<string> {
    // Derived from the highest existing code, not a row count - counting rows collides with the
    // seed data's own BUG-1000/1002/1004... numbering (which skips odd numbers and soft-deleted
    // rows would also throw a count-based scheme off over time).
    const last = await this.prisma.bugFix.findFirst({ orderBy: { bugCode: 'desc' }, select: { bugCode: true } });
    const lastNum = last ? parseInt(last.bugCode.replace('BUG-', ''), 10) : 1000;
    return `BUG-${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(dto: CreateBugFixDto, actorId: string) {
    const bugCode = await this.nextBugCode();
    const item = await this.prisma.bugFix.create({ data: { ...dto, bugCode, createdById: actorId }, include: INCLUDE });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'BUG_FIX', entityId: item.id, newValue: item });
    return item;
  }

  async update(id: string, dto: UpdateBugFixDto, actorId: string) {
    const before = await this.prisma.bugFix.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Bug fix not found');
    const item = await this.prisma.bugFix.update({ where: { id }, data: { ...dto, updatedById: actorId }, include: INCLUDE });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'BUG_FIX', entityId: id, oldValue: before, newValue: item });
    return item;
  }

  async softDelete(id: string, actorId: string) {
    const before = await this.prisma.bugFix.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Bug fix not found');
    await this.prisma.bugFix.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'BUG_FIX', entityId: id, oldValue: before });
    return { success: true };
  }
}
