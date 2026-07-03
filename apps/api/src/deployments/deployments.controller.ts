import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DeploymentsService } from './deployments.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { DeploymentQueryDto } from './dto/deployment-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('deployments')
@Controller('deployments')
export class DeploymentsController {
  constructor(private service: DeploymentsService) {}

  @RequirePermission('DEPLOYMENTS', 'view')
  @Get()
  findAll(@Query() query: DeploymentQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('DEPLOYMENTS', 'view')
  @Get('pipeline/:versionId')
  pipeline(@Param('versionId') versionId: string) {
    return this.service.pipelineForVersion(versionId);
  }

  @RequirePermission('DEPLOYMENTS', 'create')
  @Audit('DEPLOYMENT')
  @Post()
  create(@Body() dto: CreateDeploymentDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(dto, user.id);
  }

  @RequirePermission('DEPLOYMENTS', 'edit')
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user.id);
  }
}
