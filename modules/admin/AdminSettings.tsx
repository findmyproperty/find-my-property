"use client";

import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Globe,
  Palette,
  Mail,
  Phone,
  Type as TypeIcon,
  Loader2,
  RotateCcw,
  Check,
  Star,
  ExternalLink,
  Building2,
  User2,
  HelpCircle,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import { api, type Settings } from "@/lib/api";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** Fields tracked by the form. Read-only server fields (id, updatedAt, theme,
 * API keys, 2FA toggles) are intentionally excluded so PATCH never clobbers
 * them. */
type SettingsFormValues = Pick<
  Settings,
  | "siteName"
  | "supportEmail"
  | "supportPhone"
  | "vendorCommissionPercent"
  | "primaryLogoUrl"
  | "faviconUrl"
  | "landingReactionIds"
  | "faqs"
>;

const FORM_DEFAULTS: SettingsFormValues = {
  siteName: "",
  supportEmail: "",
  supportPhone: "",
  vendorCommissionPercent: 10,
  primaryLogoUrl: null,
  faviconUrl: null,
  landingReactionIds: [],
  faqs: [],
};

const AdminSettings = () => {
  const { data: settings, isLoading, updateSettings, isUpdating } =
    useAdminSettings();
  const { data: reactions = [], isLoading: reactionsLoading } = useQuery({
    queryKey: ["admin-customer-reactions"],
    queryFn: api.adminListCustomerReactions,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<SettingsFormValues>({ defaultValues: FORM_DEFAULTS });

  const {
    fields: faqFields,
    append: appendFaq,
    remove: removeFaq,
    move: moveFaq,
  } = useFieldArray({
    control,
    name: "faqs",
  });

  // Once server data lands, reset the form so RHF's baseline matches the
  // persisted values — this is what makes isDirty accurate.
  useEffect(() => {
    if (settings) {
      reset({
        siteName: settings.siteName ?? "",
        supportEmail: settings.supportEmail ?? "",
        supportPhone: settings.supportPhone ?? "",
        vendorCommissionPercent: settings.vendorCommissionPercent ?? 10,
        primaryLogoUrl: settings.primaryLogoUrl ?? null,
        faviconUrl: settings.faviconUrl ?? null,
        landingReactionIds: settings.landingReactionIds ?? [],
        faqs: settings.faqs ?? [],
      });
    }
  }, [settings, reset]);

  const landingReactionIds = watch("landingReactionIds") ?? [];

  const onSubmit = handleSubmit(async (values) => {
    // settingsUpdateSchema is settingsSchema.partial() — every field is optional
    // but still validated when present. Empty strings on required fields (siteName,
    // supportEmail) would fail min(1)/email() checks, so strip them to undefined
    // so Zod treats them as "not sent" rather than "invalid".
    const payload: Partial<Settings> = {
      siteName:                values.siteName?.trim()         || undefined,
      supportEmail:            values.supportEmail?.trim()     || undefined,
      supportPhone:            values.supportPhone?.trim()     || null,
      vendorCommissionPercent: values.vendorCommissionPercent,
      primaryLogoUrl:          values.primaryLogoUrl           || null,
      faviconUrl:              values.faviconUrl               || null,
      landingReactionIds:      values.landingReactionIds,
      faqs:                    values.faqs,
    };
    await updateSettings(payload);
    // Reset the RHF baseline to the saved values so isDirty → false.
    reset(values);
  });

  const handleDiscard = () => {
    if (settings) {
      reset({
        siteName: settings.siteName ?? "",
        supportEmail: settings.supportEmail ?? "",
        supportPhone: settings.supportPhone ?? "",
        vendorCommissionPercent: settings.vendorCommissionPercent ?? 10,
        primaryLogoUrl: settings.primaryLogoUrl ?? null,
        faviconUrl: settings.faviconUrl ?? null,
        landingReactionIds: settings.landingReactionIds ?? [],
        faqs: settings.faqs ?? [],
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading system configuration…</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="min-w-0 space-y-6 overflow-x-hidden"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl">
            System Settings
          </h2>
          <p className="text-sm text-muted-foreground">
            Manage public identity and branding shown across the platform.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {isDirty ? (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            >
              Unsaved changes
            </motion.span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={handleDiscard}
            disabled={!isDirty || isUpdating}
            className="w-full gap-2 sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </Button>
          <Button
            type="submit"
            disabled={!isDirty || isUpdating}
            className="w-full gap-2 sm:w-auto"
          >
            {isUpdating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="min-w-0 space-y-6">
        <TabsList className="flex h-auto w-full max-w-full justify-start overflow-x-auto bg-muted/50 p-1">
          <TabsTrigger value="general" className="shrink-0 gap-2">
            <Globe className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="branding" className="shrink-0 gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
          <TabsTrigger value="faqs" className="shrink-0 gap-2">
            <HelpCircle className="h-4 w-4" /> FAQs
          </TabsTrigger>
        </TabsList>

        {/* -------------------- General -------------------- */}
        <TabsContent value="general" className="space-y-6">
          <SectionCard
            icon={<TypeIcon className="h-4 w-4 text-primary" />}
            title="Public identity"
            subtitle="How customers see your brand across the site and in notifications."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Site name" htmlFor="site-name" required>
                <Input
                  id="site-name"
                  placeholder="Find My Property"
                  maxLength={255}
                  {...register("siteName", {
                    required: "Site name is required",
                    minLength: { value: 1, message: "Site name is required" },
                  })}
                />
              </Field>

              <Field
                label="Support email"
                htmlFor="support-email"
                hint="Used as the reply-to on transactional emails."
                icon={<Mail className="h-3.5 w-3.5" />}
              >
                <Input
                  id="support-email"
                  type="email"
                  placeholder="support@yourbrand.com"
                  autoComplete="email"
                  {...register("supportEmail", {
                    required: "Support email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
              </Field>

              <Field
                label="Support phone"
                htmlFor="support-phone"
                hint="Shown in the footer and contact page. Also used when vendors or customers tap Call (opens the phone dialer). Leave blank to hide Call actions."
                icon={<Phone className="h-3.5 w-3.5" />}
              >
                <Input
                  id="support-phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  {...register("supportPhone")}
                />
              </Field>

              <Field
                label="Vendor commission %"
                htmlFor="vendor-commission"
                hint="Deducted from job amount when a vendor lead is completed."
              >
                <Input
                  id="vendor-commission"
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  {...register("vendorCommissionPercent", { valueAsNumber: true })}
                />
              </Field>

            </div>
          </SectionCard>

          <SectionCard
            icon={<Star className="h-4 w-4 text-primary" />}
            title="Customer reactions"
            subtitle="Select completed service reviews to feature on the landing page. Chosen reviews appear ordered 5 → 1 star."
          >
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {landingReactionIds.length} selected
                </span>
                {landingReactionIds.length > 0 && (
                  <Badge variant="secondary">
                    showing on landing page
                  </Badge>
                )}
              </div>
              <Button
                type="submit"
                disabled={!isDirty || isUpdating}
                className="shrink-0 gap-2"
              >
                {isUpdating ? (
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                ) : (
                  <Check data-icon="inline-start" />
                )}
                Save selection
              </Button>
            </div>

            {/* Table */}
            {reactionsLoading ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Show</TableHead>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-24">Rating</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="size-4 rounded" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : reactions.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                <Star className="size-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No customer ratings yet</p>
                <p className="text-xs text-muted-foreground">
                  Completed service requests with ratings will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">Show</TableHead>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="w-24">Rating</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reactions.map((reaction) => {
                      const selected = landingReactionIds.includes(reaction.id);
                      return (
                        <TableRow
                          key={reaction.id}
                          data-state={selected ? "selected" : undefined}
                          className="group"
                        >
                          {/* Checkbox — controlled via RHF Controller */}
                          <TableCell>
                            <Controller
                              control={control}
                              name="landingReactionIds"
                              render={({ field }) => (
                                <Checkbox
                                  checked={field.value.includes(reaction.id)}
                                  aria-label={`Show ${reaction.fullName ?? reaction.name}'s reaction on landing page`}
                                  onCheckedChange={(checked) => {
                                    const next = checked
                                      ? [...new Set([...field.value, reaction.id])]
                                      : field.value.filter((id) => id !== reaction.id);
                                    field.onChange(next);
                                  }}
                                />
                              )}
                            />
                          </TableCell>

                          {/* Service Request ID */}
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            #{reaction.id}
                          </TableCell>

                          {/* Service type badge */}
                          <TableCell>
                            <ServiceTypeBadge type={reaction.serviceType} label={reaction.service} />
                          </TableCell>

                          {/* Vendor */}
                          <TableCell>
                            {reaction.vendorId ? (
                              <a
                                href={`/vendor/${reaction.vendorId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group/link inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
                              >
                                <Building2 className="size-3.5 shrink-0 text-muted-foreground group-hover/link:text-primary" />
                                <span className="truncate max-w-[140px]">
                                  {reaction.vendorName ?? "Unnamed vendor"}
                                </span>
                                <ExternalLink className="size-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                              </a>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Building2 className="size-3.5 shrink-0" />
                                Unassigned
                              </span>
                            )}
                          </TableCell>

                          {/* Customer full name */}
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                              <User2 className="size-3.5 shrink-0 text-muted-foreground" />
                              {reaction.fullName ?? reaction.name}
                            </span>
                          </TableCell>

                          {/* Star rating */}
                          <TableCell>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3.5 ${
                                    i < reaction.rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-muted text-muted"
                                  }`}
                                  aria-hidden
                                />
                              ))}
                              <span className="ml-1 text-xs text-muted-foreground">
                                {reaction.rating}/5
                              </span>
                            </span>
                          </TableCell>

                          {/* Feedback with tooltip for long text */}
                          <TableCell className="max-w-xs">
                            {reaction.feedback ? (
                              reaction.feedback.length > 80 ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="block truncate text-sm text-muted-foreground cursor-default">
                                      {reaction.feedback}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm whitespace-pre-wrap text-xs">
                                    {reaction.feedback}
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  {reaction.feedback}
                                </span>
                              )
                            ) : (
                              <span className="text-xs italic text-muted-foreground/60">
                                No written feedback
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </SectionCard>
        </TabsContent>


        {/* -------------------- Branding -------------------- */}
        <TabsContent value="branding" className="space-y-6">
          <SectionCard
            icon={<Palette className="h-4 w-4 text-primary" />}
            title="Logo & favicon"
            subtitle="Upload your brand marks via Cloudinary. Save changes to apply across the site."
          >
            <div className="grid min-w-0 gap-6 md:grid-cols-2">
              <Controller
                control={control}
                name="primaryLogoUrl"
                render={({ field }) => (
                  <ImageUploadField
                    label="Primary logo"
                    description="SVG or PNG, recommended ≤ 1 MB."
                    value={field.value}
                    onChange={field.onChange}
                    accept="image/svg+xml,image/png,image/jpeg,image/webp"
                    aspect="wide"
                    maxSizeMb={5}
                  />
                )}
              />
              <Controller
                control={control}
                name="faviconUrl"
                render={({ field }) => (
                  <ImageUploadField
                    label="Favicon"
                    description="Square 32×32 or 64×64, ICO / PNG / SVG."
                    value={field.value}
                    onChange={field.onChange}
                    accept="image/x-icon,image/png,image/svg+xml"
                    aspect="square"
                    maxSizeMb={1}
                  />
                )}
              />
            </div>
          </SectionCard>

        </TabsContent>

        {/* -------------------- FAQs -------------------- */}
        <TabsContent value="faqs" className="space-y-6">
          <SectionCard
            icon={<HelpCircle className="h-4 w-4 text-primary" />}
            title="Frequently Asked Questions"
            subtitle="Add, edit, reorder, or delete custom FAQs displayed on the landing page."
          >
            <div className="flex flex-col gap-4">
              {faqFields.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center">
                  <HelpCircle className="size-8 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No custom FAQs defined</p>
                  <p className="text-xs text-muted-foreground">
                    The public landing page will display the default handbook questions.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {faqFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-start gap-4 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      {/* Reordering Controls */}
                      <div className="flex flex-col gap-1 shrink-0 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === 0}
                          onClick={() => moveFaq(index, index - 1)}
                        >
                          <ArrowUp className="size-4" />
                          <span className="sr-only">Move up</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === faqFields.length - 1}
                          onClick={() => moveFaq(index, index + 1)}
                        >
                          <ArrowDown className="size-4" />
                          <span className="sr-only">Move down</span>
                        </Button>
                      </div>

                      {/* Question & Answer Inputs */}
                      <div className="grid flex-1 gap-3">
                        <div>
                          <Label htmlFor={`faq-q-${index}`} className="text-xs font-semibold text-muted-foreground">
                            Question #{index + 1}
                          </Label>
                          <Input
                            id={`faq-q-${index}`}
                            placeholder="Enter FAQ Question"
                            className="mt-1"
                            {...register(`faqs.${index}.question` as const, { required: "Question is required" })}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`faq-a-${index}`} className="text-xs font-semibold text-muted-foreground">
                            Answer #{index + 1}
                          </Label>
                          <Textarea
                            id={`faq-a-${index}`}
                            placeholder="Enter FAQ Answer"
                            rows={3}
                            className="mt-1 resize-y"
                            {...register(`faqs.${index}.answer` as const, { required: "Answer is required" })}
                          />
                        </div>
                      </div>

                      {/* Delete Action */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 shrink-0 mt-2"
                        onClick={() => removeFaq(index)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete FAQ</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add FAQ trigger */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-dashed border-primary/40 hover:border-primary"
                onClick={() => appendFaq({ id: `faq-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, question: "", answer: "" })}
              >
                <Plus className="size-4" />
                Add FAQ Item
              </Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </form>
  );
};

// ─── Local presentational helpers ──────────────────────────────────────────

function SectionCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <header className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="font-heading text-base font-semibold text-foreground">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
  hint,
  required,
  icon,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-xs font-medium text-foreground"
      >
        {icon}
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

const SERVICE_TYPE_META: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  packers_movers:    { label: "Packers & Movers",    variant: "default"    },
  painting_cleaning: { label: "Painting & Cleaning", variant: "secondary"  },
  home_services:     { label: "Home Services",        variant: "secondary"  },
  event_management:  { label: "Event Management",     variant: "outline"    },
  it:                { label: "IT Services",           variant: "outline"    },
  general:           { label: "General Services",     variant: "outline"    },
};

function ServiceTypeBadge({
  type,
  label,
}: {
  type?: string;
  label: string;
}) {
  const meta = type ? SERVICE_TYPE_META[type] : undefined;
  return (
    <Badge variant={meta?.variant ?? "outline"} className="whitespace-nowrap text-xs">
      {meta?.label ?? label}
    </Badge>
  );
}

export default AdminSettings;
