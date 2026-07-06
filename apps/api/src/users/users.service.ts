import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { validatePassword } from '../common/utils/password-policy';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
  let out = '';
  for (let i = 0; i < 12; i++) out += chars[crypto.randomInt(0, chars.length)];
  return out;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  private readonly listInclude = {
    role: true,
    department: true,
    productAccess: { include: { product: true } },
    environmentAccess: { include: { environment: true } },
    moduleAccess: { include: { module: true } },
  };

  private sanitize(user: any) {
    const { passwordHash, passwordResetTokenHash, ...safe } = user;
    return safe;
  }

  async findAll(query: UserListQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: any = { deletedAt: null };
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.roleId) where.roleId = query.roleId;
    if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: this.listInclude,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return paginate(data.map((u) => this.sanitize(u)), total, page, pageSize);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null }, include: this.listInclude });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitize(user);
  }

  private async assertPasswordPolicy(password: string) {
    const settings = await this.prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const errors = validatePassword(password, {
      passwordMinLength: settings?.passwordMinLength ?? 8,
      passwordRequireUppercase: settings?.passwordRequireUppercase ?? true,
      passwordRequireNumber: settings?.passwordRequireNumber ?? true,
      passwordRequireSymbol: settings?.passwordRequireSymbol ?? true,
    });
    if (errors.length) throw new BadRequestException(errors.join(' '));
  }

  async create(dto: CreateUserDto, actorId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('A user with this email already exists.');

    // An admin can set the initial password directly (so they already know it and can hand it
    // off themselves) instead of relying on a randomly generated one that only ever exists in an
    // email - useful when no SMTP is configured.
    const adminSetPassword = Boolean(dto.password);
    if (dto.password) await this.assertPasswordPolicy(dto.password);
    const tempPassword = dto.password || generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        employeeCode: dto.employeeCode,
        roleId: dto.roleId,
        departmentId: dto.departmentId,
        isActive: dto.isActive ?? true,
        passwordHash,
        mustChangePassword: true,
        createdById: actorId,
        productAccess: dto.productIds ? { create: dto.productIds.map((productId) => ({ productId })) } : undefined,
        environmentAccess: dto.environmentIds
          ? { create: dto.environmentIds.map((environmentId) => ({ environmentId })) }
          : undefined,
        moduleAccess: dto.moduleIds ? { create: dto.moduleIds.map((moduleId) => ({ moduleId })) } : undefined,
      },
      include: this.listInclude,
    });

    // If the admin chose their own password, they already know it and will hand it off
    // themselves - no need to also email it out.
    const emailSent = adminSetPassword ? true : await this.mailService.sendUserCreatedEmail(user.email, user.firstName, tempPassword);
    await this.auditService.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: 'USER',
      entityId: user.id,
      newValue: user,
    });

    // The temp password only ever exists in this one response otherwise - if SMTP isn't
    // configured (or delivery fails), the account would be created with no way for the admin to
    // ever hand the user a working password. Only include it here as a fallback when the email
    // genuinely didn't go out, never when delivery succeeded.
    return { ...this.sanitize(user), tempPassword: emailSent ? undefined : tempPassword };
  }

  async update(id: string, dto: UpdateUserDto, actorId: string) {
    const before = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!before) throw new NotFoundException('User not found');

    const user = await this.prisma.$transaction(async (tx) => {
      if (dto.productIds) {
        await tx.userProductAccess.deleteMany({ where: { userId: id } });
        if (dto.productIds.length) await tx.userProductAccess.createMany({ data: dto.productIds.map((productId) => ({ userId: id, productId })) });
      }
      if (dto.environmentIds) {
        await tx.userEnvironmentAccess.deleteMany({ where: { userId: id } });
        if (dto.environmentIds.length)
          await tx.userEnvironmentAccess.createMany({ data: dto.environmentIds.map((environmentId) => ({ userId: id, environmentId })) });
      }
      if (dto.moduleIds) {
        await tx.userModuleAccess.deleteMany({ where: { userId: id } });
        if (dto.moduleIds.length) await tx.userModuleAccess.createMany({ data: dto.moduleIds.map((moduleId) => ({ userId: id, moduleId })) });
      }

      return tx.user.update({
        where: { id },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          employeeCode: dto.employeeCode,
          roleId: dto.roleId,
          departmentId: dto.departmentId,
          isActive: dto.isActive,
          updatedById: actorId,
        },
        include: this.listInclude,
      });
    });

    await this.auditService.log({
      actorId,
      action: before.roleId !== user.roleId ? AuditAction.ROLE_CHANGE : AuditAction.UPDATE,
      entityType: 'USER',
      entityId: id,
      oldValue: before,
      newValue: user,
    });

    return this.sanitize(user);
  }

  async setActive(id: string, isActive: boolean, actorId: string) {
    const user = await this.prisma.user.update({ where: { id }, data: { isActive, updatedById: actorId }, include: this.listInclude });
    await this.auditService.log({
      actorId,
      action: AuditAction.UPDATE,
      entityType: 'USER',
      entityId: id,
      description: isActive ? 'User enabled' : 'User disabled',
      newValue: { isActive },
    });
    return this.sanitize(user);
  }

  async softDelete(id: string, actorId: string) {
    if (id === actorId) throw new BadRequestException('You cannot delete your own account.');
    await this.prisma.user.update({ where: { id }, data: { deletedAt: new Date(), isActive: false, updatedById: actorId } });
    await this.prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'USER', entityId: id });
    return { success: true };
  }

  async adminResetPassword(id: string, actorId: string, password?: string) {
    const user = await this.prisma.user.findFirstOrThrow({ where: { id, deletedAt: null } });
    const adminSetPassword = Boolean(password);
    if (password) await this.assertPasswordPolicy(password);
    const tempPassword = password || generateTempPassword();
    const passwordHash = await bcrypt.hash(tempPassword, 12);
    await this.prisma.user.update({ where: { id }, data: { passwordHash, mustChangePassword: true } });
    await this.prisma.refreshToken.updateMany({ where: { userId: id }, data: { revoked: true } });
    const emailSent = adminSetPassword
      ? true
      : await this.mailService.sendMail(
          user.email,
          'Your LOS Version Portal password has been reset',
          `<p>Hi ${user.firstName},</p><p>Your password was reset by an administrator. Temporary password: <b>${tempPassword}</b></p><p>You will be asked to set a new password at next login.</p>`,
          'admin-password-reset',
        );
    await this.auditService.log({ actorId, action: AuditAction.PASSWORD_RESET, entityType: 'USER', entityId: id, description: 'Reset by admin' });
    return { success: true, tempPassword: emailSent ? undefined : tempPassword };
  }
}
