import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private service: DashboardService) {}

  @RequirePermission('DASHBOARD', 'view')
  @Get('summary')
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.service.summary(user.id);
  }

  @RequirePermission('DASHBOARD', 'view')
  @Get('charts')
  charts(@CurrentUser() user: AuthenticatedUser) {
    return this.service.charts(user.id);
  }

  @RequirePermission('DASHBOARD', 'view')
  @Get('recent-activity')
  recentActivity() {
    return this.service.recentActivity();
  }

  @RequirePermission('DASHBOARD', 'view')
  @Get('latest-deployments')
  latestDeployments() {
    return this.service.latestDeployments();
  }

  @RequirePermission('DASHBOARD', 'view')
  @Get('pending-approvals')
  pendingApprovals() {
    return this.service.pendingApprovals();
  }
}
