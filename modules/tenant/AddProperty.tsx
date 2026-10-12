"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { api } from "@/lib/api";
import type { BackendProperty } from "@/lib/property-mapper";
import { Form } from "@/components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { propertyFormSchema, getDefaultValues, type PropertyFormValues } from "./add-property-modules/schema";
import { BasicInformation } from "./add-property-modules/BasicInformation";
import { PropertyOverview } from "./add-property-modules/PropertyOverview";
import { LocationSection } from "./add-property-modules/LocationSection";
import { DescriptionFields, AmenitiesFields } from "./add-property-modules/DescriptionAmenities";
import { PropertyImagesSection } from "./add-property-modules/PropertyImagesSection";
import { VideoSection } from "./add-property-modules/VideoSection";
import { FloorPlansSection } from "./add-property-modules/FloorPlansSection";
import { ListingFields } from "./add-property-modules/ListingFields";
import { listingSections, type ListingSection } from "./add-property-modules/listing-sections";
import {
  EMPTY_LISTING_DETAILS,
  POSTING_LABELS,
  SECTOR_LABELS,
  PROPERTY_SECTORS,
  buildPropertyPayload,
  isAllowedPair,
  postingOptionsFor,
  validateListingForm,
  type PostingType,
  type PropertySector,
} from "@/lib/property-posting";

const BASE_SECTIONS = ["basic", "overview", "location", "description", "amenities", "images", "video", "floorplans"] as const;

const triggerClass =
  "px-6 py-4 text-left font-heading font-semibold text-base text-foreground hover:no-underline [&[data-state=open]]:bg-muted/40";

const AddProperty = ({ initialData }: { initialData?: BackendProperty }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isEdit = Boolean(initialData?.id);
  const [step, setStep] = useState(0);

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: getDefaultValues(initialData),
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const sector = useWatch({ control: form.control, name: "propertySector" }) || "";
  const posting = useWatch({ control: form.control, name: "postingType" }) || "";
  const isCategorized = isAllowedPair(sector, posting);
  const sections = useMemo(() => (isCategorized ? listingSections(sector, posting) : []), [isCategorized, sector, posting]);
  const steps = useMemo(() => [{ id: "choice", title: "Listing type" }, ...sections], [sections]);
  const { isDirty, isSubmitting } = form.formState;

  const applyIssues = (issues: { path: string; message: string }[]) => {
    form.clearErrors();
    for (const issue of issues) {
      form.setError(issue.path as never, { message: issue.message });
    }
  };

  const save = async (data: PropertyFormValues) => {
    const issues = validateListingForm(data);
    if (issues.length > 0) {
      applyIssues(issues);
      if (!isEdit) {
        const index = steps.findIndex((item) =>
          issues.some((issue) => issue.path === "postingType" || issue.path === "propertySector" || sectionHasPath(item, issue.path)),
        );
        if (index >= 0) setStep(index);
      }
      toast({
        variant: "destructive",
        title: "Check required fields",
        description: issues[0]?.message ?? "Fill in the fields marked with *.",
      });
      return;
    }

    try {
      const payload = buildPropertyPayload(data);
      let propertyIdForCache: string | undefined;
      if (initialData?.id) {
        await api.updateProperty(String(initialData.id), payload);
        const fresh = await api.getRawProperty(String(initialData.id));
        form.reset(getDefaultValues(fresh));
        propertyIdForCache = String(initialData.id);
        toast({ variant: "success", title: "Property updated", description: "Your listing has been saved successfully." });
      } else {
        const created = await api.createProperty(payload);
        propertyIdForCache = created.id;
        toast({ variant: "success", title: "Property submitted", description: "Your listing has been created successfully." });
      }
      await revalidatePropertyListingCache(propertyIdForCache);
      await invalidatePropertyQueries(queryClient, propertyIdForCache);
      router.refresh();
      if (!initialData?.id) router.push("/listings");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save listing",
        description: error instanceof Error ? error.message : "Check your connection and fields, then try again.",
      });
    }
  };

  const goNext = () => {
    const issues = validateListingForm(form.getValues()).filter((issue) => stepOwns(steps[step], issue.path));
    if (issues.length > 0) {
      applyIssues(issues);
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  };

  const onSector = (next: PropertySector) => {
    if (next === form.getValues("propertySector")) return;
    form.setValue("propertySector", next, { shouldDirty: true, shouldValidate: true });
    const current = form.getValues("postingType");
    if (current && !isAllowedPair(next, current)) {
      form.setValue("postingType", "", { shouldDirty: true, shouldValidate: true });
    }
    form.setValue("details", { ...EMPTY_LISTING_DETAILS, rooms: {} }, { shouldDirty: true });
  };

  const onPosting = (next: PostingType) => {
    if (next === form.getValues("postingType")) return;
    form.setValue("postingType", next, { shouldDirty: true, shouldValidate: true });
    form.setValue("details", { ...EMPTY_LISTING_DETAILS, rooms: {} }, { shouldDirty: true });
  };

  return (
    <div className={`max-w-3xl space-y-6 ${isEdit ? "pb-24" : ""}`}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{initialData ? "Edit Property" : "Add Property"}</h2>
          <p className="text-sm text-muted-foreground">
            {initialData ? "Update your property listing details" : "Choose a sector, then the listing type"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={form.handleSubmit((data) => {
            if (!isEdit && step < steps.length - 1) {
              goNext();
              return;
            }
            return save(data);
          })}
          className="space-y-6"
        >
          {isEdit ? (
            <EditBody
              sector={sector}
              posting={posting}
              sections={sections}
              onSector={onSector}
              onPosting={onPosting}
            />
          ) : (
            <CreateBody
              step={steps[step]}
              sector={sector}
              posting={posting}
              onSector={onSector}
              onPosting={onPosting}
            />
          )}

          {isEdit ? (
            isDirty ? (
              <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
                <div className="mx-auto flex max-w-3xl gap-3">
                  <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting}>
                    <Upload className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving…" : "Update Property"}
                  </Button>
                </div>
              </div>
            ) : null
          ) : (
            <div className="flex gap-3">
              {step > 0 ? (
                <Button type="button" variant="outline" size="lg" onClick={() => setStep((current) => current - 1)}>
                  Previous
                </Button>
              ) : null}
              {step < steps.length - 1 ? (
                <Button type="button" size="lg" className="flex-1" onClick={goNext} disabled={step === 0 && !isCategorized}>
                  Next
                </Button>
              ) : (
                <Button type="submit" size="lg" className="flex-1" disabled={isSubmitting || !isCategorized}>
                  <Upload className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving…" : "Create Property"}
                </Button>
              )}
              <Button type="button" variant="outline" size="lg" asChild>
                <Link href="/listings">Cancel</Link>
              </Button>
            </div>
          )}
        </motion.form>
      </Form>
    </div>
  );
};

function ChoiceFields({
  sector,
  posting,
  onSector,
  onPosting,
}: {
  sector: string;
  posting: string;
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
}) {
  const options = postingOptionsFor(sector);
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-foreground">Property sector</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {PROPERTY_SECTORS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onSector(item)}
              className={`rounded-lg border px-3 py-3 text-sm font-medium ${
                sector === item ? "border-primary bg-primary/10 text-foreground" : "border-border bg-card text-muted-foreground"
              }`}
            >
              {SECTOR_LABELS[item]}
            </button>
          ))}
        </div>
      </fieldset>
      {options.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Listing type</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onPosting(item)}
                className={`rounded-full border px-3 py-2 text-sm ${
                  posting === item ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {POSTING_LABELS[item]}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}

function SectionBody({ section }: { section: ListingSection }) {
  return (
    <div className="space-y-4">
      <ListingFields fields={section.fields} />
      {section.extras?.includes("location") ? <LocationSection /> : null}
      {section.extras?.includes("images") ? <PropertyImagesSection /> : null}
      {section.extras?.includes("video") ? <VideoSection /> : null}
      {section.extras?.includes("floorplans") ? <FloorPlansSection /> : null}
    </div>
  );
}

function CreateBody({
  step,
  sector,
  posting,
  onSector,
  onPosting,
}: {
  step?: { id: string; title: string };
  sector: string;
  posting: string;
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
}) {
  if (!step || step.id === "choice") {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <ChoiceFields sector={sector} posting={posting} onSector={onSector} onPosting={onPosting} />
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <h3 className="mb-4 font-heading text-base font-semibold">{step.title}</h3>
      <SectionBody section={step as ListingSection} />
    </div>
  );
}

function EditBody({
  sector,
  posting,
  sections,
  onSector,
  onPosting,
}: {
  sector: string;
  posting: string;
  sections: ListingSection[];
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
}) {
  const categorized = isAllowedPair(sector, posting);
  return (
    <Accordion type="multiple" defaultValue={["choice", ...(categorized ? sections.map((section) => section.id) : BASE_SECTIONS)]} className="w-full rounded-xl border border-border bg-card shadow-sm">
      <AccordionItem value="choice" className="border-b border-border">
        <AccordionTrigger className={triggerClass}>Listing type</AccordionTrigger>
        <AccordionContent className="px-6 pt-4">
          <ChoiceFields sector={sector} posting={posting} onSector={onSector} onPosting={onPosting} />
        </AccordionContent>
      </AccordionItem>
      {categorized
        ? sections.map((section) => (
            <AccordionItem key={section.id} value={section.id} className="border-b border-border last:border-b-0">
              <AccordionTrigger className={triggerClass}>{section.title}</AccordionTrigger>
              <AccordionContent className="px-6 pt-4">
                <SectionBody section={section} />
              </AccordionContent>
            </AccordionItem>
          ))
        : (
          <>
            <LegacySection value="basic" title="Basic Information"><BasicInformation /></LegacySection>
            <LegacySection value="overview" title="Property Overview"><PropertyOverview /></LegacySection>
            <LegacySection value="location" title="Location"><LocationSection /></LegacySection>
            <LegacySection value="description" title="Description"><DescriptionFields /></LegacySection>
            <LegacySection value="amenities" title="Amenities & Features"><AmenitiesFields /></LegacySection>
            <LegacySection value="images" title="Property Images"><PropertyImagesSection /></LegacySection>
            <LegacySection value="video" title="Video"><VideoSection /></LegacySection>
            <LegacySection value="floorplans" title="Floor Plans"><FloorPlansSection /></LegacySection>
          </>
        )}
    </Accordion>
  );
}

function LegacySection({ value, title, children }: { value: string; title: string; children: ReactNode }) {
  return (
    <AccordionItem value={value} className="border-b border-border last:border-b-0">
      <AccordionTrigger className={triggerClass}>{title}</AccordionTrigger>
      <AccordionContent className="px-6 pt-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

function sectionHasPath(step: { id: string; fields?: ListingSection["fields"]; extras?: ListingSection["extras"] }, path: string) {
  if (step.id === "choice") return path === "propertySector" || path === "postingType";
  if (step.fields?.some((field) => field.kind === "pgRooms" && (path === "details.roomTypes" || path.startsWith("details.rooms")))) {
    return true;
  }
  if (step.fields?.some((field) => path === field.name || path.startsWith(`${field.name}.`))) return true;
  if (step.extras?.includes("location") && ["address", "locality", "city", "country", "state", "latitude", "longitude"].includes(path)) {
    return true;
  }
  return false;
}

function stepOwns(step: { id: string; fields?: ListingSection["fields"]; extras?: ListingSection["extras"] } | undefined, path: string) {
  if (!step) return false;
  return sectionHasPath(step, path);
}

export default AddProperty;
