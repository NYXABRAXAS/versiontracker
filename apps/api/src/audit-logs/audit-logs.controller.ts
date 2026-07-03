import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { exportToCsv, exportToExcel, ExportColumn } from '../common/utils/export.util';

const COLUMNS: ExportColumn[] = [
  { key: 'createdAt', label: 'Timestamp' },
  { key: 'actor.firstName', label: 'Actor First Name' },
  { key: 'actor.email', label: 'Actor Email' },
  { key: 'action', label: 'Action' },
  { key: 'entityType', label: 'Entity Type' },
  { key: 'entityId', label: 'Entity ID' },
  { key: 'description', label: 'Description' },
  { key: 'ipAddress', label: 'IP Address' },
  { key: 'userAgent', label: 'Browser' },
];

@ApiTags('audit-logs')
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private service: AuditLogsService) {}

  @RequirePermission('AUDIT_LOGS', 'view')
  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('AUDIT_LOGS', 'export')
  @Get('export')
  async export(@Query() query: AuditLogQueryDto & { format?: string }, @Res() res: Response) {
    const rows = await this.service.findAllForExport(query);
    const format = query.format || 'excel';
    const buffer = format === 'csv' ? exportToCsv(rows, COLUMNS) : await exportToExcel(rows, COLUMNS, 'Audit Logs');
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs.${format === 'csv' ? 'csv' : 'xlsx'}"`);
    res.send(buffer);
  }
}
