import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private service: NotificationsService) {}

  @RequirePermission('NOTIFICATIONS', 'view')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query('page') page?: string, @Query('pageSize') pageSize?: string, @Query('unreadOnly') unreadOnly?: string) {
    return this.service.findForUser(user.id, page ? Number(page) : 1, pageSize ? Number(pageSize) : 20, unreadOnly === 'true');
  }

  @RequirePermission('NOTIFICATIONS', 'edit')
  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.markRead(id, user.id);
  }

  @RequirePermission('NOTIFICATIONS', 'edit')
  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.service.markAllRead(user.id);
  }
}
