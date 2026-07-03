import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination-query.dto';
import { LoginHistoryQueryDto } from './dto/login-history-query.dto';

@Injectable()
export class LoginHistoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: LoginHistoryQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;
    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    if (query.search) where.email = { contains: query.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.loginHistory.count({ where }),
    ]);
    return paginate(data, total, page, pageSize);
  }
}
