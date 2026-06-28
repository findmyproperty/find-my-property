"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import {
  Edit2,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Trash2,
  UserPlus,
  Loader2,
} from "lucide-react";
import { useAgents } from "@/hooks/use-agents";
import { type Agent } from "@/lib/api";
import type { AgentAssignedProperty } from "@/schema/agent";
import { normalizePhone } from "@/helpers";
import { buildPropertyPath } from "@/lib/property-slug";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AdminDataTable } from "@/components/admin/admin-data-table";
import {
  AdminListEmpty,
  AdminListError,
  AdminListLoading,
} from "@/components/admin/admin-list-states";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminStatusBadge } from "@/components/admin/admin-status-badge";
import { AdminToolbar } from "@/components/admin/admin-toolbar";
import {
  compareDates,
  compareStrings,
  paginateItems,
  useAdminListControls,
} from "@/hooks/use-admin-list-controls";
import { AGENT_STATUS_OPTIONS } from "@/lib/admin/status-config";

const PAGE_SIZE = 20;

type AgentForm = { name: string; email: string; phone: string };
type AgentStatusFilter = "all" | "active" | "pending";
type AssignedPropertiesFilter = "all" | "with" | "without";
type AgentSortKey = "agent" | "properties" | "location" | "status" | "createdAt";

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
    return <span className="text-xs text-muted-foreground">-</span>;
  }

  const hasOverflow = properties.length > PROPERTIES_OVERFLOW_THRESHOLD;
  const visible = hasOverflow
    ? properties.slice(0, PROPERTIES_VISIBLE_WHEN_OVERFLOW)
    : properties;
  const overflowCount = hasOverflow
    ? properties.length - PROPERTIES_VISIBLE_WHEN_OVERFLOW
    : 0;

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

function agentStatus(agent: Agent): Exclude<AgentStatusFilter, "all"> {
  return agent.isEmailVerified ? "active" : "pending";
}

function locationLabel(agent: Agent): string {
  const region = [agent.locationState, agent.locationCountry].filter(Boolean).join(", ");
  return [agent.locationCity, region].filter(Boolean).join(", ") || "-";
}

function agentSearchText(agent: Agent): string {
  return [
    agent.name,
    agent.email,
    agent.phone,
    agent.locationCity,
    agent.locationState,
    agent.locationCountry,
    ...(agent.properties ?? []).map((property) => property.title),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();
}

function compareAgents(a: Agent, b: Agent, key: AgentSortKey): number {
  switch (key) {
    case "agent":
      return compareStrings(a.name ?? "", b.name ?? "");
    case "properties":
      return (a.properties?.length ?? 0) - (b.properties?.length ?? 0);
    case "location":
      return compareStrings(locationLabel(a), locationLabel(b));
    case "status":
      return compareStrings(agentStatus(a), agentStatus(b));
    case "createdAt":
      return compareDates(a.createdAt, b.createdAt);
  }
}

const AgentManagement = () => {
  const {
    data: agents,
    isLoading,
    isError,
    error,
    createAgent,
    updateAgent,
    deleteAgent,
    isCreating,
    isUpdating,
  } = useAgents();
  const [statusFilter, setStatusFilter] = useState<AgentStatusFilter>("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [assignedFilter, setAssignedFilter] =
    useState<AssignedPropertiesFilter>("all");
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");

  const {
    page,
    setPage,
    search,
    setSearch,
    debouncedSearch,
    sort,
    toggleSort,
    filterSheetOpen,
    setFilterSheetOpen,
  } = useAdminListControls<AgentSortKey>({
    defaultSort: { key: "createdAt", dir: "desc" },
    pageSize: PAGE_SIZE,
    resetPageDeps: [
      statusFilter,
      locationFilter,
      assignedFilter,
      joinedFrom,
      joinedTo,
    ],
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAgent, setNewAgent] = useState<AgentForm>(emptyAgentForm());
  const [editOpen, setEditOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [editForm, setEditForm] = useState<AgentForm>(emptyAgentForm());

  const allAgents = useMemo(() => agents ?? [], [agents]);
  const statusCounts = useMemo(
    () => ({
      active: allAgents.filter((agent) => agentStatus(agent) === "active").length,
      pending: allAgents.filter((agent) => agentStatus(agent) === "pending").length,
    }),
    [allAgents],
  );

  const filteredAgents = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const location = locationFilter.trim().toLowerCase();
    const from = joinedFrom ? new Date(`${joinedFrom}T00:00:00`).getTime() : null;
    const to = joinedTo ? new Date(`${joinedTo}T23:59:59`).getTime() : null;

    const filtered = allAgents.filter((agent) => {
      const propertiesCount = agent.properties?.length ?? 0;
      const joinedAt = new Date(agent.createdAt).getTime();

      if (statusFilter !== "all" && agentStatus(agent) !== statusFilter) return false;
      if (q && !agentSearchText(agent).includes(q)) return false;
      if (location && !locationLabel(agent).toLowerCase().includes(location)) return false;
      if (assignedFilter === "with" && propertiesCount === 0) return false;
      if (assignedFilter === "without" && propertiesCount > 0) return false;
      if (from != null && joinedAt < from) return false;
      if (to != null && joinedAt > to) return false;

      return true;
    });

    return [...filtered].sort((a, b) => {
      const result = compareAgents(a, b, sort.key);
      return sort.dir === "asc" ? result : -result;
    });
  }, [
    allAgents,
    assignedFilter,
    debouncedSearch,
    joinedFrom,
    joinedTo,
    locationFilter,
    sort.dir,
    sort.key,
    statusFilter,
  ]);

  const pagedAgents = useMemo(
    () => paginateItems(filteredAgents, page, PAGE_SIZE),
    [filteredAgents, page],
  );

  const clearFilters = () => {
    setLocationFilter("");
    setAssignedFilter("all");
    setJoinedFrom("");
    setJoinedTo("");
  };

  const hasActiveFilters =
    locationFilter.trim() !== "" ||
    assignedFilter !== "all" ||
    joinedFrom !== "" ||
    joinedTo !== "";

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

  const agentColumns = useMemo<ColumnDef<Agent, unknown>[]>(
    () => [
      {
        id: "agent",
        header: "Agent Info",
        meta: { sortKey: "agent", className: "min-w-[220px]" },
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{agent.name ?? "—"}</span>
              <div className="mt-0.5 flex items-center text-xs text-muted-foreground">
                <Mail className="mr-1 size-3" />
                {agent.email ?? "—"}
              </div>
              {agent.phone ? (
                <div className="mt-0.5 flex items-center text-xs text-muted-foreground">
                  <Phone className="mr-1 size-3" />
                  {agent.phone}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        id: "properties",
        header: "Properties",
        meta: { sortKey: "properties", className: "min-w-[150px]" },
        cell: ({ row }) => (
          <AgentPropertiesCell properties={row.original.properties ?? []} />
        ),
      },
      {
        id: "location",
        header: "Location",
        meta: { sortKey: "location", className: "min-w-[220px]" },
        cell: ({ row }) => (
          <div className="flex items-center text-muted-foreground">
            <MapPin className="mr-2 size-4 text-primary opacity-50" />
            {locationLabel(row.original)}
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        meta: { sortKey: "status" },
        cell: ({ row }) => (
          <AdminStatusBadge
            status={agentStatus(row.original)}
            options={AGENT_STATUS_OPTIONS}
          />
        ),
      },
      {
        id: "joined",
        header: "Joined",
        meta: { sortKey: "createdAt" },
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {format(new Date(row.original.createdAt), "MMM d, yyyy")}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        meta: { className: "text-right" },
        cell: ({ row }) => {
          const agent = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreVertical className="size-4" />
                  <span className="sr-only">Agent actions</span>
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
                  <Edit2 className="size-3.5" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                  onClick={() => deleteAgent(agent.id)}
                >
                  <Trash2 className="size-3.5" />
                  Delete Agent
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [deleteAgent, openEditDialog],
  );

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

  const addAgentDialog = (
    <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="size-4" />
          Add New Agent
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
              {isCreating && <Loader2 className="mr-2 size-4 animate-spin" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <AdminPageHeader
          title="Agent Management"
          description="Manage your property agents and their account status"
        />
        <div className="sm:pt-0.5">{addAgentDialog}</div>
      </div>

      {isError ? (
        <AdminListError
          title="Could not load agents"
          message={(error as Error)?.message ?? "Please refresh the page or try again."}
        />
      ) : null}

      {isLoading ? (
        <AdminListLoading label="Loading agents…" />
      ) : (
        <div className="w-full space-y-4">
          <AdminToolbar
            statusFilter={{
              value: statusFilter,
              onChange: (value) => setStatusFilter(value as AgentStatusFilter),
              options: AGENT_STATUS_OPTIONS,
              counts: statusCounts,
              totalCount: allAgents.length,
            }}
            search={{
              value: search,
              onChange: setSearch,
              placeholder: "Search name, email, phone, location, or property…",
            }}
            filterSheet={{
              open: filterSheetOpen,
              onOpenChange: setFilterSheetOpen,
              title: "Filters",
              description: "Narrow by location, property assignment, or joined date.",
              hasActiveFilters,
              onClear: clearFilters,
              children: (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="agent-location">Location contains</Label>
                    <Input
                      id="agent-location"
                      placeholder="e.g. Chennai"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assigned properties</Label>
                    <Select
                      value={assignedFilter}
                      onValueChange={(value) =>
                        setAssignedFilter(value as AssignedPropertiesFilter)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All agents" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All agents</SelectItem>
                        <SelectItem value="with">With properties</SelectItem>
                        <SelectItem value="without">Without properties</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-joined-from">Joined from</Label>
                    <Input
                      id="agent-joined-from"
                      type="date"
                      value={joinedFrom}
                      onChange={(e) => setJoinedFrom(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-joined-to">Joined to</Label>
                    <Input
                      id="agent-joined-to"
                      type="date"
                      value={joinedTo}
                      onChange={(e) => setJoinedTo(e.target.value)}
                    />
                  </div>
                </>
              ),
            }}
          />

          {filteredAgents.length === 0 ? (
            <AdminListEmpty
              title="No agents match your filters"
              description="Try All statuses, clearing search, or adjusting filters."
            />
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
              <AdminDataTable
                columns={agentColumns}
                data={pagedAgents.items}
                getRowId={(agent) => String(agent.id)}
                sort={sort}
                onSort={toggleSort}
              />
            </motion.div>
          )}

          <AdminPagination
            page={pagedAgents.page}
            totalPages={pagedAgents.totalPages}
            total={pagedAgents.total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

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
              <span className="font-medium text-foreground">
                {editingAgent?.name ?? "this agent"}
              </span>
              .
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
                {isUpdating && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentManagement;
