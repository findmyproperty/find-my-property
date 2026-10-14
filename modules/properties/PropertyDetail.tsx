"use client";

/**
 * Property detail route — wires data fetching, layout, and composed sections under `./detail/`.
 * @see modules/properties/detail/index.ts for individual section components.
 */

import { useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { PropertyDetailSkeleton } from "@/components/skeletons/property-detail-skeleton";
import { useProperties, useProperty } from "@/hooks/use-properties";
import { useAuth } from "@/contexts/auth-context";
import { useCreateLead } from "@/hooks/use-leads";
import { parsePropertyIdFromSlugParam } from "@/lib/property-slug";
import {
  AgentContactCard,
  AmenitiesSection,
  DescriptionSection,
  FloorPlansSection,
  HeroSection,
  KeyFactsCard,
  LocationMapSection,
  OwnerContactCard,
  PropertyDetailNotFound,
  SimilarListingsSection,
  VideoSection,
} from "@/modules/properties/detail";
import { groupDetailRows } from "@/lib/detail-card-groups";
import { detailRows, listingFacts, showsFloorPlans } from "@/lib/property-posting";

const PropertyDetail = () => {
  const params = useParams<{ slug: string }>();
  const pathname = usePathname();
  const id = params.slug ? parsePropertyIdFromSlugParam(params.slug) : null;
  const { user, isAuthReady } = useAuth();
  const { data: properties } = useProperties();
  const { data: propertyData, isLoading } = useProperty(id ?? undefined);
  const createLead = useCreateLead();
  const allProperties = properties ?? [];
  const property = propertyData ?? allProperties.find((p) => p.id === id);

  const [activeFloorIndex, setActiveFloorIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState("");

  useEffect(() => {
    setActiveFloorIndex(0);
  }, [property?.id]);

  const loginHref = `/login?from=${encodeURIComponent(pathname || (id ? `/property/${params.slug}` : "/browse"))}`;
  const canEnquireAsTenant = isAuthReady && user?.role === "tenant";

  if (isLoading && !property) {
    return <PropertyDetailSkeleton />;
  }

  if (!property) {
    return (
      <div className="pt-6 pb-20 text-center">
        <PropertyDetailNotFound />
      </div>
    );
  }

  const images = property.images?.length ? property.images : property.image ? [property.image] : [];
  const similarProperties = allProperties.filter((p) => p.id !== id).slice(0, 4);
  const amenities = property.amenities ?? [];
  const floorPlans = property.floorPlans ?? [];
  const isAgentOwner = property.ownerRole === "agent";
  const categorized = Boolean(property.propertySector);
  const rows = categorized ? detailRows(property.details) : [];
  const detailGroups = groupDetailRows(rows);

  return (
    <div className="pb-20 pt-6">
      <HeroSection
        property={property}
        images={images}
        mainImageIndex={mainImageIndex}
        onMainImageChange={setMainImageIndex}
      />

      <div className="container mx-auto mt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="order-2 space-y-6 lg:order-none lg:col-span-2">
            <KeyFactsCard property={property} facts={categorized ? listingFacts(property) : undefined} />
            <DescriptionSection property={property} />
            {rows.length > 0 ? (
              <>
                <section className="hidden rounded-2xl border border-border bg-card p-6 lg:block">
                  <h2 className="mb-4 font-heading text-base font-semibold text-foreground">
                    Listing details
                  </h2>
                  <dl className="grid gap-3 sm:grid-cols-2">
                    {rows.map((row) => (
                      <div key={row.label}>
                        <dt className="text-xs text-muted-foreground">{row.label}</dt>
                        <dd className="text-sm text-foreground">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
                <div className="flex flex-col gap-4 lg:hidden">
                  {detailGroups.map((group) => (
                    <section
                      key={group.title}
                      className="rounded-2xl border border-border bg-card p-5"
                    >
                      <h2 className="mb-3 font-heading text-sm font-semibold text-foreground">
                        {group.title}
                      </h2>
                      <dl className="grid gap-3">
                        {group.rows.map((row) => (
                          <div key={`${group.title}-${row.label}`}>
                            <dt className="text-xs text-muted-foreground">{row.label}</dt>
                            <dd className="text-sm font-medium text-foreground">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
              </>
            ) : null}
            <AmenitiesSection amenities={amenities} />
            {showsFloorPlans(property.propertySector, property.postingType) ? (
              <FloorPlansSection
                floorPlans={floorPlans}
                activeIndex={activeFloorIndex}
                onFloorChange={setActiveFloorIndex}
              />
            ) : null}
            {property.videoUrl ? <VideoSection videoUrl={property.videoUrl} /> : null}
            <LocationMapSection location={property.location} />
          </div>

          <div className="order-1 lg:order-none lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-24">
              {isAgentOwner ? (
                <AgentContactCard
                  property={{
                    ...property,
                    agentName: property.agentName ?? property.ownerName,
                  }}
                  canEnquireAsTenant={canEnquireAsTenant}
                  isAuthReady={isAuthReady}
                  userRole={user?.role}
                  loginHref={loginHref}
                  enquiryOpen={enquiryOpen}
                  onEnquiryOpenChange={setEnquiryOpen}
                  enquiryMessage={enquiryMessage}
                  onEnquiryMessageChange={setEnquiryMessage}
                  createLead={createLead}
                />
              ) : (
                <OwnerContactCard property={property} />
              )}
            </div>
          </div>
        </div>

        <SimilarListingsSection properties={similarProperties} />
      </div>
    </div>
  );
};

export default PropertyDetail;
