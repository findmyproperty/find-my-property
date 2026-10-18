"use client";



/**

 * Property detail route — hero fold + section cards + sticky sidebar.

 */



import { useState, useEffect } from "react";

import { useParams, usePathname } from "next/navigation";

import { PropertyDetailSkeleton } from "@/components/skeletons/property-detail-skeleton";

import { useProperties, useProperty } from "@/hooks/use-properties";

import { useAuth } from "@/contexts/auth-context";
import { useSettings } from "@/contexts/settings-context";
import { useCreateLead } from "@/hooks/use-leads";
import { normalizeContactPhone } from "@/lib/contact-links";

import { parsePropertyIdFromSlugParam } from "@/lib/property-slug";

import { getPriceStripExtras } from "@/lib/property-detail-highlights";

import { PropertyPriceStrip } from "@/modules/properties/listing-ui";

import {

  AgentContactCard,

  AmenitiesSection,

  DescriptionSection,

  FloorPlansSection,

  HeroSection,

  LocationMapSection,

  OwnerContactCard,

  OverviewSection,

  PropertyDetailNotFound,

  PropertyMobileContactBar,

  LoanServiceSidebarCard,

  SimilarListingsSidebar,

  VideoSection,

} from "@/modules/properties/detail";

import { detailRows, showsFloorPlans } from "@/lib/property-posting";



const PropertyDetail = () => {

  const params = useParams<{ slug: string }>();

  const pathname = usePathname();

  const id = params.slug ? parsePropertyIdFromSlugParam(params.slug) : null;

  const { user, isAuthReady, isAuthenticated } = useAuth();
  const { settings, isLoading: areSettingsLoading } = useSettings();

  const { data: properties } = useProperties();

  const { data: propertyData, isLoading } = useProperty(id ?? undefined);

  const createLead = useCreateLead();

  const allProperties = properties ?? [];

  const property = propertyData ?? allProperties.find((p) => p.id === id);



  const [mainImageIndex, setMainImageIndex] = useState(0);

  const [activeFloorIndex, setActiveFloorIndex] = useState(0);

  const [enquiryOpen, setEnquiryOpen] = useState(false);

  const [enquiryMessage, setEnquiryMessage] = useState("");



  useEffect(() => {
    setTimeout(() => {
      setMainImageIndex(0);
      setActiveFloorIndex(0);
    }, 0);
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
  const isAdmin = isAuthReady && isAuthenticated && user?.role === "admin";
  const contactReady = isAuthReady && (isAdmin || !areSettingsLoading);

  const categorized = Boolean(property.propertySector);

  const rows = categorized ? detailRows(property.details) : [];

  const authorizedPropertyPhone = isAgentOwner
    ? property.agentPhone || property.ownerPhone
    : property.ownerPhone;
  const isSupportContact = contactReady && !isAdmin;
  const contactPhone = !contactReady
    ? null
    : normalizeContactPhone(
        isAdmin ? authorizedPropertyPhone : settings?.supportPhone,
      );

  const { deposit, maintenance } = getPriceStripExtras(property);

  const showPriceStrip = Boolean(deposit || maintenance);



  const foldContactCard = isAgentOwner && !isAdmin ? (

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

    <OwnerContactCard
      property={property}
      phone={contactPhone}
      contactReady={contactReady}
      isSupportContact={isSupportContact}
    />

  );



  return (

    <div className="pb-28 pt-6 lg:pb-20">

      <div className="container mx-auto space-y-6">

        <HeroSection

          property={property}

          images={images}

          mainImageIndex={mainImageIndex}

          onMainImageChange={setMainImageIndex}

        />



        {showPriceStrip ? <PropertyPriceStrip property={property} /> : null}

        <div className="flex flex-col gap-4 md:flex-row md:gap-6">

          <div className="order-2 min-w-0 flex-1 space-y-6 md:order-1">

            {(rows.length > 0 || !categorized) && (

              <OverviewSection

                rows={rows}

                property={property}

                showLegacyFacts={!categorized}

              />

            )}

            <DescriptionSection property={property} />

            <LocationMapSection location={property.location} />

            <AmenitiesSection amenities={amenities} />

            {showsFloorPlans(property.propertySector, property.postingType) ? (

              <FloorPlansSection

                floorPlans={floorPlans}

                activeIndex={activeFloorIndex}

                onFloorChange={setActiveFloorIndex}

              />

            ) : null}

            {property.videoUrl ? <VideoSection videoUrl={property.videoUrl} /> : null}

          </div>



          <aside
            className="order-1 flex w-full shrink-0 flex-col gap-4 md:order-2 md:w-80 md:max-w-[38%] lg:w-96 xl:w-[26rem]"
          >
            {foldContactCard}

            <div
              className="hidden min-h-0 w-full flex-col gap-4 md:sticky md:top-20 md:z-20 md:flex md:max-h-[calc(100dvh-3.5rem)] md:self-start md:overflow-y-auto md:overscroll-contain xl:top-24 xl:max-h-[calc(100dvh-4.5rem)]"
            >
              <SimilarListingsSidebar properties={similarProperties} variant="sidebar" />
              <LoanServiceSidebarCard />
            </div>
          </aside>

        </div>



        <SimilarListingsSidebar properties={similarProperties} variant="bottom" />

        <div className="md:hidden">

          <LoanServiceSidebarCard />

        </div>

      </div>



      {isAgentOwner && !isAdmin ? (

        <PropertyMobileContactBar

          title={property.title}

          propertyId={property.id}

          phone={contactPhone}

          primaryLabel="Enquire"

          onPrimaryAction={isAuthReady ? () => {
            if (canEnquireAsTenant) setEnquiryOpen(true);
            else window.location.href = loginHref;
          } : undefined}

        />

      ) : (

        <PropertyMobileContactBar

          title={property.title}

          propertyId={property.id}

          phone={contactPhone}

        />

      )}

    </div>

  );

};



export default PropertyDetail;
