import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { TAGS } from "@/config/tags";
import { getCachedProperties } from "@/lib/server/cached-properties";
import PropertyCard from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Server Component streamed as HTML via React Suspense on the landing page.
 * Uses Next.js 16 cache tags to revalidate immediately when listings are modified.
 */
export async function FeaturedPropertiesStreamingSection() {
  "use cache";
  cacheTag(TAGS.properties);
  cacheLife("days");

  const allProperties = await getCachedProperties();
  const featuredProperties = allProperties.slice(0, 4);

  if (featuredProperties.length === 0) {
    return (
      <Card className="rounded-2xl border-border/80">
        <CardHeader className="text-center py-16">
          <Building2 className="mx-auto size-12 text-primary/40 mb-3" />
          <CardTitle className="font-heading text-2xl">Properties being onboarded</CardTitle>
          <CardDescription className="max-w-md mx-auto mt-2">
            Our verification team is inspecting newly submitted listings. You can browse all available listings or list your property directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-12 gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/owner">List a property</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl">
            <Link href="/browse">Explore catalog</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {featuredProperties.map((property, index) => (
        <PropertyCard key={property.id} property={property} index={index} />
      ))}
    </div>
  );
}
