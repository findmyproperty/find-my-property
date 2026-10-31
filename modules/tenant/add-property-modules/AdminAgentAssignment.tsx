"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { UserCog, Loader2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Combobox } from "@/components/ui/combobox";
import { useAgents } from "@/hooks/use-agents";
import type { PropertyFormValues } from "./schema";

const NONE = "__none__";

/** Admin-only: assign which agent owns / manages this listing. */
export const AdminAgentAssignment = () => {
  const { control } = useFormContext<PropertyFormValues>();
  const { data: agents, isLoading } = useAgents();

  const agentOptions = useMemo(
    () => [
      { value: NONE, label: "— None —" },
      ...(agents?.filter((a) => a.isEmailVerified) ?? []).map((agent) => ({
        value: String(agent.id),
        label: agent.name?.trim() || `Agent #${agent.id}`,
      })),
    ],
    [agents],
  );

  return (
    <div className="space-y-4 pb-2">
      <p className="text-sm text-muted-foreground flex items-start gap-2">
        <UserCog className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        Choose the listing agent for this property. Tenants do not see this section.
      </p>
      <FormField
        control={control}
        name="assignedAgentId"
        render={({ field, fieldState }) => (
          <FormItem>
            <FormLabel>Listing agent</FormLabel>
            <FormControl>
              <Combobox
                options={agentOptions}
                value={field.value ? String(field.value) : NONE}
                onValueChange={(v) => field.onChange(v === NONE ? "" : v)}
                placeholder={isLoading ? "Loading agents…" : "Select an agent"}
                searchPlaceholder="Search agents…"
                disabled={isLoading}
                aria-invalid={!!fieldState.error}
              />
            </FormControl>
            <FormDescription>Optional. Leave empty to assign later from approvals.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      {isLoading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading agent list…
        </div>
      )}
    </div>
  );
};
