"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Protected } from "@/components/shared/protected";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mastersApi } from "@/lib/api/resources";
import { ApiError } from "@/lib/api/client";
import { invalidateMasterItems } from "@/lib/hooks/use-master-items";
import type { MasterItem, MasterType } from "@/lib/api/types";

export default function MastersAdminPage() {
  const [types, setTypes] = React.useState<MasterType[]>([]);
  const [activeType, setActiveType] = React.useState<string>();
  const [items, setItems] = React.useState<MasterItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [itemsLoading, setItemsLoading] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<MasterItem | null>(null);
  const [newTypeOpen, setNewTypeOpen] = React.useState(false);

  const loadTypes = React.useCallback(async () => {
    const t = await mastersApi.types();
    setTypes(t);
    return t;
  }, []);

  React.useEffect(() => {
    loadTypes()
      .then((t) => {
        if (t.length) setActiveType(t[0].id);
      })
      .finally(() => setLoading(false));
  }, [loadTypes]);

  const loadItems = React.useCallback(() => {
    if (!activeType) return;
    setItemsLoading(true);
    mastersApi
      .itemsForType(activeType)
      .then(setItems)
      .finally(() => setItemsLoading(false));
    // Keep every MasterSelect dropdown elsewhere in the app (Versions, Change Logs, etc.) in sync
    // with this change immediately, instead of only fixing this page's own list.
    const code = types.find((t) => t.id === activeType)?.code;
    if (code) invalidateMasterItems(code);
  }, [activeType, types]);

  React.useEffect(() => loadItems(), [loadItems]);

  const onDeleteItem = async (item: MasterItem) => {
    if (item.isSystem) {
      toast.error("System values cannot be deleted. Deactivate instead.");
      return;
    }
    if (!confirm(`Delete "${item.name}"?`)) return;
    await mastersApi.removeItem(item.id);
    toast.success("Item deleted.");
    loadItems();
  };

  const onToggleActive = async (item: MasterItem) => {
    await mastersApi.updateItem(item.id, { isActive: !item.isActive });
    loadItems();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Masters"
        description="Manage products, environments, statuses and every other lookup value — no code changes required."
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Admin" }, { label: "Masters" }]}
        actions={
          <Protected module="MASTERS" action="create">
            <NewCategoryDialog open={newTypeOpen} onOpenChange={setNewTypeOpen} onCreated={loadTypes} />
          </Protected>
        }
      />

      <Tabs value={activeType} onValueChange={setActiveType}>
        <TabsList className="flex-wrap h-auto justify-start">
          {types.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              {t.name} <Badge variant="secondary" className="ml-1">{t._count?.items ?? 0}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {types.map((t) => (
          <TabsContent key={t.id} value={t.id}>
            <Card>
              <CardContent className="py-4">
                <div className="mb-3 flex justify-end">
                  <Protected module="MASTERS" action="create">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingItem(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus /> Add {t.name}
                    </Button>
                  </Protected>
                </div>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Active</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itemsLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <Loader2 className="mx-auto size-5 animate-spin text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                            No values yet.
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              {item.colorHex && <span className="size-2.5 rounded-full" style={{ backgroundColor: item.colorHex }} />}
                              {item.name}
                              {item.isSystem && <Badge variant="outline" className="text-[10px]">System</Badge>}
                            </TableCell>
                            <TableCell className="text-muted-foreground">{item.code}</TableCell>
                            <TableCell className="text-muted-foreground max-w-xs truncate">{item.description}</TableCell>
                            <TableCell>
                              <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} />
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Protected module="MASTERS" action="edit">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingItem(item);
                                      setDialogOpen(true);
                                    }}
                                  >
                                    <Pencil />
                                  </Button>
                                </Protected>
                                <Protected module="MASTERS" action="delete">
                                  <Button variant="ghost" size="icon" onClick={() => onDeleteItem(item)} disabled={item.isSystem}>
                                    <Trash2 className={item.isSystem ? "text-muted-foreground" : "text-destructive"} />
                                  </Button>
                                </Protected>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {activeType && (
        <MasterItemDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          masterTypeId={activeType}
          item={editingItem}
          onSaved={() => {
            loadItems();
            loadTypes();
          }}
        />
      )}
    </div>
  );
}

function MasterItemDialog({
  open,
  onOpenChange,
  masterTypeId,
  item,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  masterTypeId: string;
  item: MasterItem | null;
  onSaved: () => void;
}) {
  const [name, setName] = React.useState(item?.name ?? "");
  const [description, setDescription] = React.useState(item?.description ?? "");
  const [colorHex, setColorHex] = React.useState(item?.colorHex ?? "#0ea5e9");
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setColorHex(item?.colorHex ?? "#0ea5e9");
  }, [item, open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (item) {
        await mastersApi.updateItem(item.id, { name, description, colorHex });
        toast.success("Item updated.");
      } else {
        await mastersApi.createItem({ masterTypeId, name, description, colorHex });
        toast.success("Item created.");
      }
      onOpenChange(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to save item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit Value" : "Add Value"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Badge Color</Label>
            <Input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-9 w-20 p-1" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NewCategoryDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await mastersApi.createType({ code: name, name, description });
      toast.success("Master category created.");
      setName("");
      setDescription("");
      onOpenChange(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Unable to create category.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus /> New Category
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Master Category</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Category Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
