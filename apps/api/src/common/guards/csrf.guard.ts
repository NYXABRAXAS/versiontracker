import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SKIP_CSRF_KEY } from '../decorators/skip-csrf.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Double-submit-cookie CSRF protection. The csrf_token cookie (readable JS,
 * set on login/refresh) must be echoed back as the x-csrf-token header on any
 * state-changing request - a cross-site form/script can send the cookie
 * automatically but cannot read it to populate the header.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const request = context.switchToHttp().getRequest();
    if (skip || SAFE_METHODS.has(request.method)) return true;

    const cookieToken = request.cookies?.csrf_token;
    const headerToken = request.headers['x-csrf-token'];

    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
      throw new ForbiddenException('Invalid or missing CSRF token');
    }
    return true;
  }
}
