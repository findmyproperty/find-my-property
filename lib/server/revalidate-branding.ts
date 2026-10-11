"use server";

import { revalidatePath, updateTag } from "next/cache";

import { TAGS } from "@/config/tags";

/**
 * Bust the SSR data cache for branding/settings. Called after a successful
 * admin settings PATCH so the next request re-renders metadata, JSON-LD,
 * the homepage hero, and other server surfaces with the new branding.
 */
export async function revalidateBranding() {
  updateTag(TAGS.settings);
  updateTag(TAGS.properties);
  revalidatePath("/");
}
