import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/dto/pagination-query.dto';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async notify(userId: string, type: NotificationType, title: string, message: string, entityType?: string, entityId?: string) {
    return this.prisma.notification.create({ data: { userId, type, title, message, entityType, entityId } });
  }

  async notifyMany(userIds: string[], type: NotificationType, title: string, message: string, entityType?: string, entityId?: string) {
    if (!userIds.length) return;
    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, type, title, message, entityType, entityId })),
    });
  }

  async findForUser(userId: string, page = 1, pageSize = 20, unreadOnly = false) {
    const where: any = { userId, ...(unreadOnly ? { isRead: false } : {}) };
    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { ...paginate(data, total, page, pageSize), unreadCount };
  }

  async markRead(id: string, userId: string) {
    await this.prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true, readAt: new Date() } });
    return { success: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
    return { success: true };
  }
}
