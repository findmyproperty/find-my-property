"use client";

import { motion } from "framer-motion";
import { Plus, MapPin, Edit, Trash2, Eye } from "lucide-react";
import { buildPropertyPath } from "@/lib/property-slug";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ListingGridSkeleton } from "@/components/skeletons/listing-row-skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMyProperties } from "@/hooks/use-properties";
import { api } from "@/lib/api";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { PropertyStatus } from "@/lib/property-mapper";
import { listingFacts } from "@/lib/property-posting";

const TenantListings = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, refetch, isLoading } = useMyProperties();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const listings = data ?? [];

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      setDeletingId(id);
      await api.deleteProperty(id);
      await revalidatePropertyListingCache(id);
      await invalidatePropertyQueries(queryClient, id);
      router.refresh();
      toast({
        variant: "success",
        title: "Listing removed",
        description: "Your property has been removed from the site.",
      });
      refetch();
    } catch (error) {
      toast({ title: "Failed to delete", description: error instanceof Error ? error.message : "An error occurred.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">My Listings</h2>
          <p className="text-sm text-muted-foreground">Manage your property listings</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/add-property">
            <Plus className="w-4 h-4 mr-1" /> Add Property
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <ListingGridSkeleton rows={4} />
        ) : listings.length === 0 ? (
          <p className="rounded-xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
            You have no listings yet. Add a property to get started.
          </p>
        ) : (
          listings.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="overflow-hidden rounded-xl border border-border bg-card sm:flex sm:flex-row sm:gap-4 sm:p-4"
          >
            {p.image ? (
              <img
                src={p.image}
                alt={p.title}
                className="aspect-[16/10] w-full object-cover sm:h-24 sm:w-36 sm:shrink-0 sm:rounded-lg"
              />
            ) : (
              <div
                className="aspect-[16/10] w-full bg-muted sm:h-24 sm:w-36 sm:shrink-0 sm:rounded-lg"
                aria-hidden
              />
            )}
            <div className="flex flex-1 flex-col gap-3 p-4 sm:p-0">
              <div className="flex flex-wrap items-center gap-2">
                {p.categoryLabel ? (
                  <Badge variant="outline" className="text-[10px]">{p.categoryLabel}</Badge>
                ) : null}
                <Badge
                  variant={
                    p.status === PropertyStatus.APPROVED
                      ? "default"
                      : p.status === PropertyStatus.REJECTED
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-[10px]"
                >
                  {p.status || PropertyStatus.PENDING}
                </Badge>
              </div>
              <div>
                <h3 className="font-medium text-foreground">{p.title}</h3>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0" /> {p.location}
                </p>
              </div>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                {p.price}
                {p.priceLabel}
              </p>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {listingFacts(p).map((fact) => (
                  <span key={`${fact.icon}-${fact.text}`}>{fact.text}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:mt-auto sm:flex sm:w-auto sm:flex-col sm:border-0 sm:pt-0">
                {p.status === PropertyStatus.APPROVED ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    asChild
                    className="min-h-11 w-full sm:min-h-8"
                  >
                    <Link href={buildPropertyPath(p.id, p.title)}>
                      <Eye className="mr-1 size-3.5" /> View
                    </Link>
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="min-h-11 w-full sm:min-h-8"
                >
                  <Link href={`/edit-property/${p.id}`}>
                    <Edit className="mr-1 size-3.5" /> Edit
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="min-h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:min-h-8"
                  disabled={deletingId === p.id}
                  onClick={() => handleDelete(p.id)}
                >
                  <Trash2 className="mr-1 size-3.5" />
                  {deletingId === p.id ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </motion.div>
        ))
        )}
      </div>
    </div>
  );
};

export default TenantListings;
