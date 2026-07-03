export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiUrl: string;
  webUrl: string;
  corsOrigins: string[];
  jwt: {
    accessSecret: string;
    accessExpiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
    refreshExpiresInRememberMe: string;
  };
  cookie: {
    secret: string;
    secure: boolean;
  };
  csrfSecret: string;
  upload: {
    dir: string;
    maxSizeMb: number;
  };
  backup: {
    dir: string;
    cron: string;
    pgDumpPath: string;
  };
  smtp: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    password?: string;
    from?: string;
  };
  seed: {
    superAdminEmail: string;
    superAdminPassword: string;
  };
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_PORT || '4000', 10),
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  webUrl: process.env.WEB_URL || 'http://localhost:3000',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map((s) => s.trim()),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    refreshExpiresInRememberMe: process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER_ME || '30d',
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || 'dev-cookie-secret',
    secure: process.env.COOKIE_SECURE === 'true',
  },
  csrfSecret: process.env.CSRF_SECRET || 'dev-csrf-secret',
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSizeMb: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '25', 10),
  },
  backup: {
    dir: process.env.BACKUP_DIR || './backups',
    cron: process.env.BACKUP_CRON || '0 2 * * *',
    pgDumpPath: process.env.PG_DUMP_PATH || 'pg_dump',
  },
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
  seed: {
    superAdminEmail: process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@company.com',
    superAdminPassword: process.env.SEED_SUPER_ADMIN_PASSWORD || 'Admin@123',
  },
});
