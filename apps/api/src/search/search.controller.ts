import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private service: SearchService) {}

  @RequirePermission('SEARCH', 'view')
  @Get()
  search(@Query('q') q: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.search(q, user.id);
  }
}
