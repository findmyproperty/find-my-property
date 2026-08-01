"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ClipboardList,
  FileCheck,
  Landmark,
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
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useServiceAuthModal } from "@/contexts/service-auth-modal-context";
import { useSubmitLoanRequest } from "@/hooks/use-loan-requests";
import { ServiceHero } from "@/modules/services/ServiceHero";
import { SERVICE_IMAGES } from "@/modules/services/service-images";
import { HowItWorks, type HowItWorksStep } from "@/modules/services/HowItWorks";
import { useRouter } from "next/navigation";
import { loanApplicationSchema, type LoanApplicationFormValues } from "./schemas";
import { LOAN_PAGE_TRUST, LOAN_TYPE_OPTIONS } from "./loan-config";

const STEPS: HowItWorksStep[] = [
  {
    icon: ClipboardList,
    title: "Share your details",
    description: "Pick a loan type and tell us how to reach you — takes under a minute.",
  },
  {
    icon: PhoneCall,
    title: "Specialist calls you",
    description: "A loan advisor explains options and next steps for your situation.",
  },
  {
    icon: FileCheck,
    title: "Submit documents",
    description: "We guide you through KYC and income proof with minimal back-and-forth.",
  },
  {
    icon: Sparkles,
    title: "Get approved",
    description: "Track your application status until disbursement.",
  },
];

export default function LoanPage() {
  const { user, isAuthReady } = useAuth();
  const { requireAuth, openAuthModal } = useServiceAuthModal();
  const mutation = useSubmitLoanRequest();
  const router = useRouter();

  const form = useForm<LoanApplicationFormValues>({
    resolver: zodResolver(loanApplicationSchema),
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

  const onSubmit = async (values: LoanApplicationFormValues) => {
    await mutation.mutateAsync({
      loanType: values.loanType,
      name: values.name.trim(),
      phone: values.phone.trim(),
      email: values.email?.trim() || undefined,
      city: values.city?.trim() || undefined,
      details: {
        notes: values.notes?.trim() || null,
      },
    });
    form.reset({
      loanType: undefined,
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
        eyebrow="Loans"
        title="Finance your goals. Guidance you can trust."
        subtitle="Home loans, personal loans, vehicle finance, and mortgages — one simple inquiry form and a specialist will call you back."
        Illustration={Landmark}
        image={SERVICE_IMAGES.loans.src}
        imageAlt={SERVICE_IMAGES.loans.alt}
        trust={[...LOAN_PAGE_TRUST]}
        ctaLabel="Apply now"
        onCtaClick={() => router.replace("#request-form", { scroll: true })}
      />

      <HowItWorks
        heading="How it works"
        subheading="From inquiry to disbursement — we handle the paperwork."
        steps={STEPS}
      />

      <section id="request-form" className="py-20">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">
              Loan inquiry
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Select the loan type you need and we&apos;ll get back to you shortly.
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
                Application received
              </h3>
              <p className="mt-2 text-muted-foreground">
                Thanks {form.getValues("name") || "there"} — a loan specialist will call you shortly.
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
                  name="loanType"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel required>Type of loan</FormLabel>
                      <FormControl>
                        <Combobox
                          options={LOAN_TYPE_OPTIONS}
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Select a loan type"
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
                            placeholder="Anything else we should know?"
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
                  {mutation.isPending ? "Submitting…" : "Submit application"}
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
