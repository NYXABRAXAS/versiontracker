import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getAccessScope, applyAccessScope } from '../common/utils/access-scope.util';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, userId: string) {
    if (!q || q.trim().length < 2) return { versions: [], changeLogs: [], bugFixes: [], users: [] };
    const term = q.trim();
    const scope = await getAccessScope(this.prisma, userId);
    const versionWhere: any = applyAccessScope(
      {
        deletedAt: null,
        OR: [
          { versionNumber: { contains: term, mode: 'insensitive' } },
          { releaseName: { contains: term, mode: 'insensitive' } },
          { ticketNumber: { contains: term, mode: 'insensitive' } },
          { gitCommitId: { contains: term, mode: 'insensitive' } },
          { buildNumber: { contains: term, mode: 'insensitive' } },
        ],
      },
      scope,
    );

    const [versions, changeLogs, bugFixes, users] = await Promise.all([
      this.prisma.version.findMany({
        where: versionWhere,
        take: 10,
        include: { product: true, environment: true, status: true },
        orderBy: { releaseDate: 'desc' },
      }),
      this.prisma.changeLog.findMany({
        where: {
          deletedAt: null,
          OR: [
            { title: { contains: term, mode: 'insensitive' } },
            { ticketNumber: { contains: term, mode: 'insensitive' } },
            { screenName: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { version: { select: { id: true, versionNumber: true, releaseName: true } } },
      }),
      this.prisma.bugFix.findMany({
        where: {
          deletedAt: null,
          OR: [
            { bugCode: { contains: term, mode: 'insensitive' } },
            { issue: { contains: term, mode: 'insensitive' } },
            { ticketNumber: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        include: { version: { select: { id: true, versionNumber: true, releaseName: true } } },
      }),
      this.prisma.user.findMany({
        where: {
          deletedAt: null,
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: { select: { name: true } } },
      }),
    ]);

    return { versions, changeLogs, bugFixes, users };
  }
}
