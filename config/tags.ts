/**
 * Cache tags for `cacheTag()` / `revalidateTag()` (Next.js Cache Components).
 * Use `TAGS.properties` when the public catalog changes; use `TAGS.property(id)` for one listing.
 */
export const TAGS = {
  properties: "properties",
  property: (id: string) => `property:${id}`,
  settings: "settings",
} as const;
