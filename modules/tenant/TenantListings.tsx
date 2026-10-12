"use client";

import { motion } from "framer-motion";
import { Plus, MapPin, Edit, Trash2 } from "lucide-react";
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
            className="bg-card rounded-xl border border-border p-4 flex flex-col sm:flex-row gap-4"
          >
            {p.image ? (
              <img src={p.image} alt={p.title} className="h-24 w-full rounded-lg object-cover sm:w-36" />
            ) : (
              <div className="h-24 w-full shrink-0 rounded-lg bg-muted sm:w-36" aria-hidden />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-foreground">{p.title}</h3>
                {p.categoryLabel ? (
                  <Badge variant="outline" className="text-[10px]">{p.categoryLabel}</Badge>
                ) : null}
                <Badge variant={p.status === PropertyStatus.APPROVED ? "default" : p.status === PropertyStatus.REJECTED ? "destructive" : "secondary"} className="text-[10px]">
                  {p.status || PropertyStatus.PENDING}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                <MapPin className="w-3.5 h-3.5" /> {p.location}
              </p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                {listingFacts(p).map((fact) => (
                  <span key={`${fact.icon}-${fact.text}`}>{fact.text}</span>
                ))}
                <span className="font-semibold text-foreground ml-auto">{p.price}{p.priceLabel}</span>
              </div>
            </div>
            
            <div className="flex sm:flex-col gap-2 justify-end sm:justify-start mt-4 sm:mt-0 sm:ml-4 border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
              <Button size="sm" variant="outline" asChild className="w-full sm:w-auto h-8 px-3">
                <Link href={`/edit-property/${p.id}`}>
                  <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                </Link>
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3"
                disabled={deletingId === p.id}
                onClick={() => handleDelete(p.id)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> {deletingId === p.id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </motion.div>
        ))
        )}
      </div>
    </div>
  );
};

export default TenantListings;
