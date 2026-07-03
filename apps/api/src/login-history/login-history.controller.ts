import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LoginHistoryService } from './login-history.service';
import { LoginHistoryQueryDto } from './dto/login-history-query.dto';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@ApiTags('login-history')
@Controller('login-history')
export class LoginHistoryController {
  constructor(private service: LoginHistoryService) {}

  @RequirePermission('LOGIN_HISTORY', 'view')
  @Get()
  findAll(@Query() query: LoginHistoryQueryDto) {
    return this.service.findAll(query);
  }
}
