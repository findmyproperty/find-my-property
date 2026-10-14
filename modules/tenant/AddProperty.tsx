"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { motion } from "framer-motion";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  /** Step indices with validation errors (quick nav shows X); cleared on success or sector/listing change */
  const [errorStepIndices, setErrorStepIndices] = useState<number[]>([]);

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
  const formValues = useWatch({ control: form.control });
  const initialSnapshotRef = useRef<string | null>(null);
  const [rejectAlertDismissed, setRejectAlertDismissed] = useState(false);

  useEffect(() => {
    if (!isEdit || !initialData?.id) return;
    const defaults = getDefaultValues(initialData);
    initialSnapshotRef.current = JSON.stringify(defaults);
    setRejectAlertDismissed(false);
  }, [isEdit, initialData?.id]);

  const hasChanges =
    isEdit &&
    initialSnapshotRef.current != null &&
    JSON.stringify(formValues) !== initialSnapshotRef.current;

  const canUpdate = isEdit && (isDirty || hasChanges);
  const rejectReason =
    initialData?.status === "Rejected" && initialData.reason?.trim()
      ? initialData.reason.trim()
      : null;

  useEffect(() => {
    setStep((current) => Math.min(current, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    setErrorStepIndices([]);
  }, [sector, posting]);

  /** Drop X markers for steps that no longer fail validation (e.g. after fixing fields and using quick navigate). */
  useEffect(() => {
    setErrorStepIndices((prev) => pruneErrorStepIndices(steps, prev, form.getValues()));
  }, [step, steps, form]);

  const isLastStep = steps.length > 0 && step === steps.length - 1;
  const showStickySave = isEdit && canUpdate;

  const applyIssues = (issues: { path: string; message: string }[]) => {
    form.clearErrors();
    for (const issue of issues) {
      form.setError(issue.path as never, { message: issue.message });
    }
  };

  const focusFirstStepWithIssue = (issues: { path: string }[]) => {
    const index = steps.findIndex((item) =>
      issues.some(
        (issue) => issue.path === "postingType" || issue.path === "propertySector" || sectionHasPath(item, issue.path),
      ),
    );
    if (index >= 0) setStep(index);
  };

  const save = async (data: PropertyFormValues) => {
    const issues = validateListingForm(data);
    if (issues.length > 0) {
      applyIssues(issues);
      focusFirstStepWithIssue(issues);
      toast({
        variant: "destructive",
        title: "Check required fields",
        description: issues[0]?.message ?? "Fill in the fields marked with *.",
      });
      return;
    }

    setErrorStepIndices([]);

    try {
      const payload = buildPropertyPayload(data);
      let propertyIdForCache: string | undefined;
      if (initialData?.id) {
        await api.updateProperty(String(initialData.id), payload);
        const fresh = await api.getRawProperty(String(initialData.id));
        const nextDefaults = getDefaultValues(fresh);
        form.reset(nextDefaults);
        initialSnapshotRef.current = JSON.stringify(nextDefaults);
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
        for (const issue of issues) {
          form.setError(issue.path as never, { message: issue.message });
        }
        setErrorStepIndices((prev) => {
          const next = new Set(prev);
          next.add(step);
          return pruneErrorStepIndices(steps, [...next], form.getValues());
        });
        return;
      }
    }
    setErrorStepIndices((prev) => pruneErrorStepIndices(steps, prev.filter((index) => index !== step), form.getValues()));
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

  const handleSave = form.handleSubmit(
    (data) => save(data),
    (fieldErrors) => {
      const paths = flattenFormErrorPaths(fieldErrors);
      const issues = paths.map((path) => ({ path, message: "Invalid value" }));
      focusFirstStepWithIssue(issues);
      toast({
        variant: "destructive",
        title: "Check required fields",
        description: issues[0]?.message ?? "Fill in the fields marked with *.",
      });
    },
  );

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target;
    if (target instanceof HTMLTextAreaElement) return;
    if (target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const showNext = step < steps.length - 1;
  const nextDisabled = !isEdit && step === 0 && !isCategorized;
  const progressPct = steps.length > 0 ? Math.round(((step + 1) / steps.length) * 100) : 0;

  return (
    <div
      className={`mx-auto w-full max-w-6xl overflow-x-hidden ${showStickySave ? "pb-28 sm:pb-24" : "pb-8"}`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" asChild>
            <Link href="/listings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {initialData ? "Edit Property" : "Add Property"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {initialData ? "Update your listing step by step" : "Choose a sector, then complete each section"}
            </p>
          </div>
        </div>
        {steps.length > 1 ? (
          <div className="w-full min-w-0 sm:max-w-xs lg:max-w-sm">
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>
                Step {step + 1} of {steps.length}
              </span>
              <span className="truncate font-medium text-foreground">{activeStep.title}</span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={progressPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progress: step ${step + 1} of ${steps.length}`}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        ) : null}
      </div>

      {rejectReason && !rejectAlertDismissed ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between gap-2">
            Listing not approved
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
              aria-label="Dismiss"
              onClick={() => setRejectAlertDismissed(true)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertTitle>
          <AlertDescription>{rejectReason}</AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={preventEnterSubmit}
          className="space-y-6"
        >
          <div className="overflow-x-auto pb-2 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <PropertyWizardNav
              steps={steps}
              activeIndex={step}
              errorStepIndices={errorStepIndices}
              onSelect={setStep}
              variant="pills"
              className="min-w-max px-0.5"
            />
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-6">
            <aside className="hidden shrink-0 rounded-xl border border-border bg-card/50 p-3 md:block md:w-56 lg:w-60">
              <PropertyWizardNav steps={steps} activeIndex={step} errorStepIndices={errorStepIndices} onSelect={setStep} />
            </aside>

            <div className="min-w-0 flex-1">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7 lg:p-8">
                <div className="mb-6 border-b border-border/60 pb-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {steps.length > 1 ? `Step ${step + 1} of ${steps.length}` : "Getting started"}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-semibold text-foreground sm:text-xl">{activeStep.title}</h3>
                </div>
                <div className="space-y-5">
                  <WizardStepBody
                    step={activeStep}
                    sector={sector}
                    posting={posting}
                    onSector={onSector}
                    onPosting={onPosting}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/60 pt-6">
                {step > 0 ? (
                  <Button type="button" variant="outline" size="lg" onClick={() => setStep((current) => current - 1)}>
                    Previous
                  </Button>
                ) : null}
                {showNext ? (
                  <Button
                    type="button"
                    size="lg"
                    className="min-w-32 flex-1 rounded-lg sm:flex-none"
                    onClick={goNext}
                    disabled={nextDisabled}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="lg"
                    className="min-w-32 flex-1 rounded-lg sm:flex-none"
                    disabled={isSubmitting || (!isEdit && !isCategorized) || (isEdit && !canUpdate)}
                    onClick={() => void handleSave()}
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

          {showStickySave ? (
            <div
              className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto flex max-w-6xl justify-center">
                <Button
                  type="button"
                  size="lg"
                  className="w-full max-w-md"
                  disabled={isSubmitting}
                  onClick={() => void handleSave()}
                >
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

const choiceTileClass = (selected: boolean) =>
  [
    "rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    selected
      ? "border-primary bg-primary/10 text-foreground shadow-sm"
      : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground",
  ].join(" ");

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
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">Property sector</legend>
        <p className="text-sm text-muted-foreground">Select the category that best describes your listing.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PROPERTY_SECTORS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={sector === item}
              onClick={() => onSector(item)}
              className={choiceTileClass(sector === item)}
            >
              {SECTOR_LABELS[item]}
            </button>
          ))}
        </div>
      </fieldset>
      {options.length > 0 ? (
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-foreground">Listing type</legend>
          <p className="text-sm text-muted-foreground">
            Steps and fields depend on this choice—pick the option that matches how you want to list.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {options.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={posting === item}
                onClick={() => onPosting(item)}
                className={[
                  "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  posting === item
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-muted/20 text-muted-foreground hover:border-primary/30 hover:bg-muted/40 hover:text-foreground",
                ].join(" ")}
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
    <div className="space-y-5">
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

function stepIndicesWithValidationIssues(steps: WizardStep[], issues: { path: string }[]) {
  const indices = new Set<number>();
  for (const issue of issues) {
    const idx = steps.findIndex((item) =>
      issue.path === "postingType" || issue.path === "propertySector" || sectionHasPath(item, issue.path),
    );
    if (idx >= 0) indices.add(idx);
  }
  return [...indices];
}

/** Keep only step indices that still have listing validation errors (quick-nav X icons). */
function pruneErrorStepIndices(steps: WizardStep[], indices: number[], values: PropertyFormValues) {
  if (indices.length === 0) return indices;
  const allIssues = validateListingForm(values);
  return indices.filter((index) => {
    const stepDef = steps[index];
    if (!stepDef || stepDef.legacy) return false;
    return allIssues.some((issue) => stepOwns(stepDef, issue.path));
  });
}

function flattenFormErrorPaths(errors: FieldErrors<PropertyFormValues>, prefix = ""): string[] {
  const paths: string[] = [];
  for (const [key, value] of Object.entries(errors)) {
    if (!value) continue;
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && "message" in value && value.message) {
      paths.push(path);
      continue;
    }
    if (typeof value === "object") {
      paths.push(...flattenFormErrorPaths(value as FieldErrors<PropertyFormValues>, path));
    }
  }
  return paths;
}

export default AddProperty;
