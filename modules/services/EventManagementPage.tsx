"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BriefcaseBusiness,
  CalendarCheck,
  ClipboardList,
  Gem,
  Gift,
  MapPin,
  PartyPopper,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { useServiceAuthModal } from "@/contexts/service-auth-modal-context";
import { useSubmitEventManagement } from "@/hooks/use-service-requests";
import { HowItWorks, type HowItWorksStep } from "./HowItWorks";
import LocationSearchField from "./LocationSearchField";
import { ServiceHero } from "./ServiceHero";
import {
  BUDGET_RANGE_OPTIONS,
  EVENT_SERVICE_OPTIONS,
  EVENT_TYPE_OPTIONS,
  SLOT_OPTIONS,
  VENUE_TYPE_OPTIONS,
  eventManagementSchema,
  type EventManagementFormValues,
  type StopValue,
} from "./schemas";

const EMPTY_LOCATION: StopValue = { label: "", lat: 0, lng: 0, notes: "" };

const EVENT_ICONS: Record<
  EventManagementFormValues["eventType"],
  typeof PartyPopper
> = {
  birthday: PartyPopper,
  wedding: Gem,
  baby_shower: Baby,
  corporate: BriefcaseBusiness,
};

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Share the brief",
    description:
      "Tell us event type, venue, guest count, services and your ideal date.",
  },
  {
    icon: PhoneCall,
    title: "Planner callback",
    description:
      "A coordinator confirms scope, budget, theme and vendor availability.",
  },
  {
    icon: CalendarCheck,
    title: "Plan the day",
    description:
      "We align decor, catering, photos, music and timelines before the event.",
  },
  {
    icon: Sparkles,
    title: "Host with ease",
    description:
      "The crew manages setup and coordination so you can focus on guests.",
  },
];

export default function EventManagementPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitEventManagement();
  const router = useRouter();

  const form = useForm<EventManagementFormValues>({
    resolver: zodResolver(eventManagementSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      addressLine: "",
      pincode: "",
      preferredDate: "",
      preferredSlot: undefined,
      eventType: "birthday",
      venueType: "home",
      guestCount: 50,
      budgetRange: "",
      services: ["decoration"],
      location: { ...EMPTY_LOCATION },
      themeOrStyle: "",
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

  const onSubmit = async (values: EventManagementFormValues) => {
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
        eventType: values.eventType,
        venueType: values.venueType,
        guestCount: values.guestCount,
        budgetRange: values.budgetRange?.trim() || undefined,
        services: values.services,
        location: {
          label: values.location.label.trim(),
          lat: values.location.lat,
          lng: values.location.lng,
          placeId: values.location.placeId,
          notes: values.location.notes?.trim() || undefined,
        },
        themeOrStyle: values.themeOrStyle?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      },
    });
    form.reset({
      ...form.getValues(),
      eventType: "birthday",
      venueType: "home",
      guestCount: 50,
      budgetRange: "",
      services: ["decoration"],
      location: { ...EMPTY_LOCATION },
      themeOrStyle: "",
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
        eyebrow="Event Management"
        title="Plan a celebration that feels effortless."
        subtitle="Birthday, wedding, baby shower or corporate event - share the brief and our planners coordinate decor, home or corporate catering, photos, music and guests."
        Illustration={PartyPopper}
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How your event comes together"
        subheading="A simple planning flow for busy hosts: clear scope, verified vendors, and one coordinator."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Request event planning
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Tell us the occasion, guest count and what you want handled. We will call back with a practical plan and quote.
            </p>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center"
            >
              <Gift className="mx-auto h-10 w-10 text-primary" aria-hidden />
              <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground">
                Event request received
              </h3>
              <p className="mt-2 text-muted-foreground">
                Thanks {form.getValues("name") || "there"} - our event planner will reach out shortly.
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
                            placeholder="Ananya Rao"
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
                            placeholder="ananya@example.com"
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
                          <Input placeholder="Bangalore" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    Event brief
                  </h3>

                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem className="mt-5">
                        <FormLabel required>Event type</FormLabel>
                        <FormControl>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {EVENT_TYPE_OPTIONS.map((option) => {
                              const Icon = EVENT_ICONS[option.value];
                              const selected = field.value === option.value;
                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => field.onChange(option.value)}
                                  className={`rounded-xl border p-4 text-left transition hover:border-primary/60 hover:bg-primary/5 ${
                                    selected
                                      ? "border-primary bg-primary/10"
                                      : "border-border bg-card"
                                  }`}
                                  aria-pressed={selected}
                                >
                                  <Icon
                                    className="h-5 w-5 text-primary"
                                    aria-hidden
                                  />
                                  <span className="mt-3 block text-sm font-semibold text-foreground">
                                    {option.label}
                                  </span>
                                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                                    {option.description}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="guestCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Guests</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
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
                      name="venueType"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel required>Venue type</FormLabel>
                          <FormControl>
                            <Combobox
                              options={VENUE_TYPE_OPTIONS}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Pick venue type"
                              disableSearch={VENUE_TYPE_OPTIONS.length <= 6}
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budgetRange"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Budget range</FormLabel>
                          <FormControl>
                            <Combobox
                              options={BUDGET_RANGE_OPTIONS}
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              placeholder="Not decided"
                              disableSearch
                              aria-invalid={!!fieldState.error}
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
                        Event location
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
                            placeholder="Search venue, home, office or area..."
                            showMapPreview
                            mapPreviewHeight={160}
                            error={
                              fieldState.error?.message ??
                              (fieldState.error as
                                | { label?: { message?: string } }
                                | undefined)?.label?.message
                            }
                          />
                          <Textarea
                            rows={2}
                            maxLength={500}
                            placeholder="Venue notes (optional): floor, entry gate, parking, setup timing"
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

                  <FormField
                    control={form.control}
                    name="services"
                    render={() => (
                      <FormItem className="mt-5">
                        <FormLabel required>Services needed</FormLabel>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {EVENT_SERVICE_OPTIONS.map((item) => (
                            <FormField
                              key={item.value}
                              control={form.control}
                              name="services"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-3 space-y-0 rounded-xl border border-border bg-muted/20 p-3">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item.value)}
                                      onCheckedChange={(checked) => {
                                        const next = checked
                                          ? [...(field.value ?? []), item.value]
                                          : field.value?.filter(
                                              (value) => value !== item.value,
                                            );
                                        field.onChange(next);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="!mt-0 text-sm font-medium">
                                    {item.label}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Event date</FormLabel>
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
                    <FormField
                      control={form.control}
                      name="pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="560001"
                              inputMode="numeric"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="themeOrStyle"
                    render={({ field }) => (
                      <FormItem className="mt-5">
                        <FormLabel>Theme or style</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Pastel garden, royal wedding, minimal corporate, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="mt-5">
                        <FormLabel>Anything we should know?</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Food preferences, decor ideas, VIP guests, stage needs, timing constraints, etc."
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
                    By submitting, you agree to be contacted by our event planning team.
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
