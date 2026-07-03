import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll() {
    return this.prisma.role.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { users: true, rolePermissions: true } } },
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async allPermissions() {
    return this.prisma.permission.findMany({ orderBy: [{ module: 'asc' }, { action: 'asc' }] });
  }

  async create(dto: CreateRoleDto, actorId: string) {
    const existing = await this.prisma.role.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('A role with this code already exists.');
    const role = await this.prisma.role.create({ data: { ...dto, code: dto.code.toUpperCase().replace(/\s+/g, '_') } });
    await this.auditService.log({ actorId, action: AuditAction.CREATE, entityType: 'ROLE', entityId: role.id, newValue: role });
    return role;
  }

  async update(id: string, dto: UpdateRoleDto, actorId: string) {
    const before = await this.findOne(id);
    const role = await this.prisma.role.update({ where: { id }, data: dto });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'ROLE', entityId: id, oldValue: before, newValue: role });
    return role;
  }

  async remove(id: string, actorId: string) {
    const role = await this.findOne(id);
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted.');
    const usersOnRole = await this.prisma.user.count({ where: { roleId: id, deletedAt: null } });
    if (usersOnRole > 0) throw new BadRequestException('Cannot delete a role that is still assigned to users.');
    await this.prisma.role.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'ROLE', entityId: id });
    return { success: true };
  }

  async setPermissions(id: string, permissionCodes: string[], actorId: string) {
    const role = await this.findOne(id);
    const permissions = await this.prisma.permission.findMany();
    const byCode = new Map(permissions.map((p) => [`${p.module}:${p.action}`, p.id]));
    const permissionIds = permissionCodes.map((c) => byCode.get(c)).filter((v): v is string => !!v);

    await this.prisma.$transaction([
      this.prisma.rolePermission.deleteMany({ where: { roleId: id } }),
      this.prisma.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })) }),
    ]);

    await this.auditService.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: 'ROLE',
      entityId: id,
      description: 'Permissions updated',
      oldValue: role.rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`),
      newValue: permissionCodes,
    });

    return this.findOne(id);
  }
}
