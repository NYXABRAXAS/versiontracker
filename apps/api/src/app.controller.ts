import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getInfo() {
    return {
      name: 'LOS Version Management Portal API',
      status: 'ok',
      docs: '/api/docs',
    };
  }
}
