import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AppConfig } from '../../config/configuration';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  roleCode: string;
  permissions: string[];
  mustChangePassword: boolean;
}

function cookieExtractor(req: Request): string | null {
  return req?.cookies?.access_token || null;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt', { infer: true }).accessSecret,
    });
  }

  async validate(payload: AccessTokenPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      roleId: payload.roleId,
      roleCode: payload.roleCode,
      permissions: payload.permissions,
      mustChangePassword: payload.mustChangePassword,
    };
  }
}
