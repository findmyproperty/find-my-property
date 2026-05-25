"use server";

import { updateTag } from "next/cache";

import { TAGS } from "@/config/tags";

/**
 * Bust the SSR data cache for the `settings` tag. Called from the admin
 * settings hook after a successful PATCH so the next request re-renders
 * metadata, JSON-LD, and any other server surface with the new branding.
 *
 * We use `updateTag` (Next 16+) rather than `revalidateTag` because this
 * runs inside a Server Action and we want read-your-own-writes semantics —
 * the very next render in the same response sees the new value, with no
 * profile/expiry argument to maintain.
 */
export async function revalidateBranding() {
  updateTag(TAGS.settings);
}
