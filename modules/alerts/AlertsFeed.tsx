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
              Updates for leads, payouts, tickets, and account activity.
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
        <div className="overflow-hidden rounded-xl border border-border bg-card">
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
      )}
    </div>
  );
}
