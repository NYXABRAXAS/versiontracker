import { Controller, Get, Param, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { BackupService } from './backup.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('backup')
@Controller('backup')
export class BackupController {
  constructor(private service: BackupService) {}

  @RequirePermission('BACKUP', 'view')
  @Get()
  findHistory() {
    return this.service.findHistory();
  }

  @RequirePermission('BACKUP', 'create')
  @Post('run')
  run() {
    return this.service.runBackup('MANUAL');
  }

  @RequirePermission('BACKUP', 'export')
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const row = await this.service.getForDownload(id);
    res.download(row.filePath, row.fileName);
  }
}
