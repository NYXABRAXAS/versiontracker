import { Response } from 'express';
import { AppConfig } from '../config/configuration';
import { IssuedTokens } from './auth.service';

export function setAuthCookies(res: Response, tokens: IssuedTokens, cookieConfig: AppConfig['cookie']) {
  // SameSite=None is required when the API and web app are on different sites (e.g. separate
  // *.onrender.com subdomains) - browsers strip SameSite=Lax cookies from cross-site fetch/XHR
  // calls (Lax only allows them on top-level navigations). None requires Secure=true, which is
  // only safe to assume once we're actually served over HTTPS (cookieConfig.secure).
  const sameSite = cookieConfig.secure ? ('none' as const) : ('lax' as const);
  const base = {
    httpOnly: true,
    secure: cookieConfig.secure,
    sameSite,
    path: '/',
  };
  res.cookie('access_token', tokens.accessToken, { ...base, maxAge: tokens.accessExpiresInMs });
  res.cookie('refresh_token', tokens.refreshToken, { ...base, maxAge: tokens.refreshExpiresInMs });
  res.cookie('csrf_token', tokens.csrfToken, {
    httpOnly: false,
    secure: cookieConfig.secure,
    sameSite,
    path: '/',
    maxAge: tokens.refreshExpiresInMs,
  });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('csrf_token', { path: '/' });
}
