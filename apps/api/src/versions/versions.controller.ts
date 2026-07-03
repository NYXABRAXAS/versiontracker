import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { VersionQueryDto } from './dto/version-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { exportToCsv, exportToExcel, exportToPdfTable, ExportColumn } from '../common/utils/export.util';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '@prisma/client';

const EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'versionNumber', label: 'Version' },
  { key: 'releaseName', label: 'Release Name' },
  { key: 'product.name', label: 'Product' },
  { key: 'environment.name', label: 'Environment' },
  { key: 'releaseType.name', label: 'Release Type' },
  { key: 'status.name', label: 'Status' },
  { key: 'priority.name', label: 'Priority' },
  { key: 'severity.name', label: 'Severity' },
  { key: 'developer.firstName', label: 'Developer' },
  { key: 'tester.firstName', label: 'Tester' },
  { key: 'releaseDate', label: 'Release Date' },
  { key: 'deploymentDate', label: 'Deployment Date' },
  { key: 'ticketNumber', label: 'Ticket' },
];

@ApiTags('versions')
@Controller('versions')
export class VersionsController {
  constructor(
    private versionsService: VersionsService,
    private auditService: AuditService,
  ) {}

  @RequirePermission('VERSIONS', 'view')
  @Get()
  findAll(@Query() query: VersionQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.versionsService.findAll(query, user.id);
  }

  @RequirePermission('VERSIONS', 'export')
  @Get('export')
  async export(@Query() query: VersionQueryDto & { format?: string }, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const versions = await this.versionsService.findAllForExport(query, user.id);
    const format = query.format || 'excel';
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      buffer = exportToCsv(versions, EXPORT_COLUMNS);
      contentType = 'text/csv';
      filename = 'versions.csv';
    } else if (format === 'pdf') {
      buffer = await exportToPdfTable('Version Report', versions, EXPORT_COLUMNS);
      contentType = 'application/pdf';
      filename = 'versions.pdf';
    } else {
      buffer = await exportToExcel(versions, EXPORT_COLUMNS, 'Versions');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = 'versions.xlsx';
    }

    await this.auditService.log({ actorId: user.id, action: AuditAction.EXPORT, entityType: 'VERSION', description: `Exported ${versions.length} versions as ${format}` });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @RequirePermission('VERSIONS', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.versionsService.findOne(id);
  }

  @RequirePermission('VERSIONS', 'create')
  @Audit('VERSION')
  @Post()
  create(@Body() dto: CreateVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.versionsService.create(dto, user.id);
  }

  @RequirePermission('VERSIONS', 'edit')
  @Audit('VERSION')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateVersionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.versionsService.update(id, dto, user.id);
  }

  @RequirePermission('VERSIONS', 'edit')
  @Patch(':id/rollback')
  rollback(@Param('id') id: string, @Body('rollbackVersionId') rollbackVersionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.versionsService.recordRollback(id, rollbackVersionId, user.id);
  }

  @RequirePermission('VERSIONS', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.versionsService.softDelete(id, user.id);
  }
}
