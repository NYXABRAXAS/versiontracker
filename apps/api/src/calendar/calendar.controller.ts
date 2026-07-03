import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { CreateFreezeWindowDto } from './dto/create-freeze-window.dto';
import { UpdateFreezeWindowDto } from './dto/update-freeze-window.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  constructor(private service: CalendarService) {}

  @RequirePermission('CALENDAR', 'view')
  @Get()
  getCalendar(@Query('dateFrom') dateFrom: string, @Query('dateTo') dateTo: string) {
    return this.service.getCalendar(dateFrom, dateTo);
  }

  @RequirePermission('CALENDAR', 'view')
  @Get('freeze-windows')
  findAllFreezeWindows() {
    return this.service.findAllFreezeWindows();
  }

  @RequirePermission('CALENDAR', 'create')
  @Post('freeze-windows')
  createFreezeWindow(@Body() dto: CreateFreezeWindowDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.createFreezeWindow(dto, user.id);
  }

  @RequirePermission('CALENDAR', 'edit')
  @Patch('freeze-windows/:id')
  updateFreezeWindow(@Param('id') id: string, @Body() dto: UpdateFreezeWindowDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.updateFreezeWindow(id, dto, user.id);
  }

  @RequirePermission('CALENDAR', 'delete')
  @Delete('freeze-windows/:id')
  removeFreezeWindow(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.removeFreezeWindow(id, user.id);
  }
}
