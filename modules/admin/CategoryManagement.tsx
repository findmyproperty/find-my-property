"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Edit2,
  MoreVertical,
  Plus,
  Loader2,
  Trash2,
} from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import type { Category } from "@/schema/category";
import { SERVICE_OPTIONS } from "@/modules/services/schemas";
import { slugify } from "@/helpers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AdminDataTable,
  type AdminSortState,
} from "@/components/admin/admin-data-table";
import {
  AdminListEmpty,
  AdminListError,
  AdminListLoading,
} from "@/components/admin/admin-list-states";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { Combobox } from "@/components/ui/combobox";
import {
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";

const PAGE_SIZE = 20;

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  service: string; // '' or one of SERVICE_OPTIONS values; '' means none
  commissionPercent: number;
};

type CategorySortKey = "name" | "slug" | "createdAt";

const emptyForm = (): CategoryForm => ({
  name: "",
  slug: "",
  description: "",
  service: "",
  commissionPercent: 0,
});

const categoryToForm = (cat: Category): CategoryForm => ({
  name: cat.name ?? "",
  slug: cat.slug ?? "",
  description: cat.description ?? "",
  service: cat.service ?? "",
  commissionPercent: Number(cat.commissionPercent) || 0,
});

function categorySearchText(cat: Category): string {
  return [cat.name, cat.slug, cat.description]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function compareCategories(a: Category, b: Category, key: CategorySortKey): number {
  switch (key) {
    case "name":
      return compareStrings(a.name ?? "", b.name ?? "");
    case "slug":
      return compareStrings(a.slug ?? "", b.slug ?? "");
    case "createdAt":
      return (a.createdAt ? new Date(a.createdAt).getTime() : 0) -
        (b.createdAt ? new Date(b.createdAt).getTime() : 0);
  }
}

const CategoryManagement = () => {
  const {
    data: categories,
    isLoading,
    isError,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<CategorySortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
  });

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newCat, setNewCat] = useState<CategoryForm>(emptyForm());

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(emptyForm());

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const allCategories = useMemo(() => categories ?? [], [categories]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const result = allCategories.filter((c) => {
      if (q && !categorySearchText(c).includes(q)) return false;
      return true;
    });
    return [...result].sort((a, b) => {
      const r = compareCategories(a, b, sort.key);
      return sort.dir === "asc" ? r : -r;
    });
  }, [allCategories, debouncedSearch, sort.dir, sort.key]);

  const paged = useMemo(
    () => paginateItems(filtered, page, PAGE_SIZE),
    [filtered, page]
  );

  // For Mappings tab
  const allCats = categories ?? [];
  const mappedByService = useMemo(() => {
    const m: Record<string, Category[]> = Object.fromEntries(
      SERVICE_OPTIONS.map((s) => [s.value, [] as Category[]])
    );
    allCats.forEach((cat) => {
      if (cat.service && m[cat.service]) {
        m[cat.service].push(cat);
      }
    });
    return m;
  }, [allCats]);

  const availableForMapping = useMemo(
    () => allCats.filter((c) => !c.service && c.isActive !== false),
    [allCats]
  );

  const handleAssignCategory = async (catId: number, service: string) => {
    try {
      await updateCategory({ id: catId, data: { service } as any });
    } catch {
      // toast handled in hook
    }
  };

  const handleUnassign = async (catId: number) => {
    try {
      await updateCategory({ id: catId, data: { service: null } as any });
    } catch {
      // toast handled in hook
    }
  };

  const openAdd = () => {
    setNewCat(emptyForm());
    setIsAddOpen(true);
  };

  const handleNameChangeForNew = (name: string) => {
    setNewCat((prev) => {
      const next = { ...prev, name };
      // auto slug only if user hasn't manually edited slug or it matches previous auto
      if (!prev.slug || prev.slug === slugify(prev.name)) {
        next.slug = slugify(name);
      }
      return next;
    });
  };

  const handleAdd = async () => {
    const payload = {
      name: newCat.name.trim(),
      slug: newCat.slug.trim() || slugify(newCat.name),
      description: newCat.description.trim() || null,
      isActive: true,
      commissionPercent: Number(newCat.commissionPercent) || 0,
      service: null,
    };
    if (!payload.name) return;
    try {
      await createCategory(payload as any);
      setIsAddOpen(false);
      setNewCat(emptyForm());
    } catch {
      // toast handled in hook
    }
  };

  const openEdit = useCallback((cat: Category) => {
    setEditing(cat);
    setEditForm(categoryToForm(cat));
    setEditOpen(true);
  }, []);

  const handleEditNameChange = (name: string) => {
    setEditForm((prev) => {
      const next = { ...prev, name };
      if (!prev.slug || prev.slug === slugify(prev.name)) {
        next.slug = slugify(name);
      }
      return next;
    });
  };

  const handleEdit = async () => {
    if (!editing) return;
    try {
      await updateCategory({
        id: editing.id,
        data: {
          name: editForm.name.trim(),
          slug: editForm.slug.trim() || slugify(editForm.name),
          description: editForm.description.trim() || null,
          commissionPercent: Number(editForm.commissionPercent) || 0,
          service: (editForm.service || null) as any,
        },
      });
      setEditOpen(false);
      setEditing(null);
      setEditForm(emptyForm());
    } catch {
      // toast handled
    }
  };

  const requestDelete = (cat: Category) => {
    setDeleteTarget(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsConfirmingDelete(true);
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // toast handled
    } finally {
      setIsConfirmingDelete(false);
    }
  };

  const cancelDelete = () => {
    if (!isConfirmingDelete) setDeleteTarget(null);
  };

  const columns = useMemo<ColumnDef<Category, unknown>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        meta: { sortKey: "name", className: "min-w-[200px] font-medium" },
        cell: ({ row }) => row.original.name,
      },
      {
        id: "slug",
        header: "Slug",
        meta: { sortKey: "slug", className: "font-mono text-xs text-muted-foreground" },
        cell: ({ row }) => row.original.slug,
      },
      {
        id: "service",
        header: "Mapped to",
        cell: ({ row }) => {
          const svc = row.original.service;
          if (!svc) return <span className="text-muted-foreground">—</span>;
          const found = SERVICE_OPTIONS.find((s) => s.value === svc);
          return found ? found.label : svc;
        },
      },
      {
        id: "commission",
        header: "Commission %",
        meta: { className: "w-[110px] text-right tabular-nums" },
        cell: ({ row }) => {
          const pct = Number(row.original.commissionPercent);
          return Number.isFinite(pct) ? pct : 0;
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={
              row.original.isActive === false
                ? "inline-block rounded px-2 py-0.5 text-xs bg-zinc-100 text-zinc-700"
                : "inline-block rounded px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800"
            }
          >
            {row.original.isActive === false ? "Inactive" : "Active"}
          </span>
        ),
      },
      {
        id: "description",
        header: "Description",
        cell: ({ row }) => (
          <span className="line-clamp-1 text-sm text-muted-foreground max-w-[320px]">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "created",
        header: "Created",
        meta: { sortKey: "createdAt" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.createdAt
              ? format(new Date(row.original.createdAt), "MMM d, yyyy")
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        meta: { className: "text-right w-[80px]" },
        cell: ({ row }) => {
          const cat = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="cursor-pointer gap-2"
                  onSelect={(e) => {
                    e.preventDefault();
                    openEdit(cat);
                  }}
                >
                  <Edit2 className="size-3.5" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={() => requestDelete(cat)}
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [openEdit]
  );

  const addDialog = (
    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Categories power property types and can be mapped to specific services (packers-movers etc).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input
              id="cat-name"
              value={newCat.name}
              onChange={(e) => handleNameChangeForNew(e.target.value)}
              placeholder="e.g. Studio"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={newCat.slug}
              onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
              placeholder="studio"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Textarea
              id="cat-desc"
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              placeholder="Short description for internal reference"
              rows={2}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-commission">Commission %</Label>
            <Input
              id="cat-commission"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={newCat.commissionPercent}
              onChange={(e) =>
                setNewCat({
                  ...newCat,
                  commissionPercent: Number(e.target.value),
                })
              }
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Deducted from job amount when a lead for this category is completed.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsAddOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleAdd()} disabled={isCreating || !newCat.name.trim()}>
            {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AdminPageHeader
          title="Category Management"
          description="Manage categories for properties and services. Use the Mappings tab to assign categories to Packers & Movers, Painting & Cleaning, Home Services, Event Management, IT, or General Services."
        />
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="mappings">Service Mappings</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="mt-4">
          {isError ? (
            <AdminListError
              title="Could not load categories"
              message={(error as Error)?.message ?? "Please refresh the page or try again."}
            />
          ) : null}

          {isLoading ? (
            <AdminListLoading label="Loading categories…" />
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-end">
                <Button onClick={openAdd} size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </div>

              <AdminToolbar
                search={{
                  value: search,
                  onChange: setSearch,
                  placeholder: "Search name, slug or description…",
                }}
              />

              {filtered.length === 0 ? (
                <AdminListEmpty
                  title="No categories match your search"
                  description="Add your first category using the button above."
                />
              ) : (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                  <AdminDataTable
                    columns={columns}
                    data={paged.items}
                    getRowId={(c) => String(c.id)}
                    sort={sort}
                    onSort={toggleSort}
                  />
                </motion.div>
              )}

              <AdminPagination
                page={paged.page}
                totalPages={paged.totalPages}
                total={paged.total}
                pageSize={PAGE_SIZE}
                onPageChange={setPage}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="mt-4 space-y-6">
          <p className="text-sm text-muted-foreground">
            Assign categories to services. Only mapped, active categories appear in service request forms. If none are mapped, the form shows no options.
          </p>

          {SERVICE_OPTIONS.map((svc) => {
            const mapped = mappedByService[svc.value] || [];
            const assignOptions = availableForMapping.map((c) => ({
              value: c.id.toString(),
              label: c.name,
              description: c.description || undefined,
            }));

            return (
              <div key={svc.value} className="rounded-xl border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">{svc.label}</h4>
                  <span className="text-xs text-muted-foreground">{mapped.length} mapped</span>
                </div>

                {mapped.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mapped.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm"
                      >
                        {cat.name}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          ({Number(cat.commissionPercent) || 0}%)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUnassign(cat.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                          aria-label={`Unassign ${cat.name}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 text-sm text-muted-foreground">No categories mapped yet.</div>
                )}

                <div>
                  <Label className="text-xs mb-1.5 block text-muted-foreground">Assign category</Label>
                  <Combobox
                    options={assignOptions}
                    placeholder="Select category to map to this service"
                    onValueChange={(val) => {
                      const id = parseInt(val, 10);
                      if (!Number.isNaN(id)) {
                        handleAssignCategory(id, svc.value);
                      }
                    }}
                    disableSearch={assignOptions.length <= 6}
                  />
                </div>
              </div>
            );
          })}
        </TabsContent>
      </Tabs>

      {addDialog}

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) {
            setEditing(null);
            setEditForm(emptyForm());
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>Changes affect future property listings and mapped services.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => handleEditNameChange(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={editForm.slug}
                onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea
                id="edit-desc"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-commission">Commission %</Label>
              <Input
                id="edit-commission"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={editForm.commissionPercent}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    commissionPercent: Number(e.target.value),
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Applied to new leads for this category (existing leads keep their snapshot).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleEdit()} disabled={isUpdating || !editForm.name.trim()}>
              {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) cancelDelete(); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete category?</DialogTitle>
            <DialogDescription>
              This will remove “{deleteTarget?.name}”. Existing properties using this value will keep their current type.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete} disabled={isConfirmingDelete}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
              disabled={isConfirmingDelete}
            >
              {isConfirmingDelete && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryManagement;
