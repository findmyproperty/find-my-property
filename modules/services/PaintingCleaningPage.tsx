"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  MapPin,
  PaintBucket,
  PhoneCall,
  Sparkles,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useServiceAuthModal } from "@/contexts/service-auth-modal-context";
import { useSubmitPaintingCleaning } from "@/hooks/use-service-requests";
import {
  PROPERTY_TYPE_OPTIONS,
  SLOT_OPTIONS,
  SUB_TYPE_OPTIONS,
  paintingCleaningSchema,
  type PaintingCleaningFormValues,
  type StopValue,
} from "./schemas";
import { ServiceHero } from "./ServiceHero";
import { HowItWorks, type HowItWorksStep } from "./HowItWorks";
import LocationSearchField from "./LocationSearchField";
import { useRouter } from "next/navigation";

const EMPTY_LOCATION: StopValue = { label: "", lat: 0, lng: 0, notes: "" };

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Pick a service",
    description:
      "Painting or deep cleaning — choose the service that fits your home.",
  },
  {
    icon: PhoneCall,
    title: "We call you back",
    description:
      "A supervisor confirms scope, visits if needed, and shares a transparent quote.",
  },
  {
    icon: CalendarCheck,
    title: "Schedule the visit",
    description:
      "Pick a slot. A trained crew arrives with eco-safe materials and tools.",
  },
  {
    icon: Sparkles,
    title: "Crisp & spotless",
    description:
      "Walk through with our supervisor. 100% satisfaction guarantee on every job.",
  },
];

export default function PaintingCleaningPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitPaintingCleaning();
  const router = useRouter();

  const form = useForm<PaintingCleaningFormValues>({
    resolver: zodResolver(paintingCleaningSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      addressLine: "",
      pincode: "",
      preferredDate: "",
      preferredSlot: undefined,
      subType: "deep_cleaning",
      propertyType: "apartment",
      bhkOrSqft: "",
      location: { ...EMPTY_LOCATION },
      notes: "",
    },
  });

  useEffect(() => {
    if (!isAuthReady || !user) return;
    const current = form.getValues();
    form.reset({
      ...current,
      name: current.name || user.name || "",
      phone: current.phone || user.phone || "",
      email: current.email || user.email || "",
      city: current.city || user.locationCity || "",
    });
  }, [isAuthReady, user, form]);

  const onSubmit = async (values: PaintingCleaningFormValues) => {
    await mutation.mutateAsync({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      city: values.city?.trim() || undefined,
      addressLine: values.addressLine?.trim() || undefined,
      pincode: values.pincode?.trim() || undefined,
      preferredDate: values.preferredDate?.trim() || undefined,
      preferredSlot: values.preferredSlot,
      details: {
        subType: values.subType,
        propertyType: values.propertyType,
        bhkOrSqft: values.bhkOrSqft.trim(),
        location: {
          label: values.location.label.trim(),
          lat: values.location.lat,
          lng: values.location.lng,
          placeId: values.location.placeId,
          notes: values.location.notes?.trim() || undefined,
        },
        notes: values.notes?.trim() || undefined,
      },
    });
    form.reset({
      ...form.getValues(),
      bhkOrSqft: "",
      location: { ...EMPTY_LOCATION },
      notes: "",
    });
  };

  const isSubmitted = mutation.isSuccess && !form.formState.isDirty;

  const handleRequestCallback = () => {
    requireAuth(() => {
      void form.handleSubmit(onSubmit)();
    });
  };

  return (
    <main className="pb-20">
      <ServiceHero
        eyebrow="Painting & Cleaning"
        title="A fresh coat. A spotless home. A quick fix."
        subtitle="Professional painters and deep cleaners — vetted, insured, and ready to refresh your space."
        Illustration={PaintBucket}
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How we keep your home in top shape"
        subheading="Simple, supervised painting and cleaning — every step handled by our team."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Book painting or cleaning
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Share a few details and we&apos;ll call you back with a transparent quote.
            </p>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center"
            >
              <Sparkles className="mx-auto h-10 w-10 text-primary" aria-hidden />
              <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground">
                Request received
              </h3>
              <p className="mt-2 text-muted-foreground">
                Thanks {form.getValues("name") || "there"} — our supervisor will reach out shortly.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {user ? (
                  <Button asChild>
                    <Link href="/my-requests">
                      Track this request
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" onClick={openAuthModal}>
                    Log in to track this request
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    mutation.reset();
                    form.reset();
                  }}
                >
                  Submit another
                </Button>
              </div>
            </motion.div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRequestCallback();
                }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Your name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Rahul Nair"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Phone</FormLabel>
                        <FormControl>
                          <Input
                            autoComplete="tel"
                            inputMode="tel"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="rahul@example.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Mumbai" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    Service details
                  </h3>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="subType"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel required>Service</FormLabel>
                          <FormControl>
                            <Combobox
                              options={SUB_TYPE_OPTIONS.map((option) => ({
                                value: option.value,
                                label: option.label,
                                description: option.group,
                              }))}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Pick a service"
                              searchPlaceholder="Search service..."
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="propertyType"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel required>Property type</FormLabel>
                          <FormControl>
                            <Combobox
                              options={PROPERTY_TYPE_OPTIONS}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select property type"
                              disableSearch
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-5">
                    <FormField
                      control={form.control}
                      name="bhkOrSqft"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Size</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="2 BHK or 950 sqft"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">
                        Service location
                      </h4>
                    </div>
                    <Controller
                      control={form.control}
                      name="location"
                      render={({ field, fieldState }) => (
                        <>
                          <LocationSearchField
                            value={
                              field.value?.label
                                ? {
                                    label: field.value.label,
                                    lat: field.value.lat,
                                    lng: field.value.lng,
                                    placeId: field.value.placeId,
                                  }
                                : null
                            }
                            onChange={(loc) => {
                              if (!loc) {
                                field.onChange({ ...EMPTY_LOCATION });
                                return;
                              }
                              field.onChange({
                                label: loc.label,
                                lat: loc.lat,
                                lng: loc.lng,
                                placeId: loc.placeId,
                                notes: field.value?.notes ?? "",
                              });
                            }}
                            placeholder="Search for the service address…"
                            showMapPreview
                            mapPreviewHeight={160}
                            error={
                              fieldState.error?.message ??
                              (fieldState.error as { label?: { message?: string } } | undefined)
                                ?.label?.message
                            }
                          />
                          <Textarea
                            rows={2}
                            maxLength={500}
                            placeholder="Flat / floor / landmark (optional)"
                            className="mt-2"
                            value={field.value?.notes ?? ""}
                            onChange={(e) =>
                              field.onChange({
                                ...field.value,
                                notes: e.target.value,
                              })
                            }
                          />
                        </>
                      )}
                    />
                  </div>

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="400053"
                              inputMode="numeric"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Preferred date</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              minDate={new Date()}
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredSlot"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Preferred slot</FormLabel>
                          <FormControl>
                            <Combobox
                              options={SLOT_OPTIONS}
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              placeholder="Anytime"
                              disableSearch
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="mt-5">
                        <FormLabel>Anything we should know?</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Specific rooms, colour preferences, repair issue, stains to focus on, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 sm:flex-row sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    By submitting, you agree to be contacted about your service request.
                  </p>
                  <Button
                    type="button"
                    size="lg"
                    disabled={mutation.isPending || !isAuthReady}
                    onClick={handleRequestCallback}
                  >
                    {mutation.isPending ? "Submitting..." : "Request a callback"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </section>
    </main>
  );
}
