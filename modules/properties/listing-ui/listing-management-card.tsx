"use client";

import Link from "next/link";
import { Edit, Eye, MapPin, MoreVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { buildPropertyPath } from "@/lib/property-slug";
import { PropertyStatus } from "@/lib/property-mapper";
import { listingFacts } from "@/lib/property-posting";
import type { Property } from "@/lib/property-view-model";

export type ListingManagementProperty = Property & { rejectionReason?: string | null };

type ListingManagementCardProps = {
  property: ListingManagementProperty;
  deleting?: boolean;
  onDelete: () => void;
};

export function ListingManagementCard({
  property: p,
  deleting,
  onDelete,
}: ListingManagementCardProps) {
  const facts = listingFacts(p).map((f) => f.text).join(" · ");
  const isApproved = p.status === PropertyStatus.APPROVED;
  const isRejected = p.status === PropertyStatus.REJECTED;
  const reason = p.rejectionReason?.trim();

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-col md:flex-row md:items-stretch">
        <div className="relative w-full shrink-0 md:w-48">
          {p.image ? (
            <img
              src={p.image}
              alt={p.title}
              className="aspect-[16/10] w-full object-cover md:aspect-[4/3] md:h-full md:min-h-[144px]"
            />
          ) : (
            <div className="aspect-[16/10] w-full bg-muted md:aspect-[4/3] md:min-h-[144px]" aria-hidden />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-4 md:flex-row md:items-center md:gap-6 md:py-4 md:pr-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {p.categoryLabel ? (
                <Badge variant="outline" className="text-[10px]">{p.categoryLabel}</Badge>
              ) : null}
              <Badge
                variant={isApproved ? "default" : isRejected ? "destructive" : "secondary"}
                className="text-[10px]"
              >
                {p.status || PropertyStatus.PENDING}
              </Badge>
            </div>
            <h3 className="line-clamp-2 font-heading text-base font-semibold text-foreground">{p.title}</h3>
            <p className="flex items-start gap-1 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              <span className="line-clamp-2">{p.location}</span>
            </p>
            {facts ? <p className="text-xs text-muted-foreground">{facts}</p> : null}
            {isRejected && reason ? (
              <Alert variant="destructive" className="py-2">
                <AlertTitle className="text-xs">Not approved</AlertTitle>
                <AlertDescription className="text-xs">{reason}</AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-3 md:w-44 md:items-end">
            <p className="font-heading text-xl font-bold tabular-nums text-foreground md:text-right">
              {p.price}
              <span className="text-sm font-medium text-muted-foreground">{p.priceLabel}</span>
            </p>

            <div className="hidden items-center justify-end gap-2 md:flex">
              {isApproved ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={buildPropertyPath(p.id, p.title)}>
                    <Eye className="size-3.5" />
                    View
                  </Link>
                </Button>
              ) : null}
              <Button size="sm" asChild>
                <Link href={`/edit-property/${p.id}`}>
                  <Edit className="size-3.5" />
                  Edit
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="More actions">
                    <MoreVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    disabled={deleting}
                    onClick={onDelete}
                  >
                    <Trash2 className="size-4" />
                    {deleting ? "Deleting…" : "Delete listing"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid gap-2 border-t border-border p-3 md:hidden ${isApproved ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {isApproved ? (
          <Button size="sm" variant="secondary" asChild className="min-h-11">
            <Link href={buildPropertyPath(p.id, p.title)}>
              <Eye className="mr-1 size-3.5" />
              View
            </Link>
          </Button>
        ) : null}
        <Button size="sm" variant="outline" asChild className="min-h-11">
          <Link href={`/edit-property/${p.id}`}>
            <Edit className="mr-1 size-3.5" />
            Edit
          </Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="min-h-11 text-destructive"
          disabled={deleting}
          onClick={onDelete}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </article>
  );
}
