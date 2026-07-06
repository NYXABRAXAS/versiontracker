import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @RequirePermission('USERS', 'view')
  @Get()
  findAll(@Query() query: UserListQueryDto) {
    return this.usersService.findAll(query);
  }

  @RequirePermission('USERS', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @RequirePermission('USERS', 'create')
  @Audit('USER')
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, user.id);
  }

  @RequirePermission('USERS', 'edit')
  @Audit('USER')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.update(id, dto, user.id);
  }

  @RequirePermission('USERS', 'edit')
  @Patch(':id/enable')
  enable(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.setActive(id, true, user.id);
  }

  @RequirePermission('USERS', 'edit')
  @Patch(':id/disable')
  disable(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.setActive(id, false, user.id);
  }

  @RequirePermission('USERS', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.softDelete(id, user.id);
  }

  @RequirePermission('USERS', 'edit')
  @Post(':id/reset-password')
  resetPassword(@Param('id') id: string, @Body('password') password: string | undefined, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.adminResetPassword(id, user.id, password);
  }
}
