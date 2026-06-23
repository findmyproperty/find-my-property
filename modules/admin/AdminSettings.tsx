"use client";

import { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminSettings } from "@/hooks/use-admin-settings";
import type { Settings } from "@/lib/api";
import { ImageUploadField } from "@/components/admin/ImageUploadField";

/** Defaults for a brand-new draft. Keeps the form predictable before the
 * server response lands (avoids uncontrolled → controlled warnings). Fields
 * the UI no longer edits (theme, marketplace toggles, API keys, 2FA) stay on
 * the server — they're simply omitted from the draft so PATCH round-trips
 * don't clobber persisted values. */
const EMPTY_DRAFT: Partial<Settings> = {
  siteName: "",
  supportEmail: "",
  supportPhone: "",
  primaryLogoUrl: null,
  faviconUrl: null,
};

/** Shallow equality over the keys we track in the draft. Cheaper than a deep
 * diff and sufficient since every settings field is a primitive. */
function isDirty(draft: Partial<Settings>, server: Settings | undefined): boolean {
  if (!server) return false;
  return (Object.keys(draft) as Array<keyof Settings>).some((k) => {
    const a = draft[k] ?? null;
    const b = (server[k] as unknown) ?? null;
    return a !== b;
  });
}

const AdminSettings = () => {
  const { data: settings, isLoading, updateSettings, isUpdating } =
    useAdminSettings();
  const [draft, setDraft] = useState<Partial<Settings>>(EMPTY_DRAFT);

  useEffect(() => {
    if (settings) setDraft(settings);
  }, [settings]);

  const dirty = useMemo(() => isDirty(draft, settings), [draft, settings]);

  const setField = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    // The GET /settings response includes server-managed fields (`id`,
    // `updatedAt`) that the PATCH DTO rejects via `forbidNonWhitelisted`.
    // Strip them — and any future read-only fields — before sending, then
    // normalize empty strings on optional text fields to null so "clear"
    // semantics round-trip cleanly through save/reload.
    const {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      id: _id,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      updatedAt: _updatedAt,
      ...writable
    } = draft as Partial<Settings> & { id?: unknown; updatedAt?: unknown };

    const payload: Partial<Settings> = {
      ...writable,
      supportPhone: writable.supportPhone?.trim() || null,
      primaryLogoUrl: writable.primaryLogoUrl || null,
      faviconUrl: writable.faviconUrl || null,
    };
    await updateSettings(payload);
  };

  const handleReset = () => {
    if (settings) setDraft(settings);
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
    <div className="min-w-0 space-y-6 overflow-x-hidden">
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
          {dirty ? (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
            >
              Unsaved changes
            </motion.span>
          ) : null}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!dirty || isUpdating}
            className="w-full gap-2 sm:w-auto"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Discard
          </Button>
          <Button
            onClick={handleSave}
            disabled={!dirty || isUpdating}
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
                  value={draft.siteName ?? ""}
                  onChange={(e) => setField("siteName", e.target.value)}
                  placeholder="Find My Property"
                  maxLength={255}
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
                  value={draft.supportEmail ?? ""}
                  onChange={(e) => setField("supportEmail", e.target.value)}
                  placeholder="support@yourbrand.com"
                  autoComplete="email"
                />
              </Field>

              <Field
                label="Support phone"
                htmlFor="support-phone"
                hint="Shown in the footer and contact page. Leave blank to hide."
                icon={<Phone className="h-3.5 w-3.5" />}
              >
                <Input
                  id="support-phone"
                  type="tel"
                  inputMode="tel"
                  value={draft.supportPhone ?? ""}
                  onChange={(e) => setField("supportPhone", e.target.value)}
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
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
                  value={draft.vendorCommissionPercent ?? settings?.vendorCommissionPercent ?? 10}
                  onChange={(e) =>
                    setField("vendorCommissionPercent", Number(e.target.value))
                  }
                />
              </Field>
            </div>
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
              <ImageUploadField
                label="Primary logo"
                description="SVG or PNG, recommended ≤ 1 MB."
                value={draft.primaryLogoUrl}
                onChange={(url) => setField("primaryLogoUrl", url)}
                accept="image/svg+xml,image/png,image/jpeg,image/webp"
                aspect="wide"
                maxSizeMb={5}
              />
              <ImageUploadField
                label="Favicon"
                description="Square 32×32 or 64×64, ICO / PNG / SVG."
                value={draft.faviconUrl}
                onChange={(url) => setField("faviconUrl", url)}
                accept="image/x-icon,image/png,image/svg+xml"
                aspect="square"
                maxSizeMb={1}
              />
            </div>
          </SectionCard>

        </TabsContent>
      </Tabs>
    </div>
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

export default AdminSettings;
