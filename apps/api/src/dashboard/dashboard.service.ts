import { Injectable } from '@nestjs/common';
import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getAccessScope, applyAccessScope } from '../common/utils/access-scope.util';

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function monthsAgo(n: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  private async envIdByCode(code: string) {
    const item = await this.prisma.masterItem.findFirst({ where: { code, masterType: { code: 'ENVIRONMENT' } } });
    return item?.id;
  }

  private async releaseTypeIdsByNames(names: string[]) {
    const items = await this.prisma.masterItem.findMany({
      where: { name: { in: names }, masterType: { code: 'RELEASE_TYPE' } },
    });
    return items.map((i) => i.id);
  }

  async summary(userId: string) {
    const scope = await getAccessScope(this.prisma, userId);
    const base = applyAccessScope({ deletedAt: null }, scope);

    const [devEnvId, uatEnvId, prodEnvId] = await Promise.all([
      this.envIdByCode('DEV_PRO'),
      this.envIdByCode('UAT'),
      this.envIdByCode('PRODUCTION'),
    ]);
    const [hotfixTypeIds, rollbackTypeIds, bugFixTypeIds, majorTypeIds, minorTypeIds] = await Promise.all([
      this.releaseTypeIdsByNames(['Hot Fix']),
      this.releaseTypeIdsByNames(['Rollback']),
      this.releaseTypeIdsByNames(['Bug Fix']),
      this.releaseTypeIdsByNames(['Major Release']),
      this.releaseTypeIdsByNames(['Minor Release']),
    ]);

    const today = startOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalVersions,
      todaysReleases,
      pendingReleases,
      productionReleases,
      uatReleases,
      developmentReleases,
      rollbackCount,
      hotfixCount,
      bugFixCount,
      majorReleases,
      minorReleases,
      productsCount,
    ] = await Promise.all([
      this.prisma.version.count({ where: base }),
      this.prisma.version.count({ where: { ...base, releaseDate: { gte: today, lt: tomorrow } } }),
      this.prisma.version.count({ where: { ...base, status: { code: { in: ['DRAFT', 'PLANNED', 'IN_DEVELOPMENT', 'IN_QA', 'READY_FOR_UAT', 'IN_UAT'] } } } }),
      prodEnvId ? this.prisma.version.count({ where: { ...base, environmentId: prodEnvId } }) : 0,
      uatEnvId ? this.prisma.version.count({ where: { ...base, environmentId: uatEnvId } }) : 0,
      devEnvId ? this.prisma.version.count({ where: { ...base, environmentId: devEnvId } }) : 0,
      rollbackTypeIds.length ? this.prisma.version.count({ where: { ...base, releaseTypeId: { in: rollbackTypeIds } } }) : 0,
      hotfixTypeIds.length ? this.prisma.version.count({ where: { ...base, releaseTypeId: { in: hotfixTypeIds } } }) : 0,
      bugFixTypeIds.length ? this.prisma.version.count({ where: { ...base, releaseTypeId: { in: bugFixTypeIds } } }) : 0,
      majorTypeIds.length ? this.prisma.version.count({ where: { ...base, releaseTypeId: { in: majorTypeIds } } }) : 0,
      minorTypeIds.length ? this.prisma.version.count({ where: { ...base, releaseTypeId: { in: minorTypeIds } } }) : 0,
      this.prisma.masterItem.count({ where: { masterType: { code: 'PRODUCT' }, isActive: true, deletedAt: null } }),
    ]);

    return {
      totalVersions,
      todaysReleases,
      pendingReleases,
      productionReleases,
      uatReleases,
      developmentReleases,
      rollbackCount,
      hotfixCount,
      bugFixCount,
      majorReleases,
      minorReleases,
      productsCount,
    };
  }

  async charts(userId: string) {
    const scope = await getAccessScope(this.prisma, userId);
    const base = applyAccessScope({ deletedAt: null }, scope);

    const since = monthsAgo(11);
    const versions = await this.prisma.version.findMany({
      where: { ...base, releaseDate: { gte: since } },
      select: {
        releaseDate: true,
        productId: true,
        environmentId: true,
        developerId: true,
        product: { select: { name: true } },
        environment: { select: { name: true } },
        developer: { select: { firstName: true, lastName: true } },
      },
    });

    const monthlyMap = new Map<string, number>();
    const productMap = new Map<string, number>();
    const envMap = new Map<string, number>();
    const developerMap = new Map<string, number>();

    for (const v of versions) {
      if (v.releaseDate) {
        const key = `${v.releaseDate.getFullYear()}-${String(v.releaseDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      }
      const productName = v.product?.name || 'Unknown';
      productMap.set(productName, (productMap.get(productName) || 0) + 1);
      const envName = v.environment?.name || 'Unknown';
      envMap.set(envName, (envMap.get(envName) || 0) + 1);
      const devName = v.developer ? `${v.developer.firstName} ${v.developer.lastName}` : 'Unassigned';
      developerMap.set(devName, (developerMap.get(devName) || 0) + 1);
    }

    const monthlyReleases = Array.from({ length: 12 }).map((_, i) => {
      const d = monthsAgo(11 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { month: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }), count: monthlyMap.get(key) || 0 };
    });

    const bugFixes = await this.prisma.bugFix.findMany({
      where: { createdAt: { gte: since }, deletedAt: null },
      select: { createdAt: true },
    });
    const bugMonthlyMap = new Map<string, number>();
    for (const b of bugFixes) {
      const key = `${b.createdAt.getFullYear()}-${String(b.createdAt.getMonth() + 1).padStart(2, '0')}`;
      bugMonthlyMap.set(key, (bugMonthlyMap.get(key) || 0) + 1);
    }
    const bugFixTrend = Array.from({ length: 12 }).map((_, i) => {
      const d = monthsAgo(11 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return { month: d.toLocaleString('en-US', { month: 'short', year: '2-digit' }), count: bugMonthlyMap.get(key) || 0 };
    });

    const topModulesRaw = await this.prisma.changeLog.groupBy({
      by: ['moduleId'],
      where: { deletedAt: null, moduleId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { moduleId: 'desc' } },
      take: 8,
    });
    const moduleItems = await this.prisma.masterItem.findMany({ where: { id: { in: topModulesRaw.map((m) => m.moduleId as string) } } });
    const moduleNameById = new Map(moduleItems.map((m) => [m.id, m.name]));
    const topUpdatedModules = topModulesRaw.map((m) => ({ module: moduleNameById.get(m.moduleId as string) || 'Unknown', count: m._count._all }));

    return {
      monthlyReleases,
      productWiseReleases: Array.from(productMap.entries()).map(([name, count]) => ({ name, count })),
      environmentWiseReleases: Array.from(envMap.entries()).map(([name, count]) => ({ name, count })),
      releaseTrend: monthlyReleases,
      developerContribution: Array.from(developerMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      bugFixTrend,
      topUpdatedModules,
    };
  }

  async recentActivity() {
    return this.prisma.auditLog.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    });
  }

  async latestDeployments() {
    return this.prisma.deploymentHistory.findMany({
      take: 10,
      orderBy: { deployedAt: 'desc' },
      include: {
        environment: true,
        version: { select: { id: true, versionNumber: true, releaseName: true, product: { select: { name: true } } } },
        deployedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async pendingApprovals() {
    return this.prisma.approvalRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      orderBy: { requestedAt: 'desc' },
      include: { requestedBy: { select: { firstName: true, lastName: true } } },
    });
  }
}
