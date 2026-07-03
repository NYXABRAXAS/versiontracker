import { BadRequestException, Controller, Delete, Get, Param, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import type { Response } from 'express';
import * as path from 'path';
import * as crypto from 'crypto';
import { AttachmentsService } from './attachments.service';
import { AttachmentQueryDto } from './dto/attachment-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AttachmentEntityType } from '@prisma/client';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '25', 10);

@ApiTags('attachments')
@Controller('attachments')
export class AttachmentsController {
  constructor(private service: AttachmentsService) {}

  @RequirePermission('ATTACHMENTS', 'view')
  @Get()
  findForEntity(@Query() query: AttachmentQueryDto) {
    return this.service.findForEntity(query.entityType, query.entityId);
  }

  @RequirePermission('ATTACHMENTS', 'create')
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname);
          cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
        },
      }),
      limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('entityType') entityType: AttachmentEntityType,
    @Query('entityId') entityId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('No file uploaded.');
    if (!entityType || !entityId) throw new BadRequestException('entityType and entityId are required.');
    return this.service.recordUpload(file, entityType, entityId, user.id);
  }

  @RequirePermission('ATTACHMENTS', 'view')
  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.service.getForDownload(id);
    res.download(attachment.filePath, attachment.originalName);
  }

  @RequirePermission('ATTACHMENTS', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
