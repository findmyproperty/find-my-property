"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  ClipboardList,
  PhoneCall,
  Sparkles,
  UserCheck,
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
import { useSubmitJobConsultancy } from "@/hooks/use-job-consultancy";
import { ServiceHero } from "@/modules/services/ServiceHero";
import { HowItWorks, type HowItWorksStep } from "@/modules/services/HowItWorks";
import { useRouter } from "next/navigation";
import {
  jobConsultancySchema,
  type JobConsultancyFormValues,
} from "./schemas";
import {
  CONSULTANCY_TYPE_OPTIONS,
  JOB_CONSULTANCY_PAGE_TRUST,
} from "./job-consultancy-config";

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Share your details",
    description: "Pick IT, Non IT, or Customer Support and tell us how to reach you.",
  },
  {
    icon: PhoneCall,
    title: "Consultant calls you",
    description: "A career advisor learns about your experience and goals.",
  },
  {
    icon: UserCheck,
    title: "Profile screening",
    description: "We match your profile with suitable openings and prepare you for interviews.",
  },
  {
    icon: Sparkles,
    title: "Land the role",
    description: "Interview support and placement assistance until you join.",
  },
];

export default function JobConsultancyPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitJobConsultancy();
  const router = useRouter();

  const form = useForm<JobConsultancyFormValues>({
    resolver: zodResolver(jobConsultancySchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      city: "",
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

  const onSubmit = async (values: JobConsultancyFormValues) => {
    await mutation.mutateAsync({
      consultancyType: values.consultancyType,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      city: values.city?.trim() || undefined,
      details: {
        notes: values.notes?.trim() || null,
      },
    });
    form.reset({
      consultancyType: undefined,
      name: form.getValues("name"),
      phone: form.getValues("phone"),
      email: form.getValues("email"),
      city: form.getValues("city"),
      notes: "",
    });
  };

  const isSubmitted = mutation.isSuccess && !form.formState.isDirty;

  const handleApply = () => {
    requireAuth(() => {
      void form.handleSubmit(onSubmit)();
    });
  };

  return (
    <main className="pb-20">
      <ServiceHero
        eyebrow="Job Consultancy"
        title="Your next career move starts here."
        subtitle="IT, Non IT & Customer Support — one simple inquiry form and our consultants will call you back with matching opportunities."
        Illustration={Briefcase}
        trust={[...JOB_CONSULTANCY_PAGE_TRUST]}
        ctaLabel="Get started"
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How it works"
        subheading="From inquiry to placement — we guide you at every step."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Job consultancy inquiry
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Select the type of role you&apos;re looking for and we&apos;ll get back to you shortly.
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
                Thanks {form.getValues("name") || "there"} — a career consultant will call you shortly.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {user ? (
                  <Button asChild>
                    <Link href="/my-requests">
                      Track status
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" onClick={openAuthModal}>
                    Log in to track status
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
                  handleApply();
                }}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
              >
                <FormField
                  control={form.control}
                  name="consultancyType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel required>Type of consultancy</FormLabel>
                      <FormControl>
                        <Combobox
                          options={CONSULTANCY_TYPE_OPTIONS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="IT, Non IT, or Customer Support"
                          disableSearch
                          aria-invalid={!!fieldState.error}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <Input placeholder="Kochi" autoComplete="address-level2" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-5">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={3}
                            placeholder="Experience, preferred role, availability…"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="mt-8 w-full"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Submitting…" : "Submit inquiry"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          )}
        </div>
      </section>
    </main>
  );
}
