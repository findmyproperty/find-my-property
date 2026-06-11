"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BackendProperty } from "@/lib/property-mapper";
import { Form } from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { propertyFormSchema, getDefaultValues, type PropertyFormValues } from "./add-property-modules/schema";
import { BasicInformation } from "./add-property-modules/BasicInformation";
import { PropertyOverview } from "./add-property-modules/PropertyOverview";
import { LocationSection } from "./add-property-modules/LocationSection";
import { DescriptionFields, AmenitiesFields } from "./add-property-modules/DescriptionAmenities";
import { PropertyImagesSection } from "./add-property-modules/PropertyImagesSection";
import { VideoSection } from "./add-property-modules/VideoSection";
import { FloorPlansSection } from "./add-property-modules/FloorPlansSection";

const BASE_SECTIONS = [
  "basic",
  "overview",
  "location",
  "description",
  "amenities",
  "images",
  "video",
  "floorplans",
] as const;

const AddProperty = ({ initialData }: { initialData?: BackendProperty }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: getDefaultValues(initialData),
  });

  const onSubmit = async (data: PropertyFormValues) => {
    setLoading(true);

    const allImageUrls = [...data.propertyImages];
    const validFloorPlans = data.floorPlans
      .filter((fp) => {
        const url = fp.imageUrl.trim();
        if (!url) return false;
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      })
      .map((fp) => ({
        ...fp,
        rooms: Number(fp.rooms),
        bathrooms: Number(fp.bathrooms),
        imageUrl: fp.imageUrl.trim(),
      }));

    try {
      const payload: Record<string, unknown> = {
        title: data.title.trim(),
        description: data.description?.trim() || "Property listed via tenant dashboard",
        price: data.price,
        currency: "INR",
        listingType: data.listingType,
        propertyType: data.propertyType,
        address: data.address.trim(),
        locality: data.locality?.trim() || data.city.trim(),
        city: data.city.trim(),
        state: data.state?.trim(),
        country: data.country?.trim() || "India",
        bedrooms: Number(data.bedrooms),
        bathrooms: Number(data.bathrooms),
        area: Number((Number(data.area) / 10.7639).toFixed(2)),
        yearBuilt: data.yearBuilt,
        furnishing: data.furnishing,
        amenities: data.amenities,
        propertyImages: allImageUrls,
        thumbnailUrl: data.thumbnailUrl || allImageUrls[0] || "",
        videoUrl: data.videoUrl,
        floorPlans: validFloorPlans,
      };

      if (
        data.latitude != null &&
        data.longitude != null &&
        Number.isFinite(data.latitude) &&
        Number.isFinite(data.longitude)
      ) {
        payload.latitude = data.latitude;
        payload.longitude = data.longitude;
      }

      let propertyIdForCache: string | undefined;

      if (initialData?.id) {
        await api.updateProperty(String(initialData.id), payload);
        propertyIdForCache = String(initialData.id);
        toast({
          variant: "success",
          title: "Property updated",
          description: "Your listing has been saved successfully.",
        });
      } else {
        const created = await api.createProperty(payload);
        propertyIdForCache = String(created.id);
        toast({
          variant: "success",
          title: "Property submitted",
          description: "Your listing has been created successfully.",
        });
      }

      await revalidatePropertyListingCache(propertyIdForCache);
      await invalidatePropertyQueries(queryClient, propertyIdForCache);
      router.refresh();
      router.push("/listings");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save listing",
        description:
          error instanceof Error ? error.message : "Check your connection and fields, then try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerClass =
    "px-6 py-4 text-left font-heading font-semibold text-base text-foreground hover:no-underline [&[data-state=open]]:bg-muted/40";

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            {initialData ? "Edit Property" : "Add Property"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {initialData ? "Update your property listing details" : "Create a new property listing"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={form.handleSubmit(onSubmit, () => {
            toast({
              variant: "destructive",
              title: "Check required fields",
              description: "Fill in all fields marked with * and fix any errors below before saving.",
            });
          })}
          className="space-y-6"
        >
          <Accordion
            type="multiple"
            defaultValue={[...BASE_SECTIONS]}
            className="w-full rounded-xl border border-border bg-card shadow-sm"
          >
            <AccordionItem value="basic" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Basic Information</AccordionTrigger>
              <AccordionContent className="px-6 pt-4 pt-4">
                <BasicInformation />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="overview" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Property Overview</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <PropertyOverview />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="location" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Location</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <LocationSection />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="description" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Description</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <DescriptionFields />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="amenities" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Amenities &amp; Features</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <AmenitiesFields />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="images" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Property Images</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <PropertyImagesSection />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="video" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Video</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <VideoSection />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="floorplans" className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>Floor Plans</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <FloorPlansSection />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="flex gap-3">
            <Button type="submit" size="lg" className="flex-1" disabled={loading}>
              <Upload className="mr-2 h-4 w-4" /> {loading ? "Saving…" : initialData ? "Save Changes" : "Create Property"}
            </Button>
            <Button type="button" variant="outline" size="lg" asChild>
              <Link href="/listings">Cancel</Link>
            </Button>
          </div>
        </motion.form>
      </Form>
    </div>
  );
};

export default AddProperty;
