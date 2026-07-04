"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { LogIn, Mail, MapPin, Phone } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import { useAdminUsers } from "@/hooks/use-users";
import { useAuth } from "@/contexts/auth-context";
import type { AdminUserListItem } from "@/lib/api";
import { CUSTOMER_STATUS_OPTIONS } from "@/lib/admin/status-config";

const PAGE_SIZE = 20;

type CustomerStatusFilter = "all" | "verified" | "pending" | "onboarded" | "incomplete";
type CustomerSortKey = "customer" | "contact" | "location" | "status" | "createdAt";

function formatDate(value: string | Date): string {
  return format(new Date(value), "MMM d, yyyy");
}

function locationLabel(user: AdminUserListItem): string {
  return (
    [user.locationCity, user.locationState, user.locationCountry]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function customerStatus(user: AdminUserListItem): Exclude<CustomerStatusFilter, "all"> {
  if (user.onboardingCompleted) return "onboarded";
  if (!user.isEmailVerified) return "pending";
  return user.onboardingCompleted ? "onboarded" : "incomplete";
}

function customerSearchText(user: AdminUserListItem): string {
  return [
    user.name,
    user.email,
    user.phone,
    user.locationCity,
    user.locationState,
    user.locationCountry,
    user.role,
    String(user.id),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function compareCustomers(a: AdminUserListItem, b: AdminUserListItem, key: CustomerSortKey) {
  switch (key) {
    case "customer":
      return compareStrings(a.name ?? "", b.name ?? "");
    case "contact":
      return compareStrings(a.email ?? a.phone ?? "", b.email ?? b.phone ?? "");
    case "location":
      return compareStrings(locationLabel(a), locationLabel(b));
    case "status":
      return compareStrings(customerStatus(a), customerStatus(b));
    case "createdAt":
      return compareDates(a.createdAt, b.createdAt);
  }
}



export default function CustomersAdmin() {
  const { loginAsUser } = useAuth();
  const { data, isLoading, isError, error } = useAdminUsers({}); // list ALL users
  const customers = useMemo(() => data?.items ?? [], [data?.items]);

  const handleLoginAs = async (userId: number, userName?: string | null) => {
    if (!confirm(`Login as ${userName || "user #" + userId}? This will switch your session.`)) {
      return;
    }
    const res = await loginAsUser(userId);
    if (res.success) {
      // Hard redirect to root after impersonating
      window.location.href = "/";
    } else {
      alert(res.error || "Failed to login as user");
    }
  };

  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>("all");
  const [locationFilter, setLocationFilter] = useState("");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
    filterSheetOpen,
    setFilterSheetOpen,
  } = useAdminListControls<CustomerSortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [statusFilter, locationFilter],
  });

  const statusCounts = useMemo(
    () => ({
      verified: customers.filter((user) => user.isEmailVerified).length,
      pending: customers.filter((user) => !user.isEmailVerified).length,
      onboarded: customers.filter((user) => user.onboardingCompleted).length,
      incomplete: customers.filter((user) => !user.onboardingCompleted).length,
    }),
    [customers],
  );

  const filteredCustomers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const location = locationFilter.trim().toLowerCase();

    const filtered = customers.filter((user) => {
      if (statusFilter === "verified" && !user.isEmailVerified) return false;
      if (statusFilter === "pending" && user.isEmailVerified) return false;
      if (statusFilter === "onboarded" && !user.onboardingCompleted) return false;
      if (statusFilter === "incomplete" && user.onboardingCompleted) return false;
      if (q && !customerSearchText(user).includes(q)) return false;
      if (location && !locationLabel(user).toLowerCase().includes(location)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareCustomers(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [customers, debouncedSearch, locationFilter, sort.dir, sort.key, statusFilter]);

  const pagedCustomers = useMemo(
    () => paginateItems(filteredCustomers, page, PAGE_SIZE),
    [filteredCustomers, page],
  );

  const clearFilters = () => setLocationFilter("");
  const hasActiveFilters = locationFilter.trim() !== "";

  const customerColumns = useMemo<ColumnDef<AdminUserListItem, unknown>[]>(() => [
    {
      id: "customer",
      header: "Customer",
      meta: { sortKey: "customer", className: "min-w-[160px]" },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex min-w-0 flex-col gap-1">
            <span className="font-medium text-foreground">
              {user.name || `User #${user.id}`}
            </span>
            <span className="font-mono text-xs text-muted-foreground">#{user.id}</span>
          </div>
        );
      },
    },
    {
      id: "contact",
      header: "Contact",
      meta: { sortKey: "contact", className: "min-w-[180px]" },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex min-w-0 flex-col gap-1 text-sm">
            {user.email ? (
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Mail className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{user.email}</span>
              </span>
            ) : null}
            {user.phone ? (
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                <span className="truncate">{user.phone}</span>
              </span>
            ) : null}
            {!user.email && !user.phone ? (
              <span className="text-muted-foreground">No contact added</span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "role",
      header: "Role",
      meta: { sortKey: "role" as any },
      cell: ({ row }) => (
        <span className="inline-block rounded bg-muted px-2 py-0.5 text-xs font-medium capitalize text-foreground">
          {row.original.role}
        </span>
      ),
    },
    {
      id: "location",
      header: "Location",
      meta: { sortKey: "location", className: "hidden md:table-cell" },
      cell: ({ row }) => (
        <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{locationLabel(row.original)}</span>
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      meta: { sortKey: "status" },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-wrap gap-1.5">
            <AdminStatusBadge
              status={user.isEmailVerified ? "verified" : "pending"}
              options={CUSTOMER_STATUS_OPTIONS}
            />
            <AdminStatusBadge
              status={user.onboardingCompleted ? "onboarded" : "incomplete"}
              options={CUSTOMER_STATUS_OPTIONS}
            />
          </div>
        );
      },
    },
    {
      id: "joined",
      header: "Joined",
      meta: { sortKey: "createdAt" },
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "",
      meta: { className: "text-right w-[100px]" },
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => handleLoginAs(user.id, user.name)}
          >
            <LogIn className="size-3.5" />
            Login as
          </Button>
        );
      },
    },
  ], [handleLoginAs]);

  return (
    <AdminListPage
      title="All Users"
      description="List of all registered users (tenants, agents, vendors, admins). Use 'Login as' to impersonate a user."
      isLoading={isLoading}
      loadingLabel="Loading users…"
      isError={isError}
      error={error}
      errorTitle="Could not load users"
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: statusFilter,
            onChange: (value) => setStatusFilter(value as CustomerStatusFilter),
            options: CUSTOMER_STATUS_OPTIONS,
            counts: statusCounts,
            totalCount: customers.length,
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search name, email, phone, location, or ID…",
          }}
          filterSheet={{
            open: filterSheetOpen,
            onOpenChange: setFilterSheetOpen,
            title: "Filters",
            description: "Narrow by location.",
            hasActiveFilters,
            onClear: clearFilters,
            children: (
              <div className="space-y-2">
                <Label htmlFor="customer-location">Location contains</Label>
                <Input
                  id="customer-location"
                  placeholder="e.g. Bangalore"
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
            ),
          }}
        />
      }
      isEmpty={filteredCustomers.length === 0}
      emptyTitle="No users match your filters"
      emptyDescription="Try clearing search or adjusting filters."
      pagination={{
        page: pagedCustomers.page,
        totalPages: pagedCustomers.totalPages,
        total: pagedCustomers.total,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    >
      <AdminDataTable
        columns={customerColumns}
        data={pagedCustomers.items}
        getRowId={(user) => String(user.id)}
        sort={sort}
        onSort={toggleSort}
      />
    </AdminListPage>
  );
}
