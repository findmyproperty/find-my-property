"use client";

import { useMemo, useState } from "react";
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
import { PropertyWizardNav, type WizardStep } from "./add-property-modules/PropertyWizardNav";
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

const CHOICE_STEP: WizardStep = { id: "choice", title: "Listing type", fields: [] };

const LEGACY_WIZARD_STEPS: WizardStep[] = [
  { id: "basic", title: "Basic Information", fields: [], legacy: true },
  { id: "overview", title: "Property Overview", fields: [], legacy: true },
  { id: "location", title: "Locality details", fields: [], legacy: true },
  { id: "description", title: "Description", fields: [], legacy: true },
  { id: "amenities", title: "Amenities", fields: [], legacy: true },
  { id: "images", title: "Gallery", fields: [], legacy: true },
  { id: "video", title: "Video", fields: [], legacy: true },
  { id: "floorplans", title: "Floor plans", fields: [], legacy: true },
];

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

  const steps = useMemo((): WizardStep[] => {
    if (isEdit) {
      return isCategorized ? sections : LEGACY_WIZARD_STEPS;
    }
    return [CHOICE_STEP, ...sections];
  }, [isEdit, isCategorized, sections]);

  const activeStep = steps[step] ?? steps[0] ?? CHOICE_STEP;
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
      const index = steps.findIndex((item) =>
        issues.some((issue) => issue.path === "postingType" || issue.path === "propertySector" || sectionHasPath(item, issue.path)),
      );
      if (index >= 0) setStep(index);
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
    const current = steps[step];
    if (!current?.legacy) {
      const issues = validateListingForm(form.getValues()).filter((issue) => stepOwns(current, issue.path));
      if (issues.length > 0) {
        applyIssues(issues);
        return;
      }
    }
    setStep((currentIndex) => Math.min(currentIndex + 1, steps.length - 1));
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

  const onSubmit = form.handleSubmit((data) => {
    if (step < steps.length - 1) {
      goNext();
      return;
    }
    return save(data);
  });

  const showNext = step < steps.length - 1;
  const nextDisabled = !isEdit && step === 0 && !isCategorized;

  return (
    <div className={`mx-auto w-full max-w-6xl px-4 ${isEdit && isDirty ? "pb-24" : "pb-8"}`}>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/listings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground">{initialData ? "Edit Property" : "Add Property"}</h2>
          <p className="text-sm text-muted-foreground">
            {initialData ? "Update your listing step by step" : "Choose a sector, then complete each section"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={onSubmit} className="space-y-6">
          <div className="overflow-x-auto pb-1 md:hidden">
            <PropertyWizardNav steps={steps} activeIndex={step} onSelect={setStep} variant="pills" className="min-w-max" />
          </div>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-center">
            <aside className="hidden w-52 shrink-0 rounded-xl border border-border bg-muted/20 p-3 md:block">
              <PropertyWizardNav steps={steps} activeIndex={step} onSelect={setStep} />
            </aside>

            <div className="w-full min-w-0 md:max-w-2xl md:flex-1">
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">{activeStep.title}</h3>
                <WizardStepBody
                  step={activeStep}
                  sector={sector}
                  posting={posting}
                  onSector={onSector}
                  onPosting={onPosting}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {step > 0 ? (
                  <Button type="button" variant="outline" size="lg" onClick={() => setStep((current) => current - 1)}>
                    Previous
                  </Button>
                ) : null}
                {showNext ? (
                  <Button type="button" size="lg" className="min-w-[8rem] flex-1 sm:flex-none" onClick={goNext} disabled={nextDisabled}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="lg"
                    className="min-w-[8rem] flex-1 sm:flex-none"
                    disabled={isSubmitting || (!isEdit && !isCategorized) || (isEdit && !isDirty)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving…" : isEdit ? "Update Property" : "Create Property"}
                  </Button>
                )}
                {!isEdit ? (
                  <Button type="button" variant="outline" size="lg" asChild>
                    <Link href="/listings">Cancel</Link>
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {isEdit && isDirty ? (
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur">
              <div className="mx-auto flex max-w-6xl justify-center">
                <Button type="submit" size="lg" className="w-full max-w-md" disabled={isSubmitting}>
                  <Upload className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving…" : "Update Property"}
                </Button>
              </div>
            </div>
          ) : null}
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

function LegacyStepBody({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "basic":
      return <BasicInformation />;
    case "overview":
      return <PropertyOverview />;
    case "location":
      return <LocationSection />;
    case "description":
      return <DescriptionFields />;
    case "amenities":
      return <AmenitiesFields />;
    case "images":
      return <PropertyImagesSection />;
    case "video":
      return <VideoSection />;
    case "floorplans":
      return <FloorPlansSection />;
    default:
      return null;
  }
}

function WizardStepBody({
  step,
  sector,
  posting,
  onSector,
  onPosting,
}: {
  step: WizardStep;
  sector: string;
  posting: string;
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
}) {
  if (step.id === "choice") {
    return <ChoiceFields sector={sector} posting={posting} onSector={onSector} onPosting={onPosting} />;
  }
  if (step.legacy) {
    return <LegacyStepBody stepId={step.id} />;
  }
  return <SectionBody section={step} />;
}

function sectionHasPath(step: WizardStep, path: string) {
  if (step.id === "choice") return path === "propertySector" || path === "postingType";
  if (step.legacy) {
    if (step.id === "images" && (path === "propertyImages" || path === "thumbnailUrl")) return true;
    if (step.id === "video" && path === "videoUrl") return true;
    if (step.id === "floorplans" && (path === "floorPlans" || path.startsWith("floorPlans."))) return true;
    if (step.id === "location" && ["address", "locality", "city", "country", "state", "latitude", "longitude"].includes(path)) {
      return true;
    }
    return false;
  }
  if (step.fields?.some((field) => field.kind === "pgRooms" && (path === "details.roomTypes" || path.startsWith("details.rooms")))) {
    return true;
  }
  if (step.fields?.some((field) => path === field.name || path.startsWith(`${field.name}.`))) return true;
  if (step.extras?.includes("location") && ["address", "locality", "city", "country", "state", "latitude", "longitude"].includes(path)) {
    return true;
  }
  if (step.extras?.includes("images") && (path === "propertyImages" || path === "thumbnailUrl")) return true;
  if (step.extras?.includes("video") && path === "videoUrl") return true;
  if (step.extras?.includes("floorplans") && (path === "floorPlans" || path.startsWith("floorPlans."))) return true;
  return false;
}

function stepOwns(step: WizardStep | undefined, path: string) {
  if (!step) return false;
  return sectionHasPath(step, path);
}

export default AddProperty;
