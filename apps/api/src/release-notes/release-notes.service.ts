import { Injectable, NotFoundException } from '@nestjs/common';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { VERSION_INCLUDE } from '../versions/versions.service';
import { exportToCsv, exportToExcel, exportToPdfTable, ExportColumn } from '../common/utils/export.util';

const CHANGE_LOG_COLUMNS: ExportColumn[] = [
  { key: 'title', label: 'Title' },
  { key: 'module.name', label: 'Module' },
  { key: 'newBehaviour', label: 'New Behaviour' },
  { key: 'ticketNumber', label: 'Ticket' },
];

const BUG_FIX_COLUMNS: ExportColumn[] = [
  { key: 'bugCode', label: 'Bug' },
  { key: 'issue', label: 'Issue' },
  { key: 'severity.name', label: 'Severity' },
  { key: 'status.name', label: 'Status' },
];

@Injectable()
export class ReleaseNotesService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async getReleaseNotesData(versionId: string) {
    const version = await this.prisma.version.findFirst({ where: { id: versionId, deletedAt: null }, include: VERSION_INCLUDE });
    if (!version) throw new NotFoundException('Version not found');

    const [changeLogs, bugFixes] = await Promise.all([
      this.prisma.changeLog.findMany({ where: { versionId, deletedAt: null }, include: { module: true }, orderBy: { createdAt: 'asc' } }),
      this.prisma.bugFix.findMany({ where: { versionId, deletedAt: null }, include: { severity: true, status: true }, orderBy: { createdAt: 'asc' } }),
    ]);

    return { version, changeLogs, bugFixes };
  }

  async exportCsv(versionId: string): Promise<Buffer> {
    const { changeLogs } = await this.getReleaseNotesData(versionId);
    return exportToCsv(changeLogs, CHANGE_LOG_COLUMNS);
  }

  async exportExcel(versionId: string): Promise<Buffer> {
    const { changeLogs, bugFixes } = await this.getReleaseNotesData(versionId);
    const changeLogsBuf = await exportToExcel(changeLogs, CHANGE_LOG_COLUMNS, 'Change Logs');
    // exportToExcel returns a single-sheet workbook; for release notes we keep it simple with change logs as the primary sheet.
    void bugFixes;
    return changeLogsBuf;
  }

  async exportPdf(versionId: string): Promise<Buffer> {
    const { version, changeLogs, bugFixes } = await this.getReleaseNotesData(versionId);
    const title = `Release Notes - ${version.releaseName} (${version.versionNumber})`;
    const rows = [
      ...changeLogs.map((c) => ({ type: 'Change', title: c.title, detail: c.newBehaviour || c.description || '' })),
      ...bugFixes.map((b) => ({ type: 'Bug Fix', title: b.bugCode, detail: b.issue })),
    ];
    return exportToPdfTable(title, rows, [
      { key: 'type', label: 'Type' },
      { key: 'title', label: 'Title' },
      { key: 'detail', label: 'Detail' },
    ]);
  }

  async exportWord(versionId: string): Promise<Buffer> {
    const { version, changeLogs, bugFixes } = await this.getReleaseNotesData(versionId);

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: `Release Notes: ${version.releaseName}`, heading: HeadingLevel.TITLE }),
            new Paragraph({ text: `Version ${version.versionNumber} — ${version.product.name} — ${version.environment.name}`, heading: HeadingLevel.HEADING_3 }),
            new Paragraph({ text: `Release Date: ${version.releaseDate ? new Date(version.releaseDate).toDateString() : 'TBD'}` }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: version.releaseDescription || version.releaseTitle || 'No summary provided.' }),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Changes', heading: HeadingLevel.HEADING_2 }),
            ...(changeLogs.length
              ? changeLogs.map(
                  (c) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      children: [new TextRun({ text: `${c.title}`, bold: true }), new TextRun({ text: c.newBehaviour ? ` — ${c.newBehaviour}` : '' })],
                    }),
                )
              : [new Paragraph({ text: 'No change log entries recorded.' })]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Bug Fixes', heading: HeadingLevel.HEADING_2 }),
            ...(bugFixes.length
              ? bugFixes.map(
                  (b) =>
                    new Paragraph({
                      bullet: { level: 0 },
                      children: [new TextRun({ text: `${b.bugCode}: `, bold: true }), new TextRun({ text: b.issue })],
                    }),
                )
              : [new Paragraph({ text: 'No bug fixes recorded.' })]),
            new Paragraph({ text: '' }),
            new Paragraph({ text: 'Database / API / Configuration Changes', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `Database: ${version.databaseChanges || 'None'}` }),
            new Paragraph({ text: `API: ${version.apiChanges || 'None'}` }),
            new Paragraph({ text: `Configuration: ${version.configurationChanges || 'None'}` }),
            new Paragraph({ text: `Breaking Changes: ${version.breakingChanges ? 'Yes' : 'No'}` }),
            new Paragraph({ text: `Backward Compatible: ${version.backwardCompatible ? 'Yes' : 'No'}` }),
          ],
        },
      ],
    });

    return Packer.toBuffer(doc);
  }

  async emailReleaseNotes(versionId: string, recipients: string[]) {
    const { version, changeLogs } = await this.getReleaseNotesData(versionId);
    const bulletList = changeLogs.map((c) => `<li>${c.title}</li>`).join('') || '<li>No changes recorded.</li>';
    const html = `<h2>Release Notes: ${version.releaseName} (${version.versionNumber})</h2>
      <p>${version.releaseDescription || ''}</p>
      <h3>Changes</h3><ul>${bulletList}</ul>`;
    const results = await Promise.all(
      recipients.map((to) => this.mailService.sendReleaseNotificationEmail(to, `Release Notes: ${version.releaseName}`, html)),
    );
    return { sent: results.filter(Boolean).length, total: recipients.length };
  }
}
