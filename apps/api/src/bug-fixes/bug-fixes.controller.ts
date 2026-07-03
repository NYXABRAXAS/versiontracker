import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BugFixesService } from './bug-fixes.service';
import { CreateBugFixDto } from './dto/create-bug-fix.dto';
import { UpdateBugFixDto } from './dto/update-bug-fix.dto';
import { BugFixQueryDto } from './dto/bug-fix-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('bug-fixes')
@Controller('bug-fixes')
export class BugFixesController {
  constructor(private service: BugFixesService) {}

  @RequirePermission('BUG_FIXES', 'view')
  @Get()
  findAll(@Query() query: BugFixQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('BUG_FIXES', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('BUG_FIXES', 'create')
  @Audit('BUG_FIX')
  @Post()
  create(@Body() dto: CreateBugFixDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('BUG_FIXES', 'edit')
  @Audit('BUG_FIX')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBugFixDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, dto, user.id);
  }

  @RequirePermission('BUG_FIXES', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.id);
  }
}
