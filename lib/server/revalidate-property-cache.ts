"use server";

import { revalidatePath, updateTag } from "next/cache";
import { TAGS } from "@/config/tags";

/** Call after create/update/delete so `use cache` property data refreshes on the next request. */
export async function revalidatePropertyListingCache(propertyId?: string) {
  updateTag(TAGS.properties);
  if (propertyId) {
    updateTag(TAGS.property(propertyId));
  }
  revalidatePath("/");
}
