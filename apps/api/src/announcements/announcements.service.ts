import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  findAll() {
    return this.prisma.announcement.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }

  findActive() {
    const now = new Date();
    return this.prisma.announcement.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [{ OR: [{ endDate: null }, { endDate: { gte: now } }] }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateAnnouncementDto, actorId: string) {
    const item = await this.prisma.announcement.create({ data: { ...dto, createdById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'ANNOUNCEMENT', entityId: item.id, newValue: item });
    return item;
  }

  async update(id: string, dto: UpdateAnnouncementDto, actorId: string) {
    const before = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Announcement not found');
    const item = await this.prisma.announcement.update({ where: { id }, data: { ...dto, updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'ANNOUNCEMENT', entityId: id, oldValue: before, newValue: item });
    return item;
  }

  async remove(id: string, actorId: string) {
    const before = await this.prisma.announcement.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Announcement not found');
    await this.prisma.announcement.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'ANNOUNCEMENT', entityId: id });
    return { success: true };
  }
}
