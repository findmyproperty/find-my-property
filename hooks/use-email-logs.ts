"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminListEmailLogsQuery } from "@/end-points/email-logs";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const QK = {
  adminList: (query: AdminListEmailLogsQuery) => ["admin-email-logs", query] as const,
};

export function useAdminEmailLogs(query: AdminListEmailLogsQuery) {
  const { user, isAuthReady } = useAuth();
  return useQuery({
    queryKey: QK.adminList(query),
    queryFn: () => api.emailLogs.adminList(query),
    enabled: isAuthReady && user?.role === "admin",
    staleTime: 15_000,
  });
}

export function useResendEmailLog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: number) => api.emailLogs.adminResend(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
      toast({
        title: "Email resent",
        description: "A new delivery attempt was logged.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Resend failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
}