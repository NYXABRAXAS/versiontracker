import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuditAction } from '@prisma/client';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { exportToCsv, exportToExcel, exportToPdfTable } from '../common/utils/export.util';
import { AuditService } from '../audit/audit.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(
    private service: ReportsService,
    private auditService: AuditService,
  ) {}

  @RequirePermission('REPORTS', 'view')
  @Get(':type')
  build(@Param('type') type: string, @Query() query: ReportQueryDto) {
    return this.service.build(type, query);
  }

  @RequirePermission('REPORTS', 'export')
  @Get(':type/export')
  async export(@Param('type') type: string, @Query() query: ReportQueryDto, @CurrentUser() user: AuthenticatedUser, @Res() res: Response) {
    const report = await this.service.build(type, query);
    const format = query.format || 'excel';
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'csv') {
      buffer = exportToCsv(report.rows, report.columns);
      contentType = 'text/csv';
      filename = `${type}-report.csv`;
    } else if (format === 'pdf') {
      buffer = await exportToPdfTable(report.title, report.rows, report.columns);
      contentType = 'application/pdf';
      filename = `${type}-report.pdf`;
    } else {
      buffer = await exportToExcel(report.rows, report.columns, report.title.slice(0, 30));
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `${type}-report.xlsx`;
    }

    await this.auditService.log({ actorId: user.id, action: AuditAction.EXPORT, entityType: 'REPORT', description: `Exported ${report.title} as ${format}` });
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
