"use client";

import * as React from "react";
import { toast } from "sonner";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachmentsApi } from "@/lib/api/resources";
import { apiUrl } from "@/lib/api/client";
import type { Attachment } from "@/lib/api/types";
import { formatBytes, formatDateTime, fullName } from "@/lib/utils";
import { Protected } from "@/components/shared/protected";

export function AttachmentsPanel({ entityType, entityId }: { entityType: string; entityId: string }) {
  const [items, setItems] = React.useState<Attachment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    attachmentsApi
      .listForEntity(entityType, entityId)
      .then(setItems)
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  React.useEffect(() => load(), [load]);

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await attachmentsApi.upload(entityType, entityId, file);
      toast.success("File uploaded.");
      load();
    } catch (err) {
      toast.error("Upload failed. Check file type and size.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const onDelete = async (id: string) => {
    await attachmentsApi.remove(id);
    toast.success("Attachment removed.");
    load();
  };

  return (
    <div className="flex flex-col gap-3">
      <Protected module="ATTACHMENTS" action="create">
        <div>
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileSelected} />
          <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
            Upload File
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">Images, PDF, Word, Excel, ZIP, logs, SQL, APK, IPA</span>
        </div>
      </Protected>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading attachments…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments yet.</p>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {items.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-3 py-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium">{a.originalName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatBytes(a.sizeBytes)} · {a.category} · uploaded by {fullName(a.uploadedBy)} · {formatDateTime(a.createdAt)}
                </span>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <a href={apiUrl(attachmentsApi.downloadUrl(a.id))}>
                  <Download />
                </a>
              </Button>
              <Protected module="ATTACHMENTS" action="delete">
                <Button variant="ghost" size="icon" onClick={() => onDelete(a.id)}>
                  <Trash2 className="text-destructive" />
                </Button>
              </Protected>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
