"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function AlertsFeed() {
  const { data, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead();

  const unread = data?.filter((n) => !n.read).length ?? 0;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold">Alerts</h1>
          {unread > 0 ? (
            <Badge variant="secondary">{unread} unread</Badge>
          ) : null}
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.length ? (
        <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
          No alerts yet. You will see updates for leads, payouts, and account status here.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border">
          {data.map((n) => {
            const href = notificationHref(n);
            const content = (
              <div
                className={`px-4 py-3 ${!n.read ? "bg-primary/5" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !n.read) markRead(n.id);
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{n.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                  </div>
                  {!n.read ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </p>
              </div>
            );
            return (
              <li key={n.id}>
                {href ? (
                  <Link href={href} className="block hover:bg-muted/50">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
