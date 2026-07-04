"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Category, CategoryCreate, CategoryUpdate } from "@/schema/category";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

export function useCategories() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user, isAuthReady } = useAuth();

  const query = useQuery({
    queryKey: ["categories"],
    queryFn: api.getCategories,
    // Allow any authenticated user to read categories (needed for dynamic service type selectors).
    // Management UI itself is still admin-only.
    enabled: isAuthReady && !!user,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (input: CategoryCreate) => api.createCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({
        title: "Category created",
        description: "The new category is now available (for properties or mapped services).",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating category",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: CategoryUpdate }) =>
      api.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating category",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted" });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting category",
        description: error?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  return {
    ...query,
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
