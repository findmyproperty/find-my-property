import type { QueryClient } from "@tanstack/react-query";

/** Keeps TanStack Query in sync after property mutations. */
export async function invalidatePropertyQueries(
  queryClient: QueryClient,
  propertyId?: string,
) {
  await queryClient.invalidateQueries({ queryKey: ["properties"] });
  await queryClient.invalidateQueries({ queryKey: ["properties", "raw"] });
  await queryClient.invalidateQueries({ queryKey: ["properties", "admin"] });
  await queryClient.invalidateQueries({ queryKey: ["properties", "my"] });
  if (propertyId) {
    await queryClient.invalidateQueries({ queryKey: ["property", propertyId] });
  }
}
