"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type Agent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function useAgents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["agents"],
    queryFn: api.getAgents,
  });

  const createMutation = useMutation({
    mutationFn: api.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({
        title: "Agent created",
        description: "A welcome email with a verification link has been sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error creating agent",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Agent> }) => api.updateAgent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agent updated" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating agent",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      toast({ title: "Agent deleted" });
    },
  });

  return {
    ...query,
    createAgent: createMutation.mutateAsync,
    updateAgent: updateMutation.mutateAsync,
    deleteAgent: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
