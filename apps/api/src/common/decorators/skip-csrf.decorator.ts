import { SetMetadata } from '@nestjs/common';

export const SKIP_CSRF_KEY = 'skipCsrf';

/** Exempts an endpoint from double-submit CSRF cookie verification (e.g. login, refresh). */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
