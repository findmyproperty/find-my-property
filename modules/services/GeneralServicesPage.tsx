"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  HandHelping,
  PhoneCall,
  Sparkles,
  Users,
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
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useServiceAuthModal } from "@/contexts/service-auth-modal-context";
import { useSubmitGeneralServices } from "@/hooks/use-service-requests";
import { useCategories } from "@/hooks/use-categories";
import {
  buildServiceOptions,
  getServiceOptionsFieldState,
  isServiceFormBlocked,
  resolveVendorCategoryId,
  useSyncSelectedServiceOption,
} from "./category-mapping";
import {
  GENERAL_SERVICE_TYPE_OPTIONS,
  generalServicesSchema,
  type GeneralServicesFormValues,
} from "./schemas";
import { ServiceHero } from "./ServiceHero";
import { HowItWorks, type HowItWorksStep } from "./HowItWorks";
import VendorSelector from "./VendorSelector";
import { useRouter } from "next/navigation";

const GENERAL_SERVICE_OPTIONS = GENERAL_SERVICE_TYPE_OPTIONS;

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Pick a service",
    description: "Handyman help, errands, furniture assembly, or other assistance.",
  },
  {
    icon: Users,
    title: "Choose a vendor",
    description: "Browse verified partners for the service you need.",
  },
  {
    icon: PhoneCall,
    title: "We connect you",
    description: "Our team confirms details and introduces you to your vendor.",
  },
  {
    icon: Sparkles,
    title: "Task completed",
    description: "Your chosen partner delivers — with our support if needed.",
  },
];

export default function GeneralServicesPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitGeneralServices();
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const form = useForm<GeneralServicesFormValues>({
    resolver: zodResolver(generalServicesSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subType: "handyman",
      notes: "",
      assignedVendorUserId: undefined,
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
    });
  }, [isAuthReady, user, form]);

  const subTypeWatch = useWatch({ control: form.control, name: "subType" });
  const vendorCategoryId = resolveVendorCategoryId(
    categories,
    "general",
    subTypeWatch,
    GENERAL_SERVICE_OPTIONS,
  );
  const subTypeOptions = buildServiceOptions(
    GENERAL_SERVICE_OPTIONS,
    categories,
    "general",
  );
  const syncSubType = useCallback(
    (value: string) => form.setValue("subType", value),
    [form],
  );
  useSyncSelectedServiceOption(subTypeOptions, subTypeWatch, syncSubType);
  const subTypeFieldState = getServiceOptionsFieldState(
    categoriesLoading,
    subTypeOptions,
    "Pick a service",
  );
  const serviceFormBlocked = isServiceFormBlocked(categoriesLoading, subTypeOptions);

  const onSubmit = async (values: GeneralServicesFormValues) => {
    await mutation.mutateAsync({
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email.trim(),
      assignedVendorUserId: values.assignedVendorUserId,
      details: {
        subType: values.subType,
        notes: values.notes?.trim() || undefined,
      },
    });
    form.reset({
      ...form.getValues(),
      notes: "",
      assignedVendorUserId: undefined,
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
        eyebrow="General Services"
        title="Everyday help, handled professionally."
        subtitle="Pick a service, choose a verified vendor, and we'll connect you."
        Illustration={HandHelping}
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How our general services work"
        subheading="Pick a service, choose a vendor, and we'll take it from there."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Book general help
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Tell us what you need and pick a vendor — we&apos;ll connect you shortly.
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
                Thanks {form.getValues("name") || "there"} — our team will reach out shortly.
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
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Your details
                </h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Your name</FormLabel>
                        <FormControl>
                          <Input placeholder="Rahul Nair" autoComplete="name" {...field} />
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
                          <Input autoComplete="tel" inputMode="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Email</FormLabel>
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
                </div>

                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="font-heading text-lg font-semibold text-foreground">
                    Service & vendor
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
                              options={subTypeOptions}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder={subTypeFieldState.placeholder}
                              emptyMessage={subTypeFieldState.emptyMessage}
                              disabled={subTypeFieldState.disabled}
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
                      name="assignedVendorUserId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel required>Preferred vendor</FormLabel>
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
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="mt-5">
                        <FormLabel>Anything else? (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Briefly describe what you need help with."
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
                    disabled={mutation.isPending || !isAuthReady || serviceFormBlocked}
                    onClick={handleRequestCallback}
                  >
                    {mutation.isPending ? "Submitting..." : "Submit request"}
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
