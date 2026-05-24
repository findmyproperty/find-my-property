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
          <div className="space-y-6 lg:col-span-2">
            <KeyFactsCard property={property} />
            <DescriptionSection property={property} />
            <AmenitiesSection amenities={amenities} />
            <FloorPlansSection
              floorPlans={floorPlans}
              activeIndex={activeFloorIndex}
              onFloorChange={setActiveFloorIndex}
            />
            {property.videoUrl ? <VideoSection videoUrl={property.videoUrl} /> : null}
            <LocationMapSection location={property.location} />
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
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
