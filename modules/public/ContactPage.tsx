"use client";

import type { ElementRef } from "react";
import { useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ClipboardList,
  HandHelping,
  Mail,
  MapPin,
  Phone,
  Send,
  Store,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSettings } from "@/contexts/settings-context";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { SITE_NAME, SUPPORT_EMAIL } from "@/lib/branding";

const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY?.trim() ||
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() ||
  "";

const quickPaths = [
  {
    href: "/browse",
    icon: Building2,
    title: "Property search",
    description: "Explore current listings and property details.",
  },
  {
    href: "/my-requests",
    icon: ClipboardList,
    title: "Existing request",
    description: "Review the service requests linked to your account.",
  },
  {
    href: "/register-vendor",
    icon: Store,
    title: "Vendor partnership",
    description: "Join the platform as a service provider.",
  },
];

type ContactPageProps = {
  siteName?: string;
};

export default function ContactPage({ siteName: ssrSiteName }: ContactPageProps = {}) {
  const { toast } = useToast();
  const { settings } = useSettings();
  const supportEmail = settings?.supportEmail?.trim() || SUPPORT_EMAIL;
  const supportPhone = settings?.supportPhone?.trim() || null;
  const siteName = settings?.siteName?.trim() || ssrSiteName?.trim() || SITE_NAME;
  const recaptchaRef = useRef<ElementRef<typeof ReCAPTCHA>>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail || !trimmedMessage) {
      toast({
        title: "Missing fields",
        description: "Please enter your email and message.",
        variant: "destructive",
      });
      return;
    }

    if (!RECAPTCHA_SITE_KEY) {
      toast({
        title: "reCAPTCHA not configured",
        description:
          "Set NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY in your environment.",
        variant: "destructive",
      });
      return;
    }

    const recaptchaToken = recaptchaRef.current?.getValue();
    if (!recaptchaToken) {
      toast({
        title: "Complete the verification",
        description: "Please check the “I’m not a robot” box.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await api.contact.submit({
        name: trimmedName || "Visitor",
        email: trimmedEmail,
        subject: trimmedSubject || "Contact form",
        message: trimmedMessage,
        recaptchaToken,
      });

      toast({
        title: "Message sent",
        description: "Thanks—we’ll get back to you as soon as we can.",
      });

      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      recaptchaRef.current?.reset();
    } catch (error) {
      toast({
        title: "Couldn’t send message",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong. Try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pb-20 pt-24">
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_12%,color-mix(in_oklab,var(--primary)_15%,transparent),transparent_30%),linear-gradient(to_bottom,var(--background),color-mix(in_oklab,var(--muted)_32%,var(--background)))]"
        />
        <div className="container mx-auto max-w-[1200px] px-4 py-14 sm:py-20">
          <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
            <Link href="/">
              <ArrowLeft data-icon="inline-start" aria-hidden />
              Back to home
            </Link>
          </Button>

          <div className="mt-12 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <Badge variant="outline">Contact &amp; support</Badge>
              <h1 className="mt-6 max-w-3xl font-heading text-5xl font-bold leading-[1.03] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
                Tell us what you&apos;re
                <span className="mt-2 block text-primary">working through.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Property question, service request, account issue, or partnership idea—send
                it to the {siteName} team and include the details that will help us route it
                correctly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="rounded-[2rem] bg-foreground p-6 text-background sm:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-background/60">
                Find the shortest path
              </p>
              <div className="mt-5 flex flex-col gap-2">
                {quickPaths.map(({ href, icon: Icon, title, description }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-center gap-4 rounded-2xl bg-background/5 p-4 transition-colors hover:bg-background/10"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background/10">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-sm font-semibold">{title}</span>
                      <span className="mt-1 block text-xs leading-5 text-background/60">
                        {description}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-background/50 transition-transform group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="container mx-auto grid max-w-[1200px] gap-10 px-4 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Direct contact
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-foreground">
              Reach the team directly.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Email is the best route for detailed enquiries. If a support phone is
              configured, you can also call during normal business hours.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={`mailto:${supportEmail}`}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">Email</span>
                  <span className="mt-1 block break-all text-sm text-muted-foreground">
                    {supportEmail}
                  </span>
                </span>
              </a>

              {supportPhone ? (
                <a
                  href={`tel:${supportPhone.replace(/\s+/g, "")}`}
                  className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-foreground">Phone</span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {supportPhone}
                    </span>
                  </span>
                </a>
              ) : null}

              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-foreground">Based in</span>
                  <span className="mt-1 block text-sm text-muted-foreground">India</span>
                </span>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-muted/50 p-5">
              <p className="font-heading text-sm font-semibold text-foreground">
                Help us answer faster
              </p>
              <ul className="mt-3 flex list-disc flex-col gap-2 pl-4 text-sm leading-6 text-muted-foreground">
                <li>Include the listing or request reference when available.</li>
                <li>Do not send passwords, OTPs, or payment credentials.</li>
                <li>Describe the outcome you need, not only the error message.</li>
              </ul>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
          >
            <Card className="overflow-hidden">
              <CardHeader className="p-6 sm:p-8">
                <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <HandHelping className="size-6" aria-hidden />
                </span>
                <CardTitle className="pt-5 font-heading text-3xl">Send us a message</CardTitle>
                <CardDescription className="max-w-xl text-base leading-7">
                  Share enough context for us to understand the property, service, account,
                  or partnership question.
                </CardDescription>
              </CardHeader>

              <form onSubmit={handleSubmit}>
                <CardContent className="px-6 sm:px-8">
                  <FieldGroup>
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                        <Input
                          id="contact-name"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Your name"
                          autoComplete="name"
                          required
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="contact-email">Email</FieldLabel>
                        <Input
                          id="contact-email"
                          type="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="you@example.com"
                          autoComplete="email"
                          required
                        />
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="contact-subject">Subject</FieldLabel>
                      <Input
                        id="contact-subject"
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder="Property, service, account, or partnership"
                        autoComplete="off"
                      />
                      <FieldDescription>
                        A clear subject helps us send your message to the right team.
                      </FieldDescription>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="contact-message">Message</FieldLabel>
                      <Textarea
                        id="contact-message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Tell us what happened and what you need next."
                        rows={7}
                        required
                        className="min-h-40 resize-y"
                      />
                    </Field>

                    {RECAPTCHA_SITE_KEY ? (
                      <Field>
                        <FieldLabel>Verification</FieldLabel>
                        <div className="max-w-full overflow-x-auto">
                          <ReCAPTCHA
                            ref={recaptchaRef}
                            sitekey={RECAPTCHA_SITE_KEY}
                            theme="light"
                          />
                        </div>
                      </Field>
                    ) : (
                      <Alert variant="destructive">
                        <AlertTitle>Contact form unavailable</AlertTitle>
                        <AlertDescription>
                          Add NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY to enable secure form
                          submissions. You can still email us directly.
                        </AlertDescription>
                      </Alert>
                    )}
                  </FieldGroup>
                </CardContent>

                <CardFooter className="mt-7 flex flex-col items-stretch gap-4 border-t border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                  <p className="max-w-md text-xs leading-5 text-muted-foreground">
                    Protected by reCAPTCHA. Google&apos;s{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Privacy Policy
                    </a>{" "}
                    and{" "}
                    <a
                      href="https://policies.google.com/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Terms
                    </a>{" "}
                    apply.
                  </p>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting || !RECAPTCHA_SITE_KEY}
                    className="shrink-0"
                  >
                    {submitting ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Send data-icon="inline-start" aria-hidden />
                    )}
                    {submitting ? "Sending…" : "Send message"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
