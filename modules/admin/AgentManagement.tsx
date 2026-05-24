"use client";

import { type ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import {
  UserPlus,
  Mail,
  Phone,
  MapPin,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  MoreVertical,
  Search,
  Loader2,
} from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { type Agent } from "@/lib/api";
import type { AgentAssignedProperty } from "@/schema/agent";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallback, useMemo, useState } from "react";
import { format } from "date-fns";
import { normalizePhone } from "@/helpers";
import { buildPropertyPath } from "@/lib/property-slug";

type AgentForm = { name: string; email: string; phone: string };

const emptyAgentForm = (): AgentForm => ({ name: "", email: "", phone: "" });

const agentToForm = (agent: Agent): AgentForm => ({
  name: agent.name ?? "",
  email: agent.email ?? "",
  phone: agent.phone ?? "",
});

const PROPERTIES_OVERFLOW_THRESHOLD = 3;
const PROPERTIES_VISIBLE_WHEN_OVERFLOW = 2;

function AgentPropertiesCell({ properties }: { properties: AgentAssignedProperty[] }) {
  if (properties.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  const hasOverflow = properties.length > PROPERTIES_OVERFLOW_THRESHOLD;
  const visible = hasOverflow
    ? properties.slice(0, PROPERTIES_VISIBLE_WHEN_OVERFLOW)
    : properties;
  const overflowCount = hasOverflow ? properties.length - PROPERTIES_VISIBLE_WHEN_OVERFLOW : 0;

  const cellBody = (
    <div className="flex min-w-0 w-full max-w-[9rem] flex-col gap-0.5 sm:max-w-[12rem]">
      {visible.map((p) => (
        <Link
          key={p.id}
          href={buildPropertyPath(p.id, p.title)}
          className="truncate text-left text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          {p.title}
        </Link>
      ))}
      {overflowCount > 0 ? (
        <span className="w-fit rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  );

  if (!hasOverflow) {
    return cellBody;
  }

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <div className="min-w-0 w-full cursor-default">{cellBody}</div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-[min(20rem,calc(100vw-2rem))] p-2"
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          All properties ({properties.length})
        </p>
        <ul className="flex max-h-48 flex-col gap-1 overflow-y-auto">
          {properties.map((p) => (
            <li key={p.id} className="min-w-0">
              <Link
                href={buildPropertyPath(p.id, p.title)}
                className="block truncate text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

const AgentManagement = () => {
  const {
    data: agents,
    isLoading,
    createAgent,
    updateAgent,
    deleteAgent,
    isCreating,
    isUpdating,
  } = useAgents();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<AgentForm>(emptyAgentForm());
  const [editOpen, setEditOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState<AgentForm>(emptyAgentForm());

  const filteredAgents = agents?.filter((agent) => {
    const q = searchTerm.toLowerCase();
    const name = (agent.name ?? "").toLowerCase();
    const email = (agent.email ?? "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const handleAddAgent = async () => {
    try {
      const payload = {
        name: newAgent.name,
        email: newAgent.email,
        phone: normalizePhone(newAgent.phone),
      };
      await createAgent(payload);
      setIsAddModalOpen(false);
      setNewAgent(emptyAgentForm());
    } catch {
      // Toast handled in hook
    }
  };

  const openEditDialog = useCallback((agent: Agent) => {
    setEditingAgent(agent);
    setEditForm(agentToForm(agent));
    setEditOpen(true);
  }, []);

  const handleEditAgent = async () => {
    if (!editingAgent) return;
    try {
      await updateAgent({
        id: editingAgent.id,
        data: {
          name: editForm.name,
          email: editForm.email,
          phone: normalizePhone(editForm.phone),
        },
      });
      setEditOpen(false);
      setEditingAgent(null);
      setEditForm(emptyAgentForm());
    } catch {
      // Toast handled in hook
    }
  };

  const getStatusBadge = useCallback((agent: Agent) => {
    if (!agent.isEmailVerified) {
      return (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
          <Clock className="mr-1 w-3 h-3" /> Pending Verify
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="mr-1 w-3 h-3" /> Active
      </Badge>
    );
  }, []);

  const columns = useMemo<ColumnDef<Agent>[]>(
    () => [
      {
        id: "agent",
        header: "Agent Info",
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{agent.name ?? "—"}</span>
              <div className="mt-0.5 flex items-center text-xs text-muted-foreground">
                <Mail className="mr-1 w-3 h-3" /> {agent.email ?? "—"}
              </div>
              {agent.phone ? (
                <div className="mt-0.5 flex items-center text-xs text-muted-foreground">
                  <Phone className="mr-1 w-3 h-3" /> {agent.phone}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "properties",
        header: "Properties",
        cell: ({ row }) => (
          <AgentPropertiesCell properties={row.original.properties ?? []} />
        ),
      },
      {
        id: "location",
        header: "Location",
        cell: ({ row }) => {
          const agent = row.original;
          const city = agent.locationCity;
          const region = [agent.locationState, agent.locationCountry].filter(Boolean).join(", ");
          const label = [city, region].filter(Boolean).join(", ") || "—";
          return (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="mr-2 w-4 h-4 text-primary opacity-50" />
              {label}
            </div>
          );
        },
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => getStatusBadge(row.original),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="cursor-pointer gap-2"
                    onSelect={(e) => {
                      e.preventDefault();
                      openEditDialog(agent);
                    }}
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Agent
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [deleteAgent, getStatusBadge, openEditDialog],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-bold text-foreground mb-1">Agent Management</h2>
          <p className="text-sm text-muted-foreground">Manage your property agents and their account status</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" /> Add New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Agent</DialogTitle>
              <DialogDescription>
                System will automatically send a welcome email with a 24-hour verification link.
              </DialogDescription>
            </DialogHeader>
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                void handleAddAgent();
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAgent.email}
                    onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    placeholder="+91 ..."
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              setEditingAgent(null);
              setEditForm(emptyAgentForm());
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Agent</DialogTitle>
              <DialogDescription>
                Update details for{" "}
                <span className="font-medium text-foreground">{editingAgent?.name ?? "this agent"}</span>.
              </DialogDescription>
            </DialogHeader>
            <form
              className="contents"
              onSubmit={(e) => {
                e.preventDefault();
                void handleEditAgent();
              }}
            >
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email Address</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91 ..."
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                    setEditingAgent(null);
                    setEditForm(emptyAgentForm());
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl p-1 shadow-sm">
        <div className="flex items-center px-3 py-2">
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <Input
            placeholder="Search by name or email..."
            className="border-0 focus-visible:ring-0 bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <DataTable
          columns={columns}
          data={filteredAgents ?? []}
          isLoading={isLoading}
          emptyMessage="No agents found matching your search."
        />
      </div>
    </div>
  );
};

export default AgentManagement;
