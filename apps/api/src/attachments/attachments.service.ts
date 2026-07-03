import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { AuditAction, AttachmentEntityType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { categoryForMime } from './attachments.constants';

@Injectable()
export class AttachmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findForEntity(entityType: AttachmentEntityType, entityId: string) {
    return this.prisma.attachment.findMany({
      where: { entityType, entityId, deletedAt: null },
      include: { uploadedBy: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async recordUpload(
    file: Express.Multer.File,
    entityType: AttachmentEntityType,
    entityId: string,
    actorId: string,
  ) {
    const attachment = await this.prisma.attachment.create({
      data: {
        entityType,
        entityId,
        category: categoryForMime(file.mimetype, file.originalname),
        fileName: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedById: actorId,
      },
    });

    await this.auditService.log({
      actorId,
      action: AuditAction.CREATE,
      entityType: 'ATTACHMENT',
      entityId: attachment.id,
      description: `Uploaded ${file.originalname} for ${entityType} ${entityId}`,
      newValue: { fileName: attachment.originalName, sizeBytes: attachment.sizeBytes },
    });

    return attachment;
  }

  async getForDownload(id: string) {
    const attachment = await this.prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    return attachment;
  }

  async remove(id: string, actorId: string) {
    const attachment = await this.prisma.attachment.findFirst({ where: { id, deletedAt: null } });
    if (!attachment) throw new NotFoundException('Attachment not found');
    await this.prisma.attachment.update({ where: { id }, data: { deletedAt: new Date() } });
    fs.unlink(attachment.filePath, () => undefined);
    await this.auditService.log({ actorId, action: AuditAction.DELETE, entityType: 'ATTACHMENT', entityId: id, description: attachment.originalName });
    return { success: true };
  }
}
