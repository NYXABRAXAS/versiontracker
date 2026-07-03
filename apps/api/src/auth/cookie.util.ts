import { Response } from 'express';
import { AppConfig } from '../config/configuration';
import { IssuedTokens } from './auth.service';

export function setAuthCookies(res: Response, tokens: IssuedTokens, cookieConfig: AppConfig['cookie']) {
  const base = {
    httpOnly: true,
    secure: cookieConfig.secure,
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookie('access_token', tokens.accessToken, { ...base, maxAge: tokens.accessExpiresInMs });
  res.cookie('refresh_token', tokens.refreshToken, { ...base, maxAge: tokens.refreshExpiresInMs });
  res.cookie('csrf_token', tokens.csrfToken, {
    httpOnly: false,
    secure: cookieConfig.secure,
    sameSite: 'lax',
    path: '/',
    maxAge: tokens.refreshExpiresInMs,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
}
