import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Public()
  @Get('health')
  async health() {
    let dbStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'error';
    }
    return {
      status: dbStatus === 'ok' ? 'ok' : 'degraded',
      database: dbStatus,
      uptimeSeconds: Math.round(process.uptime()),
      memory: {
        usedMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        freeSystemMb: Math.round(os.freemem() / 1024 / 1024),
        totalSystemMb: Math.round(os.totalmem() / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
