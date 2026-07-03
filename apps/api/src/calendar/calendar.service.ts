import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateFreezeWindowDto } from './dto/create-freeze-window.dto';
import { UpdateFreezeWindowDto } from './dto/update-freeze-window.dto';

@Injectable()
export class CalendarService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getCalendar(dateFrom: string, dateTo: string) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);

    const [releases, freezeWindows] = await Promise.all([
      this.prisma.version.findMany({
        where: { deletedAt: null, OR: [{ releaseDate: { gte: from, lte: to } }, { deploymentDate: { gte: from, lte: to } }] },
        include: { product: true, environment: true, status: true, releaseType: true },
        orderBy: { releaseDate: 'asc' },
      }),
      this.prisma.releaseFreezeWindow.findMany({
        where: { deletedAt: null, isActive: true, startDate: { lte: to }, endDate: { gte: from } },
        include: { environment: true, product: true },
      }),
    ]);

    return { releases, freezeWindows };
  }

  findAllFreezeWindows() {
    return this.prisma.releaseFreezeWindow.findMany({
      where: { deletedAt: null },
      include: { environment: true, product: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async createFreezeWindow(dto: CreateFreezeWindowDto, actorId: string) {
    const item = await this.prisma.releaseFreezeWindow.create({ data: { ...dto, createdById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'FREEZE_WINDOW', entityId: item.id, newValue: item });
    return item;
  }

  async updateFreezeWindow(id: string, dto: UpdateFreezeWindowDto, actorId: string) {
    const before = await this.prisma.releaseFreezeWindow.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Freeze window not found');
    const item = await this.prisma.releaseFreezeWindow.update({ where: { id }, data: dto });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'FREEZE_WINDOW', entityId: id, oldValue: before, newValue: item });
    return item;
  }

  async removeFreezeWindow(id: string, actorId: string) {
    const before = await this.prisma.releaseFreezeWindow.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('Freeze window not found');
    await this.prisma.releaseFreezeWindow.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'FREEZE_WINDOW', entityId: id });
    return { success: true };
  }
}
