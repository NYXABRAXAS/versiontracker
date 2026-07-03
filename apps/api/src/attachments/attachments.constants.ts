import { AttachmentCategory } from '@prisma/client';

export const ALLOWED_MIME_TYPES: Record<string, AttachmentCategory> = {
  'image/png': AttachmentCategory.IMAGE,
  'image/jpeg': AttachmentCategory.IMAGE,
  'image/gif': AttachmentCategory.IMAGE,
  'image/webp': AttachmentCategory.IMAGE,
  'application/pdf': AttachmentCategory.PDF,
  'application/msword': AttachmentCategory.WORD,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': AttachmentCategory.WORD,
  'application/vnd.ms-excel': AttachmentCategory.EXCEL,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': AttachmentCategory.EXCEL,
  'application/zip': AttachmentCategory.ZIP,
  'application/x-zip-compressed': AttachmentCategory.ZIP,
  'text/plain': AttachmentCategory.LOG,
  'application/sql': AttachmentCategory.SQL,
  'application/vnd.android.package-archive': AttachmentCategory.APK,
  'application/octet-stream': AttachmentCategory.OTHER, // covers .ipa, .log, .sql on platforms without a registered mime type
};

export function categoryForMime(mime: string, filename: string): AttachmentCategory {
  if (ALLOWED_MIME_TYPES[mime]) {
    if (mime === 'application/octet-stream') {
      if (filename.endsWith('.ipa')) return AttachmentCategory.IPA;
      if (filename.endsWith('.sql')) return AttachmentCategory.SQL;
      if (filename.endsWith('.log')) return AttachmentCategory.LOG;
      if (filename.endsWith('.apk')) return AttachmentCategory.APK;
    }
    return ALLOWED_MIME_TYPES[mime];
  }
  return AttachmentCategory.OTHER;
}
