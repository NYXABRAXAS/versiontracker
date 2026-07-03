import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VERSION_INCLUDE } from '../versions/versions.service';

const SCALAR_FIELDS: { key: string; label: string }[] = [
  { key: 'releaseType.name', label: 'Release Type' },
  { key: 'environment.name', label: 'Environment' },
  { key: 'status.name', label: 'Status' },
  { key: 'priority.name', label: 'Priority' },
  { key: 'severity.name', label: 'Severity' },
  { key: 'buildNumber', label: 'Build Number' },
  { key: 'gitBranch', label: 'Git Branch' },
  { key: 'downtimeMinutes', label: 'Downtime (minutes)' },
  { key: 'breakingChanges', label: 'Breaking Changes' },
  { key: 'backwardCompatible', label: 'Backward Compatible' },
  { key: 'databaseChanges', label: 'Database Changes' },
  { key: 'apiChanges', label: 'API Changes' },
  { key: 'configurationChanges', label: 'Configuration Changes' },
];

function getPath(obj: any, path: string) {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

@Injectable()
export class ComparisonService {
  constructor(private prisma: PrismaService) {}

  async compare(versionAId: string, versionBId: string) {
    if (versionAId === versionBId) throw new BadRequestException('Choose two different versions to compare.');

    const [versionA, versionB] = await Promise.all([
      this.prisma.version.findFirst({ where: { id: versionAId, deletedAt: null }, include: VERSION_INCLUDE }),
      this.prisma.version.findFirst({ where: { id: versionBId, deletedAt: null }, include: VERSION_INCLUDE }),
    ]);
    if (!versionA || !versionB) throw new NotFoundException('One or both versions were not found.');

    const [changeLogsA, changeLogsB, bugFixesA, bugFixesB] = await Promise.all([
      this.prisma.changeLog.findMany({ where: { versionId: versionAId, deletedAt: null } }),
      this.prisma.changeLog.findMany({ where: { versionId: versionBId, deletedAt: null } }),
      this.prisma.bugFix.findMany({ where: { versionId: versionAId, deletedAt: null } }),
      this.prisma.bugFix.findMany({ where: { versionId: versionBId, deletedAt: null } }),
    ]);

    const fieldDiffs = SCALAR_FIELDS.map((f) => {
      const valueA = getPath(versionA, f.key);
      const valueB = getPath(versionB, f.key);
      return { field: f.key, label: f.label, valueA, valueB, changed: JSON.stringify(valueA) !== JSON.stringify(valueB) };
    });

    const titlesA = new Set(changeLogsA.map((c) => c.title.trim().toLowerCase()));
    const titlesB = new Set(changeLogsB.map((c) => c.title.trim().toLowerCase()));
    const addedFeatures = changeLogsB.filter((c) => !titlesA.has(c.title.trim().toLowerCase()));
    const removedFeatures = changeLogsA.filter((c) => !titlesB.has(c.title.trim().toLowerCase()));
    const modifiedFeatures = changeLogsB.filter((c) => {
      const match = changeLogsA.find((a) => a.title.trim().toLowerCase() === c.title.trim().toLowerCase());
      return match && (match.description !== c.description || match.newBehaviour !== c.newBehaviour);
    });

    const bugCodesA = new Set(bugFixesA.map((b) => b.issue.trim().toLowerCase()));
    const bugFixesOnlyInB = bugFixesB.filter((b) => !bugCodesA.has(b.issue.trim().toLowerCase()));

    return {
      versionA,
      versionB,
      fieldDiffs,
      changeLogSummary: { addedFeatures, removedFeatures, modifiedFeatures },
      bugFixSummary: { fixedInB: bugFixesOnlyInB, totalA: bugFixesA.length, totalB: bugFixesB.length },
    };
  }
}
