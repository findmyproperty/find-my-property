"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  MoreVertical,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminPropertiesList, useAdminPropertyStats } from "@/hooks/use-properties";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  mapBackendProperty,
  PropertyStatus,
  LEGACY_PROPERTY_TYPES,
  type BackendProperty,
} from "@/lib/property-mapper";
import { useCategories } from "@/hooks/use-categories";
import type { Property } from "@/modules/properties/PropertyCard";
import { buildPropertyPath } from "@/lib/property-slug";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminListError, AdminListLoading, AdminListEmpty } from "@/components/admin/admin-list-states";
import {
  AdminDataTable,
  type AdminSortState,
} from "@/components/admin/admin-data-table";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { PROPERTY_STATUS_OPTIONS } from "@/lib/admin/status-config";

type SortKey =
  | "id"
  | "title"
  | "city"
  | "listingType"
  | "propertyType"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "area";

type StatusTab = "all" | "Pending" | "Approved" | "Rejected";

const PAGE_SIZE = 20;

function statusTabToApi(tab: Exclude<StatusTab, "all">): string {
  return tab;
}

function parseOptionalPrice(value: string): number | undefined {
  const n = value.trim() === "" ? NaN : Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function formatPrice(p: BackendProperty) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: p.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(p.price) || 0);
}

function areaSqFt(p: BackendProperty) {
  return Math.round((Number(p.area) || 0) * 10.7639);
}

function isRentListing(p: BackendProperty) {
  const t = String(p.listingType ?? "").toLowerCase();
  return t === "rent" || t === "lease";
}

function rowStatus(p: BackendProperty) {
  return (p.status ?? PropertyStatus.PENDING) as string;
}

// Dynamic from categories when available; fallback to legacy values
function usePropertyTypeOptions() {
  const { data: categories = [] } = useCategories();
  // Only property categories (no service mapping)
  const active = categories
    .filter((c) => c.isActive !== false && !c.service)
    .map((c) => c.name);
  const base = active.length > 0 ? active : LEGACY_PROPERTY_TYPES;
  return ["all", ...base] as const;
}

const PropertyApproval = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Only categories without a service mapping (property types)
  const PROPERTY_TYPE_OPTIONS = usePropertyTypeOptions(); // the hook already fetches, we filter in the filter list below if needed, but keep for now. For dynamic we use the hook inside.

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | "rent" | "sale">("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [sort, setSort] = useState<AdminSortState<SortKey>>({
    key: "id",
    dir: "desc",
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const [isApproving, setIsApproving] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    cityFilter,
    listingFilter,
    propertyTypeFilter,
    priceMin,
    priceMax,
    statusFilter,
  ]);

  const filterBase = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      city: cityFilter.trim() || undefined,
      listing: listingFilter !== "all" ? listingFilter : undefined,
      propertyType: propertyTypeFilter !== "all" ? propertyTypeFilter : undefined,
      priceMin: parseOptionalPrice(priceMin),
      priceMax: parseOptionalPrice(priceMax),
    }),
    [
      debouncedSearch,
      cityFilter,
      listingFilter,
      propertyTypeFilter,
      priceMin,
      priceMax,
    ],
  );

  const listQuery = useMemo(
    () => ({
      ...filterBase,
      status:
        statusFilter === "all"
          ? undefined
          : statusTabToApi(statusFilter as Exclude<StatusTab, "all">),
      page,
      limit: PAGE_SIZE,
      sortBy: sort.key,
      sortDir: sort.dir,
    }),
    [filterBase, statusFilter, page, sort.key, sort.dir],
  );

  const { data, isLoading, isError, error, isFetching } =
    useAdminPropertiesList(listQuery);
  const { data: stats } = useAdminPropertyStats(filterBase);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const statusCounts = {
    Pending: stats?.pending ?? 0,
    Approved: stats?.approved ?? 0,
    Rejected: stats?.rejected ?? 0,
  };
  const allStatusTotal =
    statusCounts.Pending + statusCounts.Approved + statusCounts.Rejected;

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
    setPage(1);
  };

  const clearFilters = () => {
    setCityFilter("");
    setListingFilter("all");
    setPropertyTypeFilter("all");
    setPriceMin("");
    setPriceMax("");
  };

  const hasActiveFilters =
    cityFilter.trim() !== "" ||
    listingFilter !== "all" ||
    propertyTypeFilter !== "all" ||
    priceMin.trim() !== "" ||
    priceMax.trim() !== "";

  const openDetail = (p: BackendProperty) => {
    setSelectedProperty(mapBackendProperty(p));
  };

  const approveProperty = async (id: string) => {
    setIsApproving(true);
    try {
      await api.approveProperty(id, { skipAgentAssignment: true });
      await revalidatePropertyListingCache(id);
      await invalidatePropertyQueries(queryClient, id);
      router.refresh();
      toast({ title: "Property approved" });
    } catch (err) {
      toast({
        title: "Approval failed",
        description: (err as Error)?.message || "Could not approve property.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectTarget(id);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please enter a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    setIsRejecting(true);
    try {
      await api.rejectProperty(rejectTarget, reason);
      await revalidatePropertyListingCache(rejectTarget);
      await invalidatePropertyQueries(queryClient, rejectTarget);
      router.refresh();
      toast({ title: "Property rejected" });
      setRejectReason("");
      setShowRejectDialog(false);
      setRejectTarget(null);
    } catch (err) {
      toast({
        title: "Rejection failed",
        description: (err as Error)?.message || "Could not reject property.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const thumb = (p: BackendProperty) =>
    p.thumbnailUrl ||
    p.propertyImages?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80";

  const columns = useMemo<ColumnDef<BackendProperty, unknown>[]>(
    () => [
      {
        id: "image",
        header: "",
        meta: { className: "w-[72px] p-2" },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={thumb(p)}
                alt={p.title || "Property"}
                fill
                sizes="56px"
                className="object-cover"
              />
            </div>
          );
        },
      },
      {
        id: "id",
        header: "ID",
        meta: { sortKey: "id", className: "w-[72px] font-mono text-xs text-muted-foreground" },
        cell: ({ row }) => row.original.id,
      },
      {
        id: "title",
        header: "Title",
        meta: { sortKey: "title", className: "max-w-[200px] truncate font-medium" },
        cell: ({ row }) => (
          <span title={row.original.title}>{row.original.title || "—"}</span>
        ),
      },
      {
        id: "city",
        header: "City",
        meta: { sortKey: "city", className: "hidden md:table-cell" },
        cell: ({ row }) => row.original.city || "—",
      },
      {
        id: "listing",
        header: "Listing",
        meta: { sortKey: "listingType", className: "text-xs" },
        cell: ({ row }) => (isRentListing(row.original) ? "Rent" : "Sale"),
      },
      {
        id: "type",
        header: "Type",
        meta: { sortKey: "propertyType", className: "hidden lg:table-cell text-xs" },
        cell: ({ row }) => String(row.original.propertyType ?? "—"),
      },
      {
        id: "price",
        header: "Price",
        meta: { sortKey: "price", className: "whitespace-nowrap text-sm" },
        cell: ({ row }) => formatPrice(row.original),
      },
      {
        id: "beds",
        header: "Beds",
        meta: {
          sortKey: "bedrooms",
          className: "hidden text-center sm:table-cell text-sm",
        },
        cell: ({ row }) => Number(row.original.bedrooms) || "—",
      },
      {
        id: "baths",
        header: "Baths",
        meta: {
          sortKey: "bathrooms",
          className: "hidden text-center sm:table-cell text-sm",
        },
        cell: ({ row }) => Number(row.original.bathrooms) || "—",
      },
      {
        id: "area",
        header: "Area",
        meta: {
          sortKey: "area",
          className: "hidden text-right xl:table-cell text-xs text-muted-foreground",
        },
        cell: ({ row }) =>
          `${areaSqFt(row.original).toLocaleString("en-IN")} sq.ft`,
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <AdminStatusBadge
            status={rowStatus(row.original)}
            options={PROPERTY_STATUS_OPTIONS}
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                type="button"
                onClick={() => openDetail(p)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                <Link href={buildPropertyPath(p.id, p.title)} title="Public page">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              {rowStatus(p) === PropertyStatus.PENDING && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      type="button"
                      title="More actions"
                    >
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">More actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem
                      className="gap-2 text-emerald-700 focus:text-emerald-700"
                      disabled={isApproving}
                      onClick={() => void approveProperty(String(p.id))}
                    >
                      <Check className="h-4 w-4" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="gap-2 text-destructive focus:text-destructive"
                      onClick={() => openRejectDialog(String(p.id))}
                    >
                      <X className="h-4 w-4" />
                      Reject
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          );
        },
      },
    ],
    [isApproving, openDetail, approveProperty, openRejectDialog],
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Property Approvals"
        description="Review listings in a sortable table. Use search and the filter drawer to narrow results, then approve or reject with a reason."
      />

      {isError ? (
        <AdminListError
          title="Could not load property approvals"
          message={(error as Error)?.message ?? "Please refresh the page or try again."}
        />
      ) : null}

      {isLoading ? (
        <AdminListLoading label="Loading listings…" />
      ) : (
        <div className="w-full space-y-4">
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as StatusTab),
              options: PROPERTY_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: allStatusTotal,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search ID, title, city, address, or type…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description:
                "Narrow by city, listing type, property type, or price range.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ap-city">City contains</Label>
                    <Input
                      id="ap-city"
                      placeholder="e.g. Mumbai"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Listing</Label>
                    <Select
                      value={listingFilter}
                      onValueChange={(v) => setListingFilter(v as "all" | "rent" | "sale")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="rent">Rent / lease</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Property type</Label>
                    <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        {PROPERTY_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt === "all" ? "All types" : opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ap-min">Min price (INR)</Label>
                    <Input
                      id="ap-min"
                      inputMode="numeric"
                      placeholder="No minimum"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ap-max">Max price (INR)</Label>
                    <Input
                      id="ap-max"
                      inputMode="numeric"
                      placeholder="No maximum"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                    />
                  </div>
                </>
              ),
            }}
          />

          {items.length === 0 ? (
            <AdminListEmpty
              title="No listings match your filters"
              description="Try All statuses, clearing search, or adjusting filters."
            />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AdminDataTable
                columns={columns}
                data={items}
                getRowId={(p) => String(p.id)}
                sort={sort}
                onSort={toggleSort}
              />
            </motion.div>
          )}

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            isFetching={isFetching && !isLoading}
          />
        </div>
      )}

      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Listing preview: beds, baths, area, status, owner, and price.
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                {selectedProperty.image ? (
                  <Image
                    src={selectedProperty.image}
                    alt={selectedProperty.title}
                    fill
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.bedrooms} Bed</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.bathrooms} Bath</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.area}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">Status</p>
                <p className="text-sm text-muted-foreground">{selectedProperty.status || "Pending"}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner: {selectedProperty.ownerName || "Unknown"}</span>
                <span className="font-semibold text-foreground">{selectedProperty.price}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          setShowRejectDialog(open);
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject property</DialogTitle>
            <DialogDescription>
              Provide a reason for the owner or agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this listing cannot be approved…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowRejectDialog(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isRejecting} onClick={() => void confirmReject()}>
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyApproval;
