import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
}

function cell(row: Record<string, any>, key: string): string {
  const value = key.split('.').reduce<any>((acc, k) => (acc == null ? acc : acc[k]), row);
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

export function exportToCsv(rows: Record<string, any>[], columns: ExportColumn[]): Buffer {
  const records = rows.map((row) => Object.fromEntries(columns.map((c) => [c.label, cell(row, c.key)])));
  return Buffer.from(stringify(records, { header: true, columns: columns.map((c) => c.label) }));
}

export async function exportToExcel(rows: Record<string, any>[], columns: ExportColumn[], sheetName = 'Sheet1'): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LOS Version Management Portal';
  workbook.created = new Date();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.columns = columns.map((c) => ({ header: c.label, key: c.key, width: c.width ?? 22 }));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  for (const row of rows) {
    sheet.addRow(Object.fromEntries(columns.map((c) => [c.key, cell(row, c.key)])));
  }

  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function exportToPdfTable(title: string, rows: Record<string, any>[], columns: ExportColumn[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text(title, { align: 'left' });
    doc.fontSize(9).fillColor('#64748b').text(`Generated ${new Date().toLocaleString()}`, { align: 'left' });
    doc.moveDown();

    const startX = doc.x;
    let y = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / columns.length;

    const drawHeader = () => {
      doc.fontSize(9).fillColor('#111827');
      columns.forEach((c, i) => doc.text(c.label, startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true }));
      y += 16;
      doc.moveTo(startX, y).lineTo(startX + pageWidth, y).strokeColor('#cbd5e1').stroke();
      y += 4;
    };

    drawHeader();
    doc.fontSize(8).fillColor('#1f2937');
    for (const row of rows) {
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage({ margin: 36, size: 'A4', layout: 'landscape' });
        y = doc.page.margins.top;
        drawHeader();
      }
      columns.forEach((c, i) => doc.text(cell(row, c.key), startX + i * colWidth, y, { width: colWidth - 4, ellipsis: true }));
      y += 14;
    }

    doc.end();
  });
}
