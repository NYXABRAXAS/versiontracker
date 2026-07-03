import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateMasterTypeDto, UpdateMasterTypeDto } from './dto/master-type.dto';
import { CreateMasterItemDto, UpdateMasterItemDto } from './dto/master-item.dto';

function slugCode(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

@Injectable()
export class MastersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAllTypes() {
    return this.prisma.masterType.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: { where: { deletedAt: null } } } } },
    });
  }

  async findItemsByTypeCode(code: string, includeInactive = false) {
    const type = await this.prisma.masterType.findFirst({ where: { code, deletedAt: null } });
    if (!type) throw new NotFoundException(`Master type "${code}" not found`);
    return this.prisma.masterItem.findMany({
      where: { masterTypeId: type.id, deletedAt: null, ...(includeInactive ? {} : { isActive: true }) },
      orderBy: { sortOrder: 'asc' },
      include: { parent: true },
    });
  }

  async findAllItemsForType(typeId: string) {
    return this.prisma.masterItem.findMany({
      where: { masterTypeId: typeId, deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { parent: true },
    });
  }

  async createType(dto: CreateMasterTypeDto, actorId: string) {
    const code = dto.code.toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.masterType.findUnique({ where: { code } });
    if (existing) throw new ConflictException('A master type with this code already exists.');
    const count = await this.prisma.masterType.count();
    const type = await this.prisma.masterType.create({ data: { ...dto, code, sortOrder: count, isSystem: false } });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'MASTER_TYPE', entityId: type.id, newValue: type });
    return type;
  }

  async updateType(id: string, dto: UpdateMasterTypeDto, actorId: string) {
    const before = await this.prisma.masterType.findFirstOrThrow({ where: { id, deletedAt: null } });
    const type = await this.prisma.masterType.update({ where: { id }, data: dto });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'MASTER_TYPE', entityId: id, oldValue: before, newValue: type });
    return type;
  }

  async removeType(id: string, actorId: string) {
    const type = await this.prisma.masterType.findFirstOrThrow({ where: { id, deletedAt: null } });
    if (type.isSystem) throw new BadRequestException('System master categories cannot be deleted.');
    await this.prisma.$transaction([
      this.prisma.masterItem.updateMany({ where: { masterTypeId: id }, data: { deletedAt: new Date() } }),
      this.prisma.masterType.update({ where: { id }, data: { deletedAt: new Date() } }),
    ]);
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'MASTER_TYPE', entityId: id });
    return { success: true };
  }

  async createItem(dto: CreateMasterItemDto, actorId: string) {
    const code = (dto.code || slugCode(dto.name)).toUpperCase().replace(/\s+/g, '_');
    const existing = await this.prisma.masterItem.findUnique({
      where: { masterTypeId_code: { masterTypeId: dto.masterTypeId, code } },
    });
    if (existing) throw new ConflictException('An item with this code already exists in this category.');

    const item = await this.prisma.masterItem.create({
      data: { ...dto, code, isSystem: false, createdById: actorId },
    });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'MASTER_ITEM', entityId: item.id, newValue: item });
    return item;
  }

  async updateItem(id: string, dto: UpdateMasterItemDto, actorId: string) {
    const before = await this.prisma.masterItem.findFirstOrThrow({ where: { id, deletedAt: null } });
    const item = await this.prisma.masterItem.update({ where: { id }, data: { ...dto, updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'MASTER_ITEM', entityId: id, oldValue: before, newValue: item });
    return item;
  }

  async removeItem(id: string, actorId: string) {
    const item = await this.prisma.masterItem.findFirstOrThrow({ where: { id, deletedAt: null } });
    if (item.isSystem) throw new BadRequestException('This is a system value and cannot be deleted; you can deactivate it instead.');
    await this.prisma.masterItem.update({ where: { id }, data: { deletedAt: new Date(), updatedById: actorId } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'MASTER_ITEM', entityId: id });
    return { success: true };
  }
}
