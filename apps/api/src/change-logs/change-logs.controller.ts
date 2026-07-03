import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChangeLogsService } from './change-logs.service';
import { CreateChangeLogDto } from './dto/create-change-log.dto';
import { UpdateChangeLogDto } from './dto/update-change-log.dto';
import { ChangeLogQueryDto } from './dto/change-log-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('change-logs')
@Controller('change-logs')
export class ChangeLogsController {
  constructor(private service: ChangeLogsService) {}

  @RequirePermission('CHANGE_LOGS', 'view')
  @Get()
  findAll(@Query() query: ChangeLogQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('CHANGE_LOGS', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @RequirePermission('CHANGE_LOGS', 'create')
  @Audit('CHANGE_LOG')
  @Post()
  create(@Body() dto: CreateChangeLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('CHANGE_LOGS', 'edit')
  @Audit('CHANGE_LOG')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateChangeLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.update(id, dto, user.id);
  }

  @RequirePermission('CHANGE_LOGS', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.softDelete(id, user.id);
  }
}
