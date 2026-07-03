import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppConfig } from '../config/configuration';
import { AuditAction } from '@prisma/client';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private configService: ConfigService<AppConfig, true>,
  ) {}

  @Cron(process.env.BACKUP_CRON || '0 2 * * *')
  async scheduledBackup() {
    if (this.configService.get('nodeEnv', { infer: true }) === 'test') return;
    await this.runBackup('SCHEDULED');
  }

  async runBackup(triggeredBy: string): Promise<{ success: boolean; fileName?: string; error?: string }> {
    const backupConfig = this.configService.get('backup', { infer: true });
    if (!fs.existsSync(backupConfig.dir)) fs.mkdirSync(backupConfig.dir, { recursive: true });

    const dbUrl = new URL(process.env.DATABASE_URL || '');
    const dbName = dbUrl.pathname.replace(/^\//, '');
    const fileName = `backup-${dbName}-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
    const filePath = path.join(backupConfig.dir, fileName);

    const historyRow = await this.prisma.backupHistory.create({
      data: { fileName, filePath, status: 'RUNNING', triggeredBy },
    });

    return new Promise((resolve) => {
      const args = [
        '-h', dbUrl.hostname,
        '-p', dbUrl.port || '5432',
        '-U', decodeURIComponent(dbUrl.username || 'postgres'),
        '-F', 'p',
        '-f', filePath,
        dbName,
      ];
      execFile(
        backupConfig.pgDumpPath,
        args,
        { env: { ...process.env, PGPASSWORD: decodeURIComponent(dbUrl.password || '') } },
        async (error) => {
          if (error) {
            this.logger.error(`Backup failed: ${error.message}`);
            await this.prisma.backupHistory.update({
              where: { id: historyRow.id },
              data: { status: 'FAILED', error: error.message, finishedAt: new Date() },
            });
            await this.auditService.log({ action: AuditAction.CREATE, entityType: 'BACKUP', entityId: historyRow.id, description: `Backup failed: ${error.message}` });
            resolve({ success: false, error: error.message });
            return;
          }
          const stats = fs.existsSync(filePath) ? fs.statSync(filePath) : null;
          await this.prisma.backupHistory.update({
            where: { id: historyRow.id },
            data: { status: 'SUCCESS', sizeBytes: stats?.size, finishedAt: new Date() },
          });
          await this.auditService.log({ action: AuditAction.CREATE, entityType: 'BACKUP', entityId: historyRow.id, description: `Backup completed: ${fileName}` });
          resolve({ success: true, fileName });
        },
      );
    });
  }

  findHistory() {
    return this.prisma.backupHistory.findMany({ orderBy: { startedAt: 'desc' }, take: 50 });
  }

  async getForDownload(id: string) {
    const row = await this.prisma.backupHistory.findUnique({ where: { id } });
    if (!row || row.status !== 'SUCCESS') throw new NotFoundException('Backup not found or not completed successfully');
    return row;
  }
}
