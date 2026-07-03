import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MastersService } from './masters.service';
import { CreateMasterTypeDto, UpdateMasterTypeDto } from './dto/master-type.dto';
import { CreateMasterItemDto, UpdateMasterItemDto } from './dto/master-item.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('masters')
@Controller('masters')
export class MastersController {
  constructor(private mastersService: MastersService) {}

  @RequirePermission('MASTERS', 'view')
  @Get('types')
  findAllTypes() {
    return this.mastersService.findAllTypes();
  }

  @RequirePermission('MASTERS', 'view')
  @Get('types/:id/items')
  findAllItemsForType(@Param('id') id: string) {
    return this.mastersService.findAllItemsForType(id);
  }

  // Public within the authenticated app (any logged-in role) - dropdowns everywhere need this.
  @Get('items/by-code/:code')
  findItemsByCode(@Param('code') code: string, @Query('includeInactive') includeInactive?: string) {
    return this.mastersService.findItemsByTypeCode(code, includeInactive === 'true');
  }

  @RequirePermission('MASTERS', 'create')
  @Audit('MASTER_TYPE')
  @Post('types')
  createType(@Body() dto: CreateMasterTypeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.createType(dto, user.id);
  }

  @RequirePermission('MASTERS', 'edit')
  @Audit('MASTER_TYPE')
  @Patch('types/:id')
  updateType(@Param('id') id: string, @Body() dto: UpdateMasterTypeDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.updateType(id, dto, user.id);
  }

  @RequirePermission('MASTERS', 'delete')
  @Delete('types/:id')
  removeType(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.removeType(id, user.id);
  }

  @RequirePermission('MASTERS', 'create')
  @Audit('MASTER_ITEM')
  @Post('items')
  createItem(@Body() dto: CreateMasterItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.createItem(dto, user.id);
  }

  @RequirePermission('MASTERS', 'edit')
  @Audit('MASTER_ITEM')
  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateMasterItemDto, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.updateItem(id, dto, user.id);
  }

  @RequirePermission('MASTERS', 'delete')
  @Delete('items/:id')
  removeItem(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mastersService.removeItem(id, user.id);
  }
}
