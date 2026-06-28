"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import {
  ExternalLink,
  Pencil,
} from "lucide-react";
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
import { useAdminPropertiesList } from "@/hooks/use-properties";
import { useAgents } from "@/hooks/use-agents";
import type { BackendProperty } from "@/lib/property-mapper";
import { buildPropertyPath } from "@/lib/property-slug";
import { PropertyStatus } from "@/lib/property-mapper";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AdminDataTable,
  type AdminSortState,
} from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";

const PAGE_SIZE = 20;

type SortKey =
  | "id"
  | "title"
  | "city"
  | "listingType"
  | "propertyType"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "area"
  | "status";

const filterParsers = {
  q: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  sortBy: parseAsStringLiteral([
    "id",
    "title",
    "city",
    "listingType",
    "propertyType",
    "price",
    "bedrooms",
    "bathrooms",
    "area",
    "status",
  ] as const).withDefault("id"),
  sortDir: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
};

function formatPrice(p: BackendProperty) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: p.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(p.price) || 0);
}

function areaSqFt(p: BackendProperty) {
  const m = Number(p.area ?? 0) || 0;
  return Math.round(m * 10.7639);
}

function statusBadge(status?: string) {
  const s = status ?? "";
  if (s === PropertyStatus.APPROVED)
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">
        Approved
      </Badge>
    );
  if (s === PropertyStatus.REJECTED)
    return (
      <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200">
        Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
      Pending
    </Badge>
  );
}

const AdminPropertiesList = () => {
  const [{ q, page, sortBy, sortDir }, setQuery] = useQueryStates(filterParsers, {
    history: "replace",
    shallow: true,
  });
  const [searchDraft, setSearchDraft] = useState(q);

  useEffect(() => setSearchDraft(q), [q]);
  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchDraft !== q) {
        setQuery({ q: searchDraft, page: 1 });
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [searchDraft, q, setQuery]);

  const listQuery = useMemo(
    () => ({
      q: q || undefined,
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortDir,
    }),
    [q, page, sortBy, sortDir],
  );

  const { data, isLoading, isError, error, isFetching } = useAdminPropertiesList(listQuery);
  const { data: agents = [] } = useAgents();

  const rows = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const agentNameById = useMemo(() => {
    const m = new Map<number, string>();
    for (const a of agents) {
      const label = (a.name ?? a.email ?? "").trim() || `Agent #${a.id}`;
      m.set(a.id, label);
    }
    return m;
  }, [agents]);

  const toggleSort = (key: SortKey) => {
    setQuery({
      sortBy: key,
      sortDir: sortBy === key && sortDir === "asc" ? "desc" : "asc",
      page: 1,
    });
  };

  const sort: AdminSortState<SortKey> = { key: sortBy, dir: sortDir };

  const columns = useMemo<ColumnDef<BackendProperty, unknown>[]>(
    () => [
      {
        id: "id",
        header: "ID",
        meta: {
          sortKey: "id",
          className: "w-[72px] font-mono text-xs text-muted-foreground",
        },
        cell: ({ row }) => row.original.id,
      },
      {
        id: "title",
        header: "Title",
        meta: { sortKey: "title", className: "max-w-[220px] truncate font-medium" },
        cell: ({ row }) => (
          <span title={row.original.title}>{row.original.title || "—"}</span>
        ),
      },
      {
        id: "city",
        header: "City",
        meta: { sortKey: "city" },
        cell: ({ row }) => row.original.city || "—",
      },
      {
        id: "address",
        header: "Address",
        meta: { className: "hidden lg:table-cell max-w-[200px] truncate text-muted-foreground text-xs" },
        cell: ({ row }) => {
          const p = row.original;
          return [p.address, p.locality].filter(Boolean).join(", ") || "—";
        },
      },
      {
        id: "listing",
        header: "Listing",
        meta: { sortKey: "listingType", className: "text-xs" },
        cell: ({ row }) => String(row.original.listingType ?? "—"),
      },
      {
        id: "type",
        header: "Type",
        meta: { sortKey: "propertyType", className: "hidden md:table-cell text-xs" },
        cell: ({ row }) => String(row.original.propertyType ?? "—"),
      },
      {
        id: "price",
        header: "Price",
        meta: { sortKey: "price", className: "whitespace-nowrap" },
        cell: ({ row }) => formatPrice(row.original),
      },
      {
        id: "beds",
        header: "Beds",
        meta: { sortKey: "bedrooms", className: "hidden sm:table-cell text-center" },
        cell: ({ row }) => Number(row.original.bedrooms) || "—",
      },
      {
        id: "baths",
        header: "Baths",
        meta: { sortKey: "bathrooms", className: "hidden sm:table-cell text-center" },
        cell: ({ row }) => Number(row.original.bathrooms) || "—",
      },
      {
        id: "area",
        header: "Area (sq.ft)",
        meta: {
          sortKey: "area",
          className: "hidden xl:table-cell text-right text-muted-foreground text-xs",
        },
        cell: ({ row }) => areaSqFt(row.original).toLocaleString("en-IN"),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => statusBadge(row.original.status),
      },
      {
        id: "agent",
        header: "Agent",
        meta: { className: "hidden lg:table-cell max-w-[160px] text-right text-sm text-foreground" },
        cell: ({ row }) => {
          const p = row.original;
          if (p.assignedAgentId == null) {
            return <span className="text-muted-foreground">—</span>;
          }
          return (
            <span
              className="line-clamp-2 break-words"
              title={`${agentNameById.get(p.assignedAgentId) ?? "Agent"} (id ${p.assignedAgentId})`}
            >
              {agentNameById.get(p.assignedAgentId) ?? `Agent #${p.assignedAgentId}`}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={buildPropertyPath(p.id, p.title)} title="View public page">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link href={`/edit-property/${p.id}`} title="Edit as admin">
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          );
        },
      },
    ],
    [agentNameById],
  );

  return (
    <AdminListPage
      title="All properties"
      description={
        total > 0
          ? `Search, sort, and open any listing. ${total.toLocaleString("en-IN")} total.${
              isFetching && !isLoading ? " Refreshing…" : ""
            }`
          : "Search, sort, and open any listing."
      }
      isLoading={isLoading}
      loadingLabel="Loading properties…"
      isError={isError}
      error={error}
      errorTitle="Could not load properties"
      toolbar={
        <AdminToolbar
          search={{
            value: searchDraft,
            onChange: setSearchDraft,
            placeholder: "Search by ID, title, city, address, type, status…",
          }}
        />
      }
      isEmpty={rows.length === 0}
      emptyTitle={q.trim() ? "No properties match your search" : "No properties yet"}
      emptyDescription="Try clearing search or adjusting filters."
      pagination={
        total > PAGE_SIZE
          ? {
              page,
              totalPages,
              total,
              pageSize: PAGE_SIZE,
              onPageChange: (nextPage) => setQuery({ page: nextPage }),
              isFetching: isFetching && !isLoading,
            }
          : undefined
      }
    >
      <AdminDataTable
        columns={columns}
        data={rows}
        getRowId={(row) => String(row.id)}
        sort={sort}
        onSort={toggleSort}
      />
    </AdminListPage>
  );
};

export default AdminPropertiesList;
