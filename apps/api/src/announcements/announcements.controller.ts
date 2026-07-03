import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('announcements')
@Controller('announcements')
export class AnnouncementsController {
  constructor(private service: AnnouncementsService) {}

  @RequirePermission('ANNOUNCEMENTS', 'view')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermission('ANNOUNCEMENTS', 'view')
  @Get('active')
  findActive() {
    return this.service.findActive();
  }

  @RequirePermission('ANNOUNCEMENTS', 'create')
  @Audit('ANNOUNCEMENT')
  @Post()
  create(@Body() dto: CreateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('ANNOUNCEMENTS', 'edit')
  @Audit('ANNOUNCEMENT')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, dto, user.id);
  }

  @RequirePermission('ANNOUNCEMENTS', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
