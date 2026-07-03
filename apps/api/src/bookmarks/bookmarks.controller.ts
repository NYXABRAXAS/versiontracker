import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BookmarksService } from './bookmarks.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private service: BookmarksService) {}

  @RequirePermission('BOOKMARKS', 'view')
  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findForUser(user.id);
  }

  @RequirePermission('BOOKMARKS', 'create')
  @Post('toggle')
  toggle(@Body('versionId') versionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.toggle(user.id, versionId);
  }
}
