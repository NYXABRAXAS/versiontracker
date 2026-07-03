import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { SetRolePermissionsDto } from './dto/set-role-permissions.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @RequirePermission('ROLES', 'view')
  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @RequirePermission('ROLES', 'view')
  @Get('permissions/catalog')
  allPermissions() {
    return this.rolesService.allPermissions();
  }

  @RequirePermission('ROLES', 'view')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @RequirePermission('ROLES', 'create')
  @Audit('ROLE')
  @Post()
  create(@Body() dto: CreateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.create(dto, user.id);
  }

  @RequirePermission('ROLES', 'edit')
  @Audit('ROLE')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.update(id, dto, user.id);
  }

  @RequirePermission('ROLES', 'edit')
  @Patch(':id/permissions')
  setPermissions(@Param('id') id: string, @Body() dto: SetRolePermissionsDto, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.setPermissions(id, dto.permissionCodes, user.id);
  }

  @RequirePermission('ROLES', 'delete')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.remove(id, user.id);
  }
}
