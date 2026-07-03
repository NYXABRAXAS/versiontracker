import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditAction } from '@prisma/client';
import { ReleaseNotesService } from './release-notes.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AuditService } from '../audit/audit.service';

@ApiTags('release-notes')
@Controller('release-notes')
export class ReleaseNotesController {
  constructor(
    private service: ReleaseNotesService,
    private auditService: AuditService,
  ) {}

  @RequirePermission('VERSIONS', 'view')
  @Get(':versionId')
  get(@Param('versionId') versionId: string) {
    return this.service.getReleaseNotesData(versionId);
  }

  @RequirePermission('VERSIONS', 'export')
  @Get(':versionId/export')
  async export(@Param('versionId') versionId: string, @Query('format') format: string, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        buffer = await this.service.exportCsv(versionId);
        contentType = 'text/csv';
        filename = 'release-notes.csv';
        break;
      case 'word':
        buffer = await this.service.exportWord(versionId);
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        filename = 'release-notes.docx';
        break;
      case 'excel':
        buffer = await this.service.exportExcel(versionId);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'release-notes.xlsx';
        break;
      default:
        buffer = await this.service.exportPdf(versionId);
        contentType = 'application/pdf';
        filename = 'release-notes.pdf';
    }

    await this.auditService.log({ actorId: user.id, action: AuditAction.EXPORT, entityType: 'VERSION', entityId: versionId, description: `Exported release notes as ${format}` });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @RequirePermission('VERSIONS', 'export')
  @Post(':versionId/email')
  email(@Param('versionId') versionId: string, @Body('recipients') recipients: string[]) {
    return this.service.emailReleaseNotes(versionId, recipients);
  }
}
