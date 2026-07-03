import { Controller, Get, Patch, Body, Post, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import * as path from 'path';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @RequirePermission('SETTINGS', 'view')
  @Get()
  get() {
    return this.service.get();
  }

  @RequirePermission('SETTINGS', 'edit')
  @Patch()
  update(@Body() dto: UpdateSettingsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(dto, user.id);
  }

  @RequirePermission('SETTINGS', 'edit')
  @Post('logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      storage: diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, `logo-${Date.now()}${path.extname(file.originalname)}`),
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => cb(null, IMAGE_MIME.has(file.mimetype)),
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: AuthenticatedUser) {
    if (!file) throw new BadRequestException('No logo file uploaded, or file type not supported.');
    return this.service.setLogo(`/uploads/${file.filename}`, user.id);
  }
}
