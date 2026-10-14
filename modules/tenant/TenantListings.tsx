"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingGridSkeleton } from "@/components/skeletons/listing-row-skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMyProperties } from "@/hooks/use-properties";
import { api } from "@/lib/api";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import { PropertyStatus } from "@/lib/property-mapper";
import { ListingManagementCard } from "@/modules/properties/listing-ui";

const TenantListings = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, refetch, isLoading } = useMyProperties();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const listings = data ?? [];

  const counts = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let rejected = 0;
    for (const p of listings) {
      if (p.status === PropertyStatus.APPROVED) approved++;
      else if (p.status === PropertyStatus.REJECTED) rejected++;
      else pending++;
    }
    return { approved, pending, rejected };
  }, [listings]);

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
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="mb-1 font-heading text-xl font-bold text-foreground">My Listings</h2>
          <p className="text-sm text-muted-foreground">Manage your property listings</p>
          {listings.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary" className="font-normal">
                {counts.approved} approved
              </Badge>
              <Badge variant="outline" className="font-normal">
                {counts.pending} pending
              </Badge>
              {counts.rejected > 0 ? (
                <Badge variant="destructive" className="font-normal">
                  {counts.rejected} rejected
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>
        <Button size="sm" asChild className="shrink-0">
          <Link href="/add-property">
            <Plus className="mr-1 size-4" /> Add Property
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <ListingGridSkeleton rows={4} />
        ) : listings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <p className="text-sm text-muted-foreground">You have no listings yet.</p>
            <Button className="mt-4" asChild>
              <Link href="/add-property">Add your first listing</Link>
            </Button>
          </div>
        ) : (
          listings.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ListingManagementCard
                property={p}
                deleting={deletingId === p.id}
                onDelete={() => void handleDelete(p.id)}
              />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default TenantListings;
