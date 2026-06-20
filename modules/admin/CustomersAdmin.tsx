"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Mail, MapPin, Phone, Search, Users } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { useAdminUsers } from "@/hooks/use-users";
import type { AdminUserListItem } from "@/lib/api";

function formatDate(value: string | Date): string {
  return format(new Date(value), "MMM d, yyyy");
}

function contactLabel(user: AdminUserListItem): string {
  return user.email || user.phone || "No contact added";
}

function locationLabel(user: AdminUserListItem): string {
  return (
    [user.locationCity, user.locationState, user.locationCountry]
      .filter(Boolean)
      .join(", ") || "-"
  );
}

const columns: ColumnDef<AdminUserListItem>[] = [
  {
    id: "customer",
    header: "Customer",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex min-w-0 flex-col gap-1">
          <span className="font-medium text-foreground">
            {user.name || `Customer #${user.id}`}
          </span>
          <span className="text-xs text-muted-foreground">#{user.id}</span>
        </div>
      );
    },
  },
  {
    id: "contact",
    header: "Contact",
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
            <span className="text-muted-foreground">{contactLabel(user)}</span>
          ) : null}
        </div>
      );
    },
  },
  {
    id: "location",
    header: "Location",
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
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant={user.isEmailVerified ? "secondary" : "outline"}>
            {user.isEmailVerified ? "Email verified" : "Email pending"}
          </Badge>
          <Badge variant={user.onboardingCompleted ? "secondary" : "outline"}>
            {user.onboardingCompleted ? "Onboarded" : "Incomplete"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

export default function CustomersAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data, isLoading, isError, error } = useAdminUsers({ role: "tenant" });
  const customers = useMemo(() => data?.items ?? [], [data?.items]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((user) =>
      [
        user.name,
        user.email,
        user.phone,
        user.locationCity,
        user.locationState,
        user.locationCountry,
      ]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [customers, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-heading text-xl font-bold text-foreground">
          Customers
        </h2>
        <p className="text-sm text-muted-foreground">
          View registered customer users, contact details, verification, and onboarding status.
        </p>
      </div>

      {isError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load customers</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || "Please try again."}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total customers</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="size-5 text-primary" aria-hidden />
              {customers.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Email verified</CardDescription>
            <CardTitle className="text-2xl">
              {customers.filter((user) => user.isEmailVerified).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Onboarding complete</CardDescription>
            <CardTitle className="text-2xl">
              {customers.filter((user) => user.onboardingCompleted).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer users</CardTitle>
          <CardDescription>
            Search customer records by name, email, phone, or location.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search customers..."
              className="pl-9"
            />
          </div>
          <DataTable
            columns={columns}
            data={filteredCustomers}
            isLoading={isLoading}
            emptyMessage="No customers found."
          />
        </CardContent>
      </Card>
    </div>
  );
}
