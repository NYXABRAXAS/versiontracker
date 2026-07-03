import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExportColumn } from '../common/utils/export.util';
import { ReportQueryDto } from './dto/report-query.dto';
import { VERSION_INCLUDE } from '../versions/versions.service';

export interface ReportResult {
  title: string;
  columns: ExportColumn[];
  rows: Record<string, any>[];
}

const VERSION_COLUMNS: ExportColumn[] = [
  { key: 'versionNumber', label: 'Version' },
  { key: 'releaseName', label: 'Release Name' },
  { key: 'product.name', label: 'Product' },
  { key: 'environment.name', label: 'Environment' },
  { key: 'releaseType.name', label: 'Release Type' },
  { key: 'status.name', label: 'Status' },
  { key: 'developer.firstName', label: 'Developer' },
  { key: 'tester.firstName', label: 'Tester' },
  { key: 'releaseDate', label: 'Release Date' },
];

function dateRangeWhere(query: ReportQueryDto, field = 'releaseDate') {
  const where: any = {};
  if (query.dateFrom || query.dateTo) {
    where[field] = {};
    if (query.dateFrom) where[field].gte = new Date(query.dateFrom);
    if (query.dateTo) where[field].lte = new Date(query.dateTo);
  }
  return where;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async build(type: string, query: ReportQueryDto): Promise<ReportResult> {
    const baseVersionWhere: any = {
      deletedAt: null,
      ...dateRangeWhere(query),
      ...(query.productId ? { productId: query.productId } : {}),
      ...(query.environmentId ? { environmentId: query.environmentId } : {}),
    };

    switch (type) {
      case 'release':
      case 'version-history': {
        const versions = await this.prisma.version.findMany({ where: baseVersionWhere, include: VERSION_INCLUDE, orderBy: { releaseDate: 'desc' } });
        return { title: type === 'release' ? 'Release Report' : 'Version History', columns: VERSION_COLUMNS, rows: versions };
      }

      case 'developer': {
        const versions = await this.prisma.version.findMany({ where: baseVersionWhere, include: { developer: true, product: true } });
        const map = new Map<string, { developer: string; totalVersions: number; products: Set<string> }>();
        for (const v of versions) {
          const name = v.developer ? `${v.developer.firstName} ${v.developer.lastName}` : 'Unassigned';
          if (!map.has(name)) map.set(name, { developer: name, totalVersions: 0, products: new Set() });
          const entry = map.get(name)!;
          entry.totalVersions += 1;
          if (v.product) entry.products.add(v.product.name);
        }
        const rows = Array.from(map.values()).map((r) => ({ developer: r.developer, totalVersions: r.totalVersions, products: Array.from(r.products).join(', ') }));
        return {
          title: 'Developer Report',
          columns: [
            { key: 'developer', label: 'Developer' },
            { key: 'totalVersions', label: 'Versions Delivered' },
            { key: 'products', label: 'Products Worked On' },
          ],
          rows,
        };
      }

      case 'qa': {
        const bugFixes = await this.prisma.bugFix.findMany({
          where: { deletedAt: null, ...dateRangeWhere(query, 'createdAt') },
          include: { testedBy: true, severity: true, status: true },
        });
        const map = new Map<string, { tester: string; totalTested: number; critical: number }>();
        for (const b of bugFixes) {
          const name = b.testedBy ? `${b.testedBy.firstName} ${b.testedBy.lastName}` : 'Unassigned';
          if (!map.has(name)) map.set(name, { tester: name, totalTested: 0, critical: 0 });
          const entry = map.get(name)!;
          entry.totalTested += 1;
          if (b.severity?.name === 'Critical' || b.severity?.name === 'Blocker') entry.critical += 1;
        }
        return {
          title: 'QA Report',
          columns: [
            { key: 'tester', label: 'QA Engineer' },
            { key: 'totalTested', label: 'Bugs Tested' },
            { key: 'critical', label: 'Critical/Blocker Bugs' },
          ],
          rows: Array.from(map.values()),
        };
      }

      case 'product': {
        const grouped = await this.prisma.version.groupBy({ by: ['productId'], where: baseVersionWhere, _count: { _all: true } });
        const products = await this.prisma.masterItem.findMany({ where: { id: { in: grouped.map((g) => g.productId) } } });
        const nameById = new Map(products.map((p) => [p.id, p.name]));
        return {
          title: 'Product Report',
          columns: [
            { key: 'product', label: 'Product' },
            { key: 'totalVersions', label: 'Total Versions' },
          ],
          rows: grouped.map((g) => ({ product: nameById.get(g.productId) || 'Unknown', totalVersions: g._count._all })),
        };
      }

      case 'module': {
        const grouped = await this.prisma.changeLog.groupBy({ by: ['moduleId'], where: { deletedAt: null, moduleId: { not: null } }, _count: { _all: true } });
        const modules = await this.prisma.masterItem.findMany({ where: { id: { in: grouped.map((g) => g.moduleId as string) } } });
        const nameById = new Map(modules.map((m) => [m.id, m.name]));
        return {
          title: 'Module Report',
          columns: [
            { key: 'module', label: 'Module' },
            { key: 'totalChanges', label: 'Total Changes' },
          ],
          rows: grouped.map((g) => ({ module: nameById.get(g.moduleId as string) || 'Unknown', totalChanges: g._count._all })),
        };
      }

      case 'environment': {
        const grouped = await this.prisma.version.groupBy({ by: ['environmentId'], where: baseVersionWhere, _count: { _all: true } });
        const envs = await this.prisma.masterItem.findMany({ where: { id: { in: grouped.map((g) => g.environmentId) } } });
        const nameById = new Map(envs.map((e) => [e.id, e.name]));
        return {
          title: 'Environment Report',
          columns: [
            { key: 'environment', label: 'Environment' },
            { key: 'totalVersions', label: 'Total Versions' },
          ],
          rows: grouped.map((g) => ({ environment: nameById.get(g.environmentId) || 'Unknown', totalVersions: g._count._all })),
        };
      }

      case 'deployment': {
        const deployments = await this.prisma.deploymentHistory.findMany({
          where: { deletedAt: null, ...dateRangeWhere(query, 'deployedAt') },
          include: { environment: true, version: { include: { product: true } }, deployedBy: true },
          orderBy: { deployedAt: 'desc' },
        });
        return {
          title: 'Deployment Report',
          columns: [
            { key: 'version.versionNumber', label: 'Version' },
            { key: 'version.product.name', label: 'Product' },
            { key: 'environment.name', label: 'Environment' },
            { key: 'deployedAt', label: 'Deployed At' },
            { key: 'result', label: 'Result' },
            { key: 'durationMinutes', label: 'Duration (min)' },
          ],
          rows: deployments,
        };
      }

      case 'bug-summary': {
        const bugFixes = await this.prisma.bugFix.findMany({
          where: { deletedAt: null, ...dateRangeWhere(query, 'createdAt') },
          include: { severity: true, priority: true, status: true, module: true },
        });
        return {
          title: 'Bug Summary Report',
          columns: [
            { key: 'bugCode', label: 'Bug' },
            { key: 'issue', label: 'Issue' },
            { key: 'module.name', label: 'Module' },
            { key: 'severity.name', label: 'Severity' },
            { key: 'priority.name', label: 'Priority' },
            { key: 'status.name', label: 'Status' },
          ],
          rows: bugFixes,
        };
      }

      case 'monthly':
      case 'quarterly':
      case 'yearly': {
        const versions = await this.prisma.version.findMany({ where: baseVersionWhere, select: { releaseDate: true } });
        const buckets = new Map<string, number>();
        for (const v of versions) {
          if (!v.releaseDate) continue;
          const d = v.releaseDate;
          let key: string;
          if (type === 'monthly') key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          else if (type === 'quarterly') key = `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
          else key = `${d.getFullYear()}`;
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
        return {
          title: `${type[0].toUpperCase()}${type.slice(1)} Report`,
          columns: [
            { key: 'period', label: 'Period' },
            { key: 'totalReleases', label: 'Total Releases' },
          ],
          rows: Array.from(buckets.entries())
            .sort(([a], [b]) => (a > b ? 1 : -1))
            .map(([period, totalReleases]) => ({ period, totalReleases })),
        };
      }

      default:
        throw new BadRequestException(`Unknown report type: ${type}`);
    }
  }
}
