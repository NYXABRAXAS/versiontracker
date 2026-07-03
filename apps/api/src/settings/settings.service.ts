import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { encryptSecret } from '../common/utils/crypto.util';

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async get() {
    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: {},
      create: { id: 'singleton' },
    });
    const { smtpPasswordEnc, ...safe } = settings;
    return { ...safe, smtpPasswordSet: !!smtpPasswordEnc };
  }

  async update(dto: UpdateSettingsDto, actorId: string) {
    const { smtpPassword, ...rest } = dto;
    const data: any = { ...rest, updatedById: actorId };
    if (smtpPassword) data.smtpPasswordEnc = encryptSecret(smtpPassword);

    const settings = await this.prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: data,
      create: { id: 'singleton', ...data },
    });

    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'SETTINGS', entityId: 'singleton', newValue: rest });
    const { smtpPasswordEnc, ...safe } = settings;
    return { ...safe, smtpPasswordSet: !!smtpPasswordEnc };
  }

  async setLogo(logoUrl: string, actorId: string) {
    await this.prisma.systemSettings.upsert({
      where: { id: 'singleton' },
      update: { companyLogoUrl: logoUrl, updatedById: actorId },
      create: { id: 'singleton', companyLogoUrl: logoUrl, updatedById: actorId },
    });
    await this.auditService.log({ actorId, action: AuditAction.UPDATE, entityType: 'SETTINGS', description: 'Company logo updated' });
    return { logoUrl };
  }
}
