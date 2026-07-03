import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuditAction, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MailService } from '../mail/mail.service';
import { AppConfig } from '../config/configuration';
import { validatePassword } from '../common/utils/password-policy';
import { hashToken } from './strategies/jwt-refresh.strategy';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const RESET_TOKEN_TTL_MINUTES = 60;

export interface IssuedTokens {
  accessToken: string;
  accessExpiresInMs: number;
  refreshToken: string;
  refreshExpiresInMs: number;
  csrfToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService<AppConfig, true>,
    private auditService: AuditService,
    private mailService: MailService,
  ) {}

  private async loadPermissionCodes(roleId: string): Promise<string[]> {
    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });
    return rolePermissions.map((rp) => `${rp.permission.module}:${rp.permission.action}`);
  }

  async validateCredentials(email: string, password: string, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: { role: true },
    });

    const fail = async (reason: string) => {
      await this.prisma.loginHistory.create({
        data: { userId: user?.id, email, success: false, reason, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
      });
      await this.auditService.log({
        actorId: user?.id ?? null,
        action: AuditAction.LOGIN_FAILED,
        entityType: 'USER',
        entityId: user?.id,
        description: reason,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      });
    };

    if (!user) {
      await fail('User not found');
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      await fail('User disabled');
      throw new ForbiddenException('This account has been disabled. Contact your administrator.');
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await fail('Account locked');
      throw new ForbiddenException('Account temporarily locked due to failed login attempts. Try again later.');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      const attempts = user.failedLoginAttempts + 1;
      const locked = attempts >= MAX_FAILED_ATTEMPTS;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: locked ? 0 : attempts,
          lockedUntil: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        },
      });
      await fail('Invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });
    await this.prisma.loginHistory.create({
      data: { userId: user.id, email, success: true, ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.LOGIN,
      entityType: 'USER',
      entityId: user.id,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return user;
  }

  async issueTokens(
    user: User & { role: { id: string; code: string } },
    meta: { ipAddress?: string; userAgent?: string; rememberMe?: boolean },
  ): Promise<IssuedTokens> {
    const permissions = await this.loadPermissionCodes(user.roleId);
    const jwtConfig = this.configService.get('jwt', { infer: true });

    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        roleId: user.roleId,
        roleCode: user.role.code,
        permissions,
        mustChangePassword: user.mustChangePassword,
      },
      { secret: jwtConfig.accessSecret, expiresIn: jwtConfig.accessExpiresIn as any },
    );

    const jti = crypto.randomUUID();
    const refreshExpiresIn = meta.rememberMe ? jwtConfig.refreshExpiresInRememberMe : jwtConfig.refreshExpiresIn;
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, jti },
      { secret: jwtConfig.refreshSecret, expiresIn: refreshExpiresIn as any },
    );

    const expiresAt = new Date(Date.now() + parseDurationMs(refreshExpiresIn));
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      accessToken,
      accessExpiresInMs: parseDurationMs(jwtConfig.accessExpiresIn),
      refreshToken,
      refreshExpiresInMs: parseDurationMs(refreshExpiresIn),
      csrfToken: crypto.randomBytes(24).toString('hex'),
    };
  }

  async rotateRefreshToken(
    user: User & { role: { id: string; code: string } },
    oldTokenRecordId: string,
    oldTokenHash: string,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<IssuedTokens> {
    const tokens = await this.issueTokens(user, meta);
    await this.prisma.refreshToken.update({
      where: { id: oldTokenRecordId },
      data: { revoked: true, replacedByTokenHash: hashToken(tokens.refreshToken) },
    });
    return tokens;
  }

  async logout(userId: string | undefined, rawRefreshToken: string | undefined, meta: { ipAddress?: string; userAgent?: string }) {
    if (rawRefreshToken) {
      await this.prisma.refreshToken
        .updateMany({ where: { tokenHash: hashToken(rawRefreshToken) }, data: { revoked: true } })
        .catch(() => undefined);
    }
    await this.auditService.log({
      actorId: userId ?? null,
      action: AuditAction.LOGOUT,
      entityType: 'USER',
      entityId: userId,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({ where: { email: email.toLowerCase(), deletedAt: null, isActive: true } });
    if (!user) return; // do not reveal whether the account exists

    const rawToken = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000),
      },
    });

    await this.mailService.sendPasswordResetEmail(user.email, `${user.firstName}`, rawToken);
    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.PASSWORD_RESET,
      entityType: 'USER',
      entityId: user.id,
      description: 'Password reset requested',
    });
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: { passwordResetTokenHash: tokenHash, deletedAt: null },
    });
    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new BadRequestException('Reset link is invalid or has expired.');
    }

    await this.assertPasswordPolicy(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        mustChangePassword: false,
        lastPasswordChangeAt: new Date(),
      },
    });
    await this.prisma.refreshToken.updateMany({ where: { userId: user.id, revoked: false }, data: { revoked: true } });

    await this.auditService.log({
      actorId: user.id,
      action: AuditAction.PASSWORD_RESET,
      entityType: 'USER',
      entityId: user.id,
      description: 'Password reset completed',
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new BadRequestException('Current password is incorrect.');

    await this.assertPasswordPolicy(newPassword);
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash, mustChangePassword: false, lastPasswordChangeAt: new Date() },
    });

    await this.auditService.log({
      actorId: userId,
      action: AuditAction.PASSWORD_CHANGE,
      entityType: 'USER',
      entityId: userId,
    });
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

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { role: true, department: true },
    });
    const permissions = await this.loadPermissionCodes(user.roleId);
    const { passwordHash, passwordResetTokenHash, ...safe } = user;
    return { ...safe, permissions };
  }
}

/** Parses simple ms/jwt-style durations like "15m", "7d", "30d" into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(value.trim());
  if (!match) return 15 * 60_000;
  const n = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return n * multipliers[unit];
}
