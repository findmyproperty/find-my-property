"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Settings } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { revalidateBranding } from "@/app/(roles-routes)/admin/settings/actions";
import { applyFavicon } from "@/lib/branding/client";

export function useAdminSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const router = useRouter();

  const query = useQuery({
    queryKey: ["admin-settings"],
    queryFn: api.getSettings,
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: api.updateSettings,
    onSuccess: async (updated) => {
      queryClient.setQueryData(["admin-settings"], updated);
      queryClient.setQueryData(["global-settings"], updated);
      applyFavicon(updated.faviconUrl);
      queryClient.invalidateQueries({ queryKey: ["global-settings"] });
      try {
        // Bust the SSR data cache (`revalidateTag('settings')`) so server
        // metadata, JSON-LD, and any other RSC re-renders with the new value.
        await revalidateBranding();
        // Re-fetch the current RSC tree so visible SSR surfaces (root <title>,
        // <link rel=icon>) update without a full reload.
        router.refresh();
      } catch {
        /* SSR revalidation is best-effort; the client query is already fresh. */
      }
      toast({
        title: "Settings saved",
        description: "Your configuration has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    },
  });

  return {
    ...query,
    updateSettings: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
