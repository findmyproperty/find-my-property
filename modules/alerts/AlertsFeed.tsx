"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/use-notifications";
import type { Notification } from "@/schema/notification";

function notificationHref(n: Notification): string | null {
  const meta = n.metadata;
  if (!meta || typeof meta !== "object") return null;
  const leadId = meta.leadId;
  if (typeof leadId === "number") return `/leads/${leadId}`;
  const ticketId = meta.ticketId;
  if (typeof ticketId === "number") return "/support";
  if (n.type === "vendor_payout") return "/wallet";
  if (n.type === "property_lead_new" && typeof leadId === "number") {
    return `/leads/${leadId}`;
  }
  const emailLogId = meta.emailLogId;
  if (n.type === "email_received" && typeof emailLogId === "number") {
    return "/admin/email-logs";
  }
  return null;
}

function formatType(type: string) {
  return type.replace(/_/g, " ");
}

export default function AlertsFeed() {
  const { data, isLoading } = useNotifications();
  const { mutate: markRead, isPending: markingOne } = useMarkNotificationRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead();

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <div>
            <h1 className="font-heading text-xl font-bold">Alerts</h1>
            <p className="text-sm text-muted-foreground">
              Updates for leads, emails, payouts, tickets, and account activity.
            </p>
          </div>
          {unread > 0 ? <Badge variant="secondary">{unread} unread</Badge> : null}
        </div>
        {unread > 0 ? (
          <Button
            variant="outline"
            size="sm"
            disabled={markingAll}
            onClick={() => markAll()}
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading alerts...
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {data?.map((n) => (
              <AlertCard
                key={n.id}
                notification={n}
                isMarking={markingOne}
                onMarkRead={markRead}
              />
            ))}
            {!data?.length ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                No alerts yet. You will see updates here.
              </div>
            ) : null}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.map((n) => {
                  const href = notificationHref(n);
                  return (
                    <TableRow key={n.id} className={!n.read ? "bg-primary/5" : undefined}>
                      <TableCell className="max-w-[420px]">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{n.title}</span>
                          <span className="line-clamp-2 text-xs text-muted-foreground">{n.body}</span>
                        </div>
                      </TableCell>
                      <TableCell className="capitalize">{formatType(n.type)}</TableCell>
                      <TableCell>
                        {n.read ? (
                          <Badge variant="secondary">Read</Badge>
                        ) : (
                          <Badge>Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!data?.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      No alerts yet. You will see updates here.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function AlertCard({
  notification,
  isMarking,
  onMarkRead,
}: {
  notification: Notification;
  isMarking: boolean;
  onMarkRead: (id: number) => void;
}) {
  const href = notificationHref(notification);
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
