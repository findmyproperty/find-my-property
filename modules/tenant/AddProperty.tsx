"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { motion } from "framer-motion";
import { useForm, useWatch, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Upload, X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
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
  LISTING_CITIES,
  POSTING_LABELS,
  SECTOR_LABELS,
  PROPERTY_SECTORS,
  buildPropertyDraftPayload,
  buildPropertyPayload,
  canSavePropertyDraft,
  isAllowedPair,
  isListingCity,
  postingOptionsFor,
  validateListingForm,
  type ListingCity,
  type PostingType,
  type PropertySector,
} from "@/lib/property-posting";

const CHOICE_STEP: WizardStep = { id: "choice", title: "Listing type", fields: [] };

/** Set when user discards a new listing so remount / browser-back starts empty. */
const ADD_PROPERTY_DISCARD_KEY = "fmp-add-property-discard";

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
  const [draftPropertyId, setDraftPropertyId] = useState<string | null>(
    initialData?.status === "Draft" && initialData.id != null ? String(initialData.id) : null,
  );
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const allowLeaveRef = useRef(false);
  const pendingLeaveHref = useRef("/listings");

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: getDefaultValues(initialData),
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  const sector = useWatch({ control: form.control, name: "propertySector" }) || "";
  const posting = useWatch({ control: form.control, name: "postingType" }) || "";
  const city = useWatch({ control: form.control, name: "city" }) || "";
  const isCategorized = isAllowedPair(sector, posting);
  const hasListingCity = isListingCity(city);
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
    if (initialData.status === "Draft") {
      setDraftPropertyId(String(initialData.id));
    }
  }, [isEdit, initialData?.id, initialData?.status]);

  /** After Discard on create, clear any restored form (soft nav / bfcache). */
  useEffect(() => {
    if (isEdit) return;
    const clearIfDiscarded = () => {
      try {
        if (sessionStorage.getItem(ADD_PROPERTY_DISCARD_KEY) !== "1") return;
        sessionStorage.removeItem(ADD_PROPERTY_DISCARD_KEY);
      } catch {
        return;
      }
      form.reset(getDefaultValues());
      setDraftPropertyId(null);
      setStep(0);
      setErrorStepIndices([]);
      initialSnapshotRef.current = null;
    };
    clearIfDiscarded();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clearIfDiscarded();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [isEdit, form]);

  const hasChanges =
    isEdit &&
    initialSnapshotRef.current != null &&
    JSON.stringify(formValues) !== initialSnapshotRef.current;

  const canUpdate = isEdit && (isDirty || hasChanges);
  const isDraftListing = initialData?.status === "Draft" || Boolean(draftPropertyId);
  const allowsDraftSave = !isEdit || isDraftListing;
  const hasUnsavedWork = isDirty || hasChanges;
  const rejectReason =
    initialData?.status === "Rejected" && initialData.reason?.trim()
      ? initialData.reason.trim()
      : null;

  useEffect(() => {
    setStep((current) => Math.min(current, Math.max(0, steps.length - 1)));
  }, [steps.length]);

  useEffect(() => {
    setErrorStepIndices([]);
  }, [sector, posting, city]);

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

  const requestLeave = useCallback(
    (href = "/listings") => {
      if (!hasUnsavedWork || allowLeaveRef.current) {
        allowLeaveRef.current = false;
        router.push(href);
        return;
      }
      pendingLeaveHref.current = href;
      setLeaveOpen(true);
    },
    [hasUnsavedWork, router],
  );

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedWork || allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedWork]);

  const persistDraft = async (navigateAfter: boolean) => {
    const values = form.getValues();
    if (!canSavePropertyDraft(values)) {
      toast({
        variant: "destructive",
        title: "Add a city or title first",
        description: "Choose a city or enter a title before saving a draft.",
      });
      return false;
    }

    setDraftSaving(true);
    try {
      const payload = buildPropertyDraftPayload(values);
      let savedId = draftPropertyId;
      if (savedId) {
        await api.updatePropertyDraft(savedId, payload);
        const fresh = await api.getRawProperty(savedId);
        const nextDefaults = getDefaultValues(fresh);
        form.reset(nextDefaults);
        initialSnapshotRef.current = JSON.stringify(nextDefaults);
      } else {
        const created = await api.createPropertyDraft(payload);
        savedId = created.id;
        setDraftPropertyId(savedId);
        const fresh = await api.getRawProperty(savedId);
        const nextDefaults = getDefaultValues(fresh);
        form.reset(nextDefaults);
        initialSnapshotRef.current = JSON.stringify(nextDefaults);
        router.replace(`/edit-property/${savedId}`);
      }
      await revalidatePropertyListingCache(savedId);
      await invalidatePropertyQueries(queryClient, savedId);
      toast({
        variant: "success",
        title: "Draft saved",
        description: "You can finish it anytime from My Listings.",
      });
      if (navigateAfter) {
        allowLeaveRef.current = true;
        setLeaveOpen(false);
        router.push(pendingLeaveHref.current || "/listings");
      }
      return true;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save draft",
        description: error instanceof Error ? error.message : "Try again in a moment.",
      });
      return false;
    } finally {
      setDraftSaving(false);
    }
  };

  const discardAndLeave = () => {
    allowLeaveRef.current = true;
    setLeaveOpen(false);
    if (!isEdit) {
      form.reset(getDefaultValues());
      setDraftPropertyId(null);
      setStep(0);
      setErrorStepIndices([]);
      initialSnapshotRef.current = null;
      try {
        sessionStorage.setItem(ADD_PROPERTY_DISCARD_KEY, "1");
      } catch {
        /* ignore */
      }
    } else {
      const defaults = getDefaultValues(initialData);
      form.reset(defaults);
      initialSnapshotRef.current = JSON.stringify(defaults);
    }
    router.push(pendingLeaveHref.current || "/listings");
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
      const existingId = draftPropertyId || (initialData?.id != null ? String(initialData.id) : null);
      if (existingId) {
        await api.updateProperty(existingId, payload);
        const fresh = await api.getRawProperty(existingId);
        const nextDefaults = getDefaultValues(fresh);
        form.reset(nextDefaults);
        initialSnapshotRef.current = JSON.stringify(nextDefaults);
        propertyIdForCache = existingId;
        setDraftPropertyId(null);
        toast({
          variant: "success",
          title: isDraftListing ? "Listing submitted" : "Property updated",
          description: isDraftListing
            ? "Your draft was submitted for review."
            : "Your listing has been saved successfully.",
        });
      } else {
        const created = await api.createProperty(payload);
        propertyIdForCache = created.id;
        toast({ variant: "success", title: "Property submitted", description: "Your listing has been created successfully." });
      }
      await revalidatePropertyListingCache(propertyIdForCache);
      await invalidatePropertyQueries(queryClient, propertyIdForCache);
      allowLeaveRef.current = true;
      router.refresh();
      if (!initialData?.id || isDraftListing) router.push("/listings");
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

  const onCity = (next: ListingCity) => {
    if (next === form.getValues("city")) return;
    form.setValue("city", next, { shouldDirty: true, shouldValidate: true });
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
  const nextDisabled = !isEdit && !draftPropertyId && step === 0 && (!hasListingCity || !isCategorized);
  const progressPct = steps.length > 0 ? Math.round(((step + 1) / steps.length) * 100) : 0;
  const submitLabel = isDraftListing
    ? "Submit for review"
    : isEdit
      ? "Update Property"
      : "Create Property";
  const submitDisabled =
    isSubmitting ||
    draftSaving ||
    (!isEdit && !draftPropertyId && (!hasListingCity || !isCategorized)) ||
    (isEdit && !isDraftListing && !canUpdate);

  return (
    <div
      className={`mx-auto w-full max-w-6xl overflow-x-hidden ${showStickySave ? "pb-28 sm:pb-24" : "pb-8"}`}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0"
            aria-label="Back to listings"
            onClick={() => requestLeave("/listings")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {isDraftListing ? "Continue draft" : initialData ? "Edit Property" : "Add Property"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isDraftListing
                ? "Finish your draft, or save it again and come back later"
                : initialData
                  ? "Update your listing step by step"
                  : "Choose city and sector, then complete each section"}
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
                    city={city}
                    isEdit={isEdit}
                    onSector={onSector}
                    onPosting={onPosting}
                    onCity={onCity}
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
                    disabled={submitDisabled}
                    onClick={() => void handleSave()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Saving…" : submitLabel}
                  </Button>
                )}
                {allowsDraftSave ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={isSubmitting || draftSaving}
                    onClick={() => void persistDraft(false)}
                  >
                    {draftSaving ? "Saving draft…" : "Save draft"}
                  </Button>
                ) : null}
                <Button type="button" variant="outline" size="lg" onClick={() => requestLeave("/listings")}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>

          {showStickySave ? (
            <div
              className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            >
              <div className="mx-auto flex max-w-6xl justify-center gap-3">
                {allowsDraftSave ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    className="w-full max-w-[10rem]"
                    disabled={isSubmitting || draftSaving}
                    onClick={() => void persistDraft(false)}
                  >
                    {draftSaving ? "Saving…" : "Save draft"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  size="lg"
                  className="w-full max-w-md"
                  disabled={submitDisabled}
                  onClick={() => void handleSave()}
                >
                  <Upload className="mr-2 h-4 w-4" /> {isSubmitting ? "Saving…" : submitLabel}
                </Button>
              </div>
            </div>
          ) : null}
        </motion.form>
      </Form>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save your listing as a draft?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Save a draft to finish later, or discard and leave.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel disabled={draftSaving}>Keep editing</AlertDialogCancel>
            <Button type="button" variant="outline" disabled={draftSaving} onClick={discardAndLeave}>
              Discard
            </Button>
            {allowsDraftSave ? (
              <Button
                type="button"
                disabled={draftSaving}
                onClick={() => void persistDraft(true)}
              >
                {draftSaving ? "Saving…" : "Save draft"}
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  city,
  sector,
  posting,
  onCity,
  onSector,
  onPosting,
}: {
  city: string;
  sector: string;
  posting: string;
  onCity: (value: ListingCity) => void;
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
}) {
  const options = postingOptionsFor(sector);
  const citySelected = isListingCity(city);
  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-foreground">City</legend>
        <p className="text-sm text-muted-foreground">Select the city where this property is located.</p>
        <Combobox
          className="max-w-sm"
          options={LISTING_CITIES.map((item) => ({ value: item, label: item }))}
          value={citySelected ? city : null}
          onValueChange={(value) => {
            if (isListingCity(value)) onCity(value);
          }}
          placeholder="Select city"
          disableSearch
          id="listing-city"
        />
      </fieldset>
      <fieldset className={`space-y-3 ${citySelected ? "" : "pointer-events-none opacity-50"}`}>
        <legend className="text-sm font-semibold text-foreground">Property sector</legend>
        <p className="text-sm text-muted-foreground">Select the category that best describes your listing.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {PROPERTY_SECTORS.map((item) => (
            <button
              key={item}
              type="button"
              disabled={!citySelected}
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
        <fieldset className={`space-y-3 ${citySelected ? "" : "pointer-events-none opacity-50"}`}>
          <legend className="text-sm font-semibold text-foreground">Listing type</legend>
          <p className="text-sm text-muted-foreground">
            Steps and fields depend on this choice—pick the option that matches how you want to list.
          </p>
          <div className="flex flex-wrap gap-2.5">
            {options.map((item) => (
              <button
                key={item}
                type="button"
                disabled={!citySelected}
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

function SectionBody({ section, lockCity }: { section: ListingSection; lockCity: boolean }) {
  return (
    <div className="space-y-5">
      <ListingFields fields={section.fields} />
      {section.extras?.includes("location") ? <LocationSection lockCity={lockCity} /> : null}
      {section.extras?.includes("images") ? <PropertyImagesSection /> : null}
      {section.extras?.includes("video") ? <VideoSection /> : null}
      {section.extras?.includes("floorplans") ? <FloorPlansSection /> : null}
    </div>
  );
}

function LegacyStepBody({ stepId, lockCity }: { stepId: string; lockCity: boolean }) {
  switch (stepId) {
    case "basic":
      return <BasicInformation />;
    case "overview":
      return <PropertyOverview />;
    case "location":
      return <LocationSection lockCity={lockCity} />;
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
  city,
  isEdit,
  onSector,
  onPosting,
  onCity,
}: {
  step: WizardStep;
  sector: string;
  posting: string;
  city: string;
  isEdit: boolean;
  onSector: (value: PropertySector) => void;
  onPosting: (value: PostingType) => void;
  onCity: (value: ListingCity) => void;
}) {
  const lockCity = !isEdit;
  if (step.id === "choice") {
    return (
      <ChoiceFields
        city={city}
        sector={sector}
        posting={posting}
        onCity={onCity}
        onSector={onSector}
        onPosting={onPosting}
      />
    );
  }
  if (step.legacy) {
    return <LegacyStepBody stepId={step.id} lockCity={lockCity} />;
  }
  return <SectionBody section={step} lockCity={lockCity} />;
}

function sectionHasPath(step: WizardStep, path: string) {
  if (step.id === "choice") return path === "city" || path === "propertySector" || path === "postingType";
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
