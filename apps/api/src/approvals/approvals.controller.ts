import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApprovalStatus } from '@prisma/client';
import { ApprovalsService } from './approvals.service';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { DecideApprovalDto } from './dto/decide-approval.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('approvals')
@Controller('approvals')
export class ApprovalsController {
  constructor(private service: ApprovalsService) {}

  @RequirePermission('APPROVALS', 'view')
  @Get()
  findAll(@Query('status') status?: ApprovalStatus) {
    return this.service.findAll(status);
  }

  @Post()
  create(@Body() dto: CreateApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('APPROVALS', 'approve')
  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body() dto: DecideApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.approve(id, dto.comments, user.id);
  }

  @RequirePermission('APPROVALS', 'approve')
  @Patch(':id/reject')
  reject(@Param('id') id: string, @Body() dto: DecideApprovalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.reject(id, dto.comments, user.id);
  }
}
