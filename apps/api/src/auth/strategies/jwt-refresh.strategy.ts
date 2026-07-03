import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as crypto from 'crypto';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // random id, hashed and stored in refresh_tokens.tokenHash
}

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.refresh_token || null;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt', { infer: true }).refreshSecret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshTokenPayload) {
    const rawToken = cookieExtractor(req);
    if (!rawToken) throw new UnauthorizedException('Missing refresh token');

    const tokenHash = hashToken(rawToken);
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!record || record.revoked || record.expiresAt < new Date() || record.userId !== payload.sub) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: payload.sub, deletedAt: null, isActive: true },
      include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
    });
    if (!user) throw new UnauthorizedException('User not found or inactive');

    return { user, tokenRecord: record };
  }
}
