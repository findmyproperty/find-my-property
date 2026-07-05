"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  ClipboardList,
  Flag,
  PackageCheck,
  PhoneCall,
  Truck,
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
import { Combobox } from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import { useServiceAuthModal } from "@/contexts/service-auth-modal-context";
import { useCategories } from "@/hooks/use-categories";
import { useSubmitPackersMovers } from "@/hooks/use-service-requests";
import { resolveVendorCategoryId } from "./category-mapping";
import {
  BHK_OPTIONS,
  MAX_DROPS,
  MOVE_TYPE_OPTIONS,
  SLOT_OPTIONS,
  packersMoversSchema,
  type PackersMoversFormValues,
  type StopValue,
} from "./schemas";
import { ServiceHero } from "./ServiceHero";
import { HowItWorks, type HowItWorksStep } from "./HowItWorks";
import LocationSearchField from "./LocationSearchField";
import StopList from "./StopList";
import TripEstimate from "./TripEstimate";
import { useRouter } from "next/navigation";
import VendorSelector from "./VendorSelector";

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Share details",
    description:
      "Tell us move type, home size, pickup and drop addresses — 60 seconds.",
  },
  {
    icon: PhoneCall,
    title: "We call you back",
    description:
      "Our move specialist confirms scope, dates, and gives you a transparent quote.",
  },
  {
    icon: CalendarCheck,
    title: "Schedule the move",
    description:
      "Lock a date. A verified crew shows up with packing material and insurance.",
  },
  {
    icon: PackageCheck,
    title: "Move, delivered",
    description:
      "Packed, loaded, transported, and unpacked — with real-time updates en-route.",
  },
];

const EMPTY_STOP: StopValue = { label: "", lat: 0, lng: 0, notes: "" };

export default function PackersMoversPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitPackersMovers();
  const router = useRouter();
  const { data: categories = [] } = useCategories();

  const form = useForm<PackersMoversFormValues>({
    resolver: zodResolver(packersMoversSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
      addressLine: "",
      pincode: "",
      preferredDate: "",
      preferredSlot: undefined,
      moveType: "home",
      bhk: "2",
      pickup: { ...EMPTY_STOP },
      drops: [{ ...EMPTY_STOP }],
      hasPackingMaterial: false,
      notes: "",
      assignedVendorUserId: null,
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

  // Watched values feed the live TripEstimate card without re-submitting.
  const pickupWatch = useWatch({ control: form.control, name: "pickup" });
  const dropsWatch = useWatch({ control: form.control, name: "drops" });
  const moveTypeWatch = useWatch({ control: form.control, name: "moveType" });
  const vendorCategoryId = resolveVendorCategoryId(
    categories,
    "packers_movers",
    moveTypeWatch,
    MOVE_TYPE_OPTIONS,
  );

  const onSubmit = async (values: PackersMoversFormValues) => {
    await mutation.mutateAsync({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      city: values.city?.trim() || undefined,
      addressLine: values.addressLine?.trim() || undefined,
      pincode: values.pincode?.trim() || undefined,
      preferredDate: values.preferredDate?.trim() || undefined,
      preferredSlot: values.preferredSlot,
      assignedVendorUserId: values.assignedVendorUserId ?? undefined,
      details: {
        moveType: values.moveType,
        bhk: values.bhk,
        pickup: {
          label: values.pickup.label.trim(),
          lat: values.pickup.lat,
          lng: values.pickup.lng,
          placeId: values.pickup.placeId,
          notes: values.pickup.notes?.trim() || undefined,
        },
        drops: values.drops.map((d) => ({
          label: d.label.trim(),
          lat: d.lat,
          lng: d.lng,
          placeId: d.placeId,
          notes: d.notes?.trim() || undefined,
        })),
        hasPackingMaterial: values.hasPackingMaterial ?? false,
        notes: values.notes?.trim() || undefined,
      },
    });
    form.reset({
      ...form.getValues(),
      pickup: { ...EMPTY_STOP },
      drops: [{ ...EMPTY_STOP }],
      notes: "",
      assignedVendorUserId: null,
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
        eyebrow="Packers & Movers"
        title="Moving homes? Leave the heavy lifting to us."
        subtitle="Verified local and intercity movers, transparent pricing, and caring packing. Tell us where you're going — we'll handle the rest."
        Illustration={Truck}
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How your move works"
        subheading="From the first quote to the last carton — four steps, zero surprises."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Get a free moving quote
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Fill a few details below. Our team typically calls back within 30 minutes on business hours.
            </p>
          </div>

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center"
            >
              <PackageCheck className="mx-auto h-10 w-10 text-primary" aria-hidden />
              <h3 className="mt-3 font-heading text-2xl font-semibold text-foreground">
                Request received
              </h3>
              <p className="mt-2 text-muted-foreground">
                Thanks {form.getValues("name") || "there"} — our moving specialist will reach out shortly.
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
                            placeholder="Priya Sharma"
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
                            placeholder="priya@example.com"
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
                    About your move
                  </h3>
                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="moveType"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel required>Move type</FormLabel>
                          <FormControl>
                            <Combobox
                              options={MOVE_TYPE_OPTIONS}
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              placeholder="Select move type"
                              searchPlaceholder="Search move type…"
                              disableSearch={MOVE_TYPE_OPTIONS.length <= 6}
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bhk"
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel required>Home size</FormLabel>
                          <FormControl>
                            <Combobox
                              options={BHK_OPTIONS}
                              value={field.value ?? ""}
                              onValueChange={field.onChange}
                              placeholder="Select size"
                              searchPlaceholder="Search size…"
                              disableSearch={BHK_OPTIONS.length <= 6}
                              aria-invalid={!!fieldState.error}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6 rounded-xl border border-border bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <Flag className="h-3.5 w-3.5" aria-hidden />
                      </span>
                      <h4 className="text-sm font-semibold text-foreground">
                        Pickup location
                      </h4>
                    </div>
                    <Controller
                      control={form.control}
                      name="pickup"
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
                                field.onChange({ ...EMPTY_STOP });
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
                            placeholder="Search pickup address or area…"
                            showMapPreview
                            mapPreviewHeight={160}
                            error={
                              fieldState.error?.message ??
                              // nested label error
                              (fieldState.error as { label?: { message?: string } } | undefined)
                                ?.label?.message
                            }
                          />
                          <Textarea
                            rows={2}
                            maxLength={500}
                            placeholder="Pickup notes (optional) — floor #, lift available, parking spot, security contact"
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

                  <div className="mt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">
                        Drop location(s)
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Add up to {MAX_DROPS} stops if you're splitting items
                      </p>
                    </div>
                    <Controller
                      control={form.control}
                      name="drops"
                      render={({ field, fieldState }) => (
                        <StopList
                          value={field.value}
                          onChange={field.onChange}
                          max={MAX_DROPS}
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                  </div>

                  <TripEstimate
                    className="mt-5"
                    pickup={pickupWatch ?? null}
                    drops={dropsWatch ?? []}
                  />

                  <div className="mt-5 grid gap-5 sm:grid-cols-2">
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

                  <div className="mt-5">
                    <FormField
                      control={form.control}
                      name="assignedVendorUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred vendor</FormLabel>
                          <FormControl>
                            <VendorSelector
                              categoryId={vendorCategoryId}
                              value={field.value ?? null}
                              onValueChange={field.onChange}
                              disabled={!vendorCategoryId}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hasPackingMaterial"
                    render={({ field }) => (
                      <FormItem className="mt-5 flex flex-row items-start gap-3 space-y-0 rounded-xl border border-border bg-muted/20 p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value ?? false}
                            onCheckedChange={(v) =>
                              field.onChange(v === true)
                            }
                          />
                        </FormControl>
                        <div className="leading-tight">
                          <FormLabel className="!mt-0">
                            I need packing materials
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Boxes, bubble wrap, tape & labels delivered before the move.
                          </p>
                        </div>
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
                            placeholder="Heavy items like a piano, parking restrictions, floor without lift, etc."
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
                    By submitting, you agree to be contacted by our move specialist.
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
