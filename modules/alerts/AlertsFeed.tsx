"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { type ColumnDef } from "@tanstack/react-table";
import { Check, CheckCheck, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import { AdminListPage } from "@/components/admin/admin-list-page";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import { useAuth } from "@/contexts/auth-context";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import { NOTIFICATION_READ_STATUS_OPTIONS } from "@/lib/admin/status-config";
import { getNotificationHref } from "@/lib/notification-href";
import { cn } from "@/lib/utils";
import type { Notification } from "@/schema/notification";
import type { UserRole } from "@/end-points/types";

const PAGE_SIZE = 20;

type ReadFilter = "all" | "unread" | "read";
type AlertSortKey = "alert" | "type" | "status" | "createdAt";

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

function alertSearchText(notification: Notification): string {
  return [notification.title, notification.body, notification.type, String(notification.id)]
    .join(" ")
    .toLowerCase();
}

function compareAlerts(a: Notification, b: Notification, key: AlertSortKey): number {
  switch (key) {
    case "alert":
      return compareStrings(a.title, b.title);
    case "type":
      return compareStrings(a.type, b.type);
    case "status":
      return compareStrings(a.read ? "read" : "unread", b.read ? "read" : "unread");
    case "createdAt":
      return compareDates(a.createdAt, b.createdAt);
  }
}

export default function AlertsFeed() {
  const { user } = useAuth();
  const role = user?.role as UserRole | undefined;
  const { data, isLoading, isError, error } = useNotifications();
  const { mutate: markRead, isPending: markingOne } = useMarkNotificationRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead();

  const allAlerts = useMemo(() => data ?? [], [data]);
  const unread = allAlerts.filter((n) => !n.read).length;

  const [readFilter, setReadFilter] = useState<ReadFilter>("all");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
  } = useAdminListControls<AlertSortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [readFilter],
  });

  const readCounts = useMemo(
    () => ({
      unread: allAlerts.filter((n) => !n.read).length,
      read: allAlerts.filter((n) => n.read).length,
    }),
    [allAlerts],
  );

  const filteredAlerts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const filtered = allAlerts.filter((notification) => {
      if (readFilter === "unread" && notification.read) return false;
      if (readFilter === "read" && !notification.read) return false;
      if (q && !alertSearchText(notification).includes(q)) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareAlerts(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [allAlerts, debouncedSearch, readFilter, sort.dir, sort.key]);

  const pagedAlerts = useMemo(
    () => paginateItems(filteredAlerts, page, PAGE_SIZE),
    [filteredAlerts, page],
  );

  const columns = useMemo<ColumnDef<Notification, unknown>[]>(
    () => [
      {
        id: "alert",
        header: "Alert",
        meta: { sortKey: "alert", className: "max-w-[420px]" },
        cell: ({ row }) => {
          const n = row.original;
          return (
            <div
              className={cn(
                "flex flex-col gap-1 rounded-md -m-2 p-2",
                !n.read && "bg-primary/5",
              )}
            >
              <span className="font-medium">{n.title}</span>
              <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        meta: { sortKey: "type", className: "capitalize" },
        cell: ({ row }) => formatType(row.original.type),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) =>
          row.original.read ? (
            <Badge variant="secondary">Read</Badge>
          ) : (
            <Badge>Unread</Badge>
          ),
      },
      {
        id: "created",
        header: "Created",
        meta: {
          sortKey: "createdAt",
          className: "whitespace-nowrap text-right text-xs text-muted-foreground",
        },
        cell: ({ row }) =>
          formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true }),
      },
      {
        id: "action",
        header: "Action",
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const n = row.original;
          const href = getNotificationHref(n, role);
          return (
            <div className="flex justify-end gap-2">
              {!n.read ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={markingOne}
                  onClick={() => markRead(n.id)}
                >
                  <Check className="mr-1 h-4 w-4" />
                  Read
                </Button>
              ) : null}
              {href ? (
                <Button variant="ghost" size="icon" asChild>
                  <Link href={href} aria-label={`Open ${n.title}`}>
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [markRead, markingOne, role],
  );

  return (
    <AdminListPage
      title="Alerts"
      description="Updates for leads, emails, payouts, tickets, and account activity."
      headerAction={
        unread > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{unread} unread</Badge>
            <Button
              variant="outline"
              size="sm"
              disabled={markingAll}
              onClick={() => markAll()}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </div>
        ) : null
      }
      isLoading={isLoading}
      loadingLabel="Loading alerts…"
      isError={isError}
      error={error}
      errorTitle="Could not load alerts"
      isEmpty={!isLoading && !isError && filteredAlerts.length === 0}
      emptyTitle={allAlerts.length === 0 ? "No alerts yet" : "No alerts match your filters"}
      emptyDescription={
        allAlerts.length === 0
          ? "You will see updates here."
          : "Try All statuses or clearing search."
      }
      toolbar={
        <AdminToolbar
          statusFilter={{
            value: readFilter,
            onChange: (value) => setReadFilter(value as ReadFilter),
            options: NOTIFICATION_READ_STATUS_OPTIONS,
            counts: readCounts,
            totalCount: allAlerts.length,
            label: "Read status",
          }}
          search={{
            value: search,
            onChange: setSearch,
            placeholder: "Search title, body, or type…",
          }}
        />
      }
      pagination={{
        page: pagedAlerts.page,
        totalPages: pagedAlerts.totalPages,
        total: pagedAlerts.total,
        pageSize: PAGE_SIZE,
        onPageChange: setPage,
      }}
    >
      <>
        <div className="grid gap-3 md:hidden">
          {pagedAlerts.items.map((n) => (
            <AlertCard
              key={n.id}
              notification={n}
              role={role}
              isMarking={markingOne}
              onMarkRead={markRead}
            />
          ))}
        </div>

        <AdminDataTable
          className="hidden md:block"
          columns={columns}
          data={pagedAlerts.items}
          getRowId={(row) => String(row.id)}
          sort={sort}
          onSort={toggleSort}
        />
      </>
    </AdminListPage>
  );
}

function AlertCard({
  notification,
  role,
  isMarking,
  onMarkRead,
}: {
  notification: Notification;
  role: UserRole | undefined;
  isMarking: boolean;
  onMarkRead: (id: number) => void;
}) {
  const href = getNotificationHref(notification, role);
  const createdDate = new Date(notification.createdAt);
  const createdAt = formatDistanceToNow(createdDate, {
    addSuffix: true,
  });

  return (
    <article
      className={
        notification.read
          ? "rounded-xl border border-border bg-card p-4"
          : "rounded-xl border border-primary/20 bg-primary/5 p-4"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-sm font-semibold text-foreground">
            {notification.title}
          </h2>
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
            {notification.body}
          </p>
        </div>
        {notification.read ? (
          <Badge variant="secondary" className="shrink-0">
            Read
          </Badge>
        ) : (
          <Badge className="shrink-0">Unread</Badge>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="capitalize">{formatType(notification.type)}</span>
        <span aria-hidden>&bull;</span>
        <time dateTime={createdDate.toISOString()}>{createdAt}</time>
      </div>

      {!notification.read || href ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {!notification.read ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              disabled={isMarking}
              onClick={() => onMarkRead(notification.id)}
            >
              <Check data-icon="inline-start" />
              Mark read
            </Button>
          ) : null}
          {href ? (
            <Button variant="ghost" size="sm" className="w-full sm:w-auto" asChild>
              <Link href={href} aria-label={`Open ${notification.title}`}>
                <ExternalLink data-icon="inline-start" />
                Open
              </Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}
