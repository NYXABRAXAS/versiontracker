import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ComparisonService } from './comparison.service';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('comparison')
@Controller('comparison')
export class ComparisonController {
  constructor(private service: ComparisonService) {}

  @RequirePermission('COMPARISON', 'view')
  @Get()
  compare(@Query('versionAId') versionAId: string, @Query('versionBId') versionBId: string) {
    return this.service.compare(versionAId, versionBId);
  }
}
