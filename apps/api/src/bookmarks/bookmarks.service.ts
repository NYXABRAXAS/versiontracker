import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VERSION_INCLUDE } from '../versions/versions.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async findForUser(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      include: { version: { include: VERSION_INCLUDE } },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((b) => b.version);
  }

  async toggle(userId: string, versionId: string) {
    const existing = await this.prisma.bookmark.findUnique({ where: { userId_versionId: { userId, versionId } } });
    if (existing) {
      await this.prisma.bookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false };
    }
    await this.prisma.bookmark.create({ data: { userId, versionId } });
    return { bookmarked: true };
  }
}
