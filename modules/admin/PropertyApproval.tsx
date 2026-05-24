"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Search,
  Users,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminProperties } from "@/hooks/use-properties";
import { useAgents } from "@/hooks/use-agents";
import { api, type Agent } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  mapBackendProperty,
  PropertyStatus,
  PropertyType,
  type BackendProperty,
} from "@/lib/property-mapper";
import type { Property } from "@/modules/properties/PropertyCard";
import { buildPropertyPath } from "@/lib/property-slug";
import { invalidatePropertyQueries } from "@/lib/invalidate-property-queries";
import { revalidatePropertyListingCache } from "@/lib/server/revalidate-property-cache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type SortKey =
  | "id"
  | "title"
  | "city"
  | "listingType"
  | "propertyType"
  | "price"
  | "bedrooms"
  | "bathrooms"
  | "area";

type StatusTab = "pending" | "approved" | "rejected";

function formatPrice(p: BackendProperty) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: p.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(p.price) || 0);
}

function areaSqFt(p: BackendProperty) {
  return Math.round((Number(p.area) || 0) * 10.7639);
}

function isRentListing(p: BackendProperty) {
  const t = String(p.listingType ?? "").toLowerCase();
  return t === "rent" || t === "lease";
}

function rowStatus(p: BackendProperty) {
  return (p.status ?? PropertyStatus.PENDING) as string;
}

function filterByTab(rows: BackendProperty[], tab: StatusTab) {
  const want =
    tab === "pending"
      ? PropertyStatus.PENDING
      : tab === "approved"
        ? PropertyStatus.APPROVED
        : PropertyStatus.REJECTED;
  return rows.filter((p) => rowStatus(p) === want);
}

function compareRows(a: BackendProperty, b: BackendProperty, key: SortKey, dir: "asc" | "desc") {
  const mul = dir === "asc" ? 1 : -1;
  switch (key) {
    case "id":
      return (a.id - b.id) * mul;
    case "price":
      return ((Number(a.price) || 0) - (Number(b.price) || 0)) * mul;
    case "bedrooms":
      return (
        ((Number(a.bedrooms) || 0) - (Number(b.bedrooms) || 0)) * mul
      );
    case "bathrooms":
      return ((Number(a.bathrooms) || 0) - (Number(b.bathrooms) || 0)) * mul;
    case "area":
      return (areaSqFt(a) - areaSqFt(b)) * mul;
    default: {
      const av = String(
        key === "title"
          ? a.title
          : key === "city"
            ? a.city
            : key === "listingType"
              ? a.listingType
              : key === "propertyType"
                ? a.propertyType
                : "",
      );
      const bv = String(
        key === "title"
          ? b.title
          : key === "city"
            ? b.city
            : key === "listingType"
              ? b.listingType
              : key === "propertyType"
                ? b.propertyType
                : "",
      );
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * mul;
    }
  }
}

function statusBadge(status: string) {
  if (status === PropertyStatus.APPROVED)
    return (
      <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">
        Approved
      </Badge>
    );
  if (status === PropertyStatus.REJECTED)
    return (
      <Badge variant="outline" className="border-red-200 bg-red-50 text-red-800">
        Rejected
      </Badge>
    );
  return (
    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
      Pending
    </Badge>
  );
}

const PROPERTY_TYPE_OPTIONS = ["all", ...Object.values(PropertyType)] as const;

const PropertyApproval = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data: rawRows = [], isLoading, isError, error } = useAdminProperties();
  const { data: agents, isLoading: agentsLoading } = useAgents();
  /** API returns agents as `User[]` in types; runtime matches `Agent`. */
  const agentsList = agents as Agent[] | undefined;
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState<StatusTab>("pending");
  const [search, setSearch] = useState("");
  const [listingFilter, setListingFilter] = useState<"all" | "rent" | "sale">("all");
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "id",
    dir: "desc",
  });

  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const approveIdFromUrl = searchParams.get("approve");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [isApproving, setIsApproving] = useState(false);

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);

  /** All agent-role users from the API; listing assignment does not use legacy agent status. */
  const assignableAgents = agentsList ?? [];

  const setApproveQuery = (id: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("approve", id);
    else params.delete("approve");
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  /** Search + drawer filters only (status tab applied per panel below). */
  const preparedRows = useMemo(() => {
    let rows = rawRows;

    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((p) => {
        const hay = [
          String(p.id),
          p.title,
          p.city,
          p.address,
          p.locality ?? "",
          String(p.listingType ?? ""),
          String(p.propertyType ?? ""),
          String(p.status ?? ""),
          p.assignedAgentId != null ? String(p.assignedAgentId) : "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    if (cityFilter.trim()) {
      const c = cityFilter.trim().toLowerCase();
      rows = rows.filter((p) => (p.city || "").toLowerCase().includes(c));
    }

    if (listingFilter !== "all") {
      rows = rows.filter((p) =>
        listingFilter === "rent" ? isRentListing(p) : !isRentListing(p),
      );
    }

    if (propertyTypeFilter !== "all") {
      rows = rows.filter(
        (p) => String(p.propertyType ?? "").toLowerCase() === propertyTypeFilter.toLowerCase(),
      );
    }

    const min = priceMin.trim() === "" ? null : Number(priceMin);
    const max = priceMax.trim() === "" ? null : Number(priceMax);
    if (min !== null && Number.isFinite(min)) {
      rows = rows.filter((p) => (Number(p.price) || 0) >= min);
    }
    if (max !== null && Number.isFinite(max)) {
      rows = rows.filter((p) => (Number(p.price) || 0) <= max);
    }

    if (agentFilter !== "all") {
      const aid = Number(agentFilter);
      rows = rows.filter((p) => p.assignedAgentId === aid);
    }

    return rows;
  }, [
    rawRows,
    search,
    cityFilter,
    listingFilter,
    propertyTypeFilter,
    priceMin,
    priceMax,
    agentFilter,
  ]);

  const statusCounts = useMemo(() => {
    const pending = preparedRows.filter((p) => rowStatus(p) === PropertyStatus.PENDING).length;
    const approved = preparedRows.filter((p) => rowStatus(p) === PropertyStatus.APPROVED).length;
    const rejected = preparedRows.filter((p) => rowStatus(p) === PropertyStatus.REJECTED).length;
    return { pending, approved, rejected };
  }, [preparedRows]);

  const filteredRows = useMemo(() => {
    const rows = filterByTab(preparedRows, statusFilter);
    const copy = [...rows];
    copy.sort((a, b) => compareRows(a, b, sort.key, sort.dir));
    return copy;
  }, [preparedRows, statusFilter, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sort.key !== column) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 opacity-40" />;
    return sort.dir === "asc" ? (
      <ArrowUp className="ml-1 h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 h-3.5 w-3.5" />
    );
  };

  const clearFilters = () => {
    setCityFilter("");
    setListingFilter("all");
    setPropertyTypeFilter("all");
    setPriceMin("");
    setPriceMax("");
    setAgentFilter("all");
  };

  const hasActiveFilters =
    cityFilter.trim() !== "" ||
    listingFilter !== "all" ||
    propertyTypeFilter !== "all" ||
    priceMin.trim() !== "" ||
    priceMax.trim() !== "" ||
    agentFilter !== "all";

  const openDetail = (p: BackendProperty) => {
    setSelectedProperty(mapBackendProperty(p));
  };

  const openApproveDialog = (id: string) => {
    setSelectedAgentId("");
    setApproveQuery(id);
  };

  const closeApproveDialog = () => {
    setSelectedAgentId("");
    setApproveQuery(null);
  };

  const confirmApprove = async () => {
    if (!approveIdFromUrl) return;
    const assignedAgentId = Number(selectedAgentId);
    if (!Number.isFinite(assignedAgentId) || assignedAgentId <= 0) {
      toast({
        title: "Select an agent",
        description: "Choose who will be the listing agent for this property.",
        variant: "destructive",
      });
      return;
    }
    setIsApproving(true);
    try {
      await api.approveProperty(approveIdFromUrl, { assignedAgentId });
      await revalidatePropertyListingCache(approveIdFromUrl);
      await invalidatePropertyQueries(queryClient, approveIdFromUrl);
      router.refresh();
      toast({ title: "Property approved", description: "Listing agent has been assigned." });
      closeApproveDialog();
    } catch (err) {
      toast({
        title: "Approval failed",
        description: (err as Error)?.message || "Could not approve property.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const confirmApproveSkipAgent = async () => {
    if (!approveIdFromUrl) return;
    setIsApproving(true);
    try {
      await api.approveProperty(approveIdFromUrl, { skipAgentAssignment: true });
      await revalidatePropertyListingCache(approveIdFromUrl);
      await invalidatePropertyQueries(queryClient, approveIdFromUrl);
      router.refresh();
      toast({
        title: "Property approved",
        description: "Approved without assigning a listing agent. You can assign one later.",
      });
      closeApproveDialog();
    } catch (err) {
      toast({
        title: "Approval failed",
        description: (err as Error)?.message || "Could not approve property.",
        variant: "destructive",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const openRejectDialog = (id: string) => {
    setRejectTarget(id);
    setRejectReason("");
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;
    const reason = rejectReason.trim();
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please enter a reason for rejection.",
        variant: "destructive",
      });
      return;
    }
    setIsRejecting(true);
    try {
      await api.rejectProperty(rejectTarget, reason);
      await revalidatePropertyListingCache(rejectTarget);
      await invalidatePropertyQueries(queryClient, rejectTarget);
      router.refresh();
      toast({ title: "Property rejected" });
      setRejectReason("");
      setShowRejectDialog(false);
      setRejectTarget(null);
    } catch (err) {
      toast({
        title: "Rejection failed",
        description: (err as Error)?.message || "Could not reject property.",
        variant: "destructive",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const thumb = (p: BackendProperty) =>
    p.thumbnailUrl ||
    p.propertyImages?.[0] ||
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&q=80";

  const agentLabel = (assignedAgentId?: number | null) => {
    if (assignedAgentId == null) return "—";
    const a = agentsList?.find((x) => x.id === assignedAgentId);
    return a ? `${a.name} (#${assignedAgentId})` : `#${assignedAgentId}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 font-heading text-xl font-bold text-foreground">Property Approvals</h2>
        <p className="text-sm text-muted-foreground">
          Review listings in a sortable table. Use search and the filter drawer to narrow results, then approve with an
          assigned agent (or skip assignment) or reject with a reason.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">{(error as Error)?.message ?? "Could not load properties."}</p>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading listings…
        </div>
      ) : (
        <div className="w-full space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Label className="sr-only">Listing status</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-w-[220px] justify-between gap-2 font-normal"
                  >
                    <span className="flex items-center gap-2 truncate">
                      {statusFilter === "pending" ? (
                        <Clock className="h-4 w-4 shrink-0 opacity-70" />
                      ) : statusFilter === "approved" ? (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <X className="h-4 w-4 shrink-0 text-red-600 opacity-80" />
                      )}
                      <span className="truncate">
                        {statusFilter === "pending" && "Pending"}
                        {statusFilter === "approved" && "Approved"}
                        {statusFilter === "rejected" && "Rejected"}
                        <span className="text-muted-foreground">
                          {" "}
                          (
                          {statusFilter === "pending"
                            ? statusCounts.pending
                            : statusFilter === "approved"
                              ? statusCounts.approved
                              : statusCounts.rejected}
                          )
                        </span>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[min(100vw-2rem,280px)]">
                  <DropdownMenuLabel>Listing status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusTab)}
                  >
                    <DropdownMenuRadioItem value="pending" className="gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      Pending
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {statusCounts.pending}
                      </span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="approved" className="gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      Approved
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {statusCounts.approved}
                      </span>
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rejected" className="gap-2">
                      <X className="h-3.5 w-3.5 text-red-600" />
                      Rejected
                      <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                        {statusCounts.rejected}
                      </span>
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex w-full min-w-0 flex-1 gap-2 sm:max-w-md lg:max-w-lg">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search ID, title, city, address, type, agent id…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                  <SheetTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      Filter
                      {hasActiveFilters ? (
                        <Badge variant="secondary" className="px-1.5 py-0 text-xs">
                          On
                        </Badge>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
                    <SheetHeader className="text-left">
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow by city, listing type, property type, price range, or assigned agent.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-1 flex-col gap-4 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="ap-city">City contains</Label>
                        <Input
                          id="ap-city"
                          placeholder="e.g. Mumbai"
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Listing</Label>
                        <Select
                          value={listingFilter}
                          onValueChange={(v) => setListingFilter(v as "all" | "rent" | "sale")}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="rent">Rent / lease</SelectItem>
                            <SelectItem value="sale">Sale</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Property type</Label>
                        <Select value={propertyTypeFilter} onValueChange={setPropertyTypeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="All types" />
                          </SelectTrigger>
                          <SelectContent>
                            {PROPERTY_TYPE_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt === "all" ? "All types" : opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ap-min">Min price (INR)</Label>
                        <Input
                          id="ap-min"
                          inputMode="numeric"
                          placeholder="No minimum"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ap-max">Max price (INR)</Label>
                        <Input
                          id="ap-max"
                          inputMode="numeric"
                          placeholder="No maximum"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Listing agent</Label>
                        <Select value={agentFilter} onValueChange={setAgentFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Any agent" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Any</SelectItem>
                            {(agentsList ?? []).map((a) => (
                              <SelectItem key={a.id} value={String(a.id)}>
                                {a.name} (#{a.id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <SheetFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                      {hasActiveFilters ? (
                        <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : null}
                      <Button type="button" className="w-full sm:w-auto" onClick={() => setFilterSheetOpen(false)}>
                        Done
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
                {hasActiveFilters ? (
                  <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
              <Clock className="mx-auto mb-3 h-10 w-10 opacity-50" />
              <p className="font-medium text-foreground">
                No {statusFilter} listings match your filters
              </p>
              <p className="mt-1 text-sm">Try clearing search or filters.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-md border bg-card"
            >
              <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[72px]" />
                        <TableHead className="w-[72px]">
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("id")}
                          >
                            ID
                            <SortIcon column="id" />
                          </button>
                        </TableHead>
                        <TableHead className="min-w-[140px]">
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("title")}
                          >
                            Title
                            <SortIcon column="title" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("city")}
                          >
                            City
                            <SortIcon column="city" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("listingType")}
                          >
                            Listing
                            <SortIcon column="listingType" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("propertyType")}
                          >
                            Type
                            <SortIcon column="propertyType" />
                          </button>
                        </TableHead>
                        <TableHead>
                          <button
                            type="button"
                            className="inline-flex items-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("price")}
                          >
                            Price
                            <SortIcon column="price" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-center">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("bedrooms")}
                          >
                            Beds
                            <SortIcon column="bedrooms" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden sm:table-cell text-center">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center font-medium hover:text-foreground"
                            onClick={() => toggleSort("bathrooms")}
                          >
                            Baths
                            <SortIcon column="bathrooms" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden xl:table-cell text-right">
                          <button
                            type="button"
                            className="inline-flex w-full items-center justify-end font-medium hover:text-foreground"
                            onClick={() => toggleSort("area")}
                          >
                            Area
                            <SortIcon column="area" />
                          </button>
                        </TableHead>
                        <TableHead className="hidden lg:table-cell">Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="w-[72px] p-2 align-middle">
                            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <Image
                                src={thumb(p)}
                                alt={p.title || "Property"}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                          <TableCell className="max-w-[200px] truncate font-medium" title={p.title}>
                            {p.title || "—"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">{p.city || "—"}</TableCell>
                          <TableCell className="text-xs">{isRentListing(p) ? "Rent" : "Sale"}</TableCell>
                          <TableCell className="hidden lg:table-cell text-xs">
                            {String(p.propertyType ?? "—")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm">{formatPrice(p)}</TableCell>
                          <TableCell className="hidden sm:table-cell text-center text-sm">
                            {Number(p.bedrooms) || "—"}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-center text-sm">
                            {Number(p.bathrooms) || "—"}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell text-right text-xs text-muted-foreground">
                            {areaSqFt(p).toLocaleString("en-IN")} sq.ft
                          </TableCell>
                          <TableCell className="hidden lg:table-cell max-w-[140px] truncate text-xs text-muted-foreground">
                            {agentLabel(p.assignedAgentId)}
                          </TableCell>
                          <TableCell>{statusBadge(rowStatus(p))}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                type="button"
                                onClick={() => openDetail(p)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                <Link href={buildPropertyPath(p.id, p.title)} title="Public page">
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                              {statusFilter === "pending" && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      type="button"
                                      title="More actions"
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                      <span className="sr-only">More actions</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                      className="gap-2 text-emerald-700 focus:text-emerald-700"
                                      onClick={() => openApproveDialog(String(p.id))}
                                    >
                                      <Check className="h-4 w-4" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 text-destructive focus:text-destructive"
                                      onClick={() => openRejectDialog(String(p.id))}
                                    >
                                      <X className="h-4 w-4" />
                                      Reject
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
            </motion.div>
          )}
        </div>
      )}

      <Dialog open={!!selectedProperty} onOpenChange={() => setSelectedProperty(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedProperty?.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Listing preview: beds, baths, area, status, owner, and price.
            </DialogDescription>
          </DialogHeader>
          {selectedProperty && (
            <div className="space-y-4">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-muted">
                {selectedProperty.image ? (
                  <Image
                    src={selectedProperty.image}
                    alt={selectedProperty.title}
                    fill
                    sizes="(max-width: 512px) 100vw, 512px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.bedrooms} Bed</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.bathrooms} Bath</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium">{selectedProperty.area}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-foreground">Status</p>
                <p className="text-sm text-muted-foreground">{selectedProperty.status || "Pending"}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner: {selectedProperty.ownerName || "Unknown"}</span>
                <span className="font-semibold text-foreground">{selectedProperty.price}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!approveIdFromUrl}
        onOpenChange={(open) => {
          if (!open) closeApproveDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Assign listing agent
            </DialogTitle>
            <DialogDescription>
              Choose an agent to manage this listing after approval. They will receive leads and enquiries for this
              property.
            </DialogDescription>
          </DialogHeader>
          {agentsLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading agents…
            </div>
          ) : assignableAgents.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              No agents available. Add agents under <strong>Agent Management</strong> first.
            </p>
          ) : (
            <div className="space-y-3">
              <Label>Listing agent</Label>
              <ScrollArea className="h-[min(280px,40vh)] rounded-md border border-border p-3">
                <RadioGroup value={selectedAgentId} onValueChange={setSelectedAgentId} className="gap-3">
                  {assignableAgents.map((agent) => (
                    <label
                      key={agent.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-transparent p-2 hover:bg-muted/50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
                    >
                      <RadioGroupItem value={String(agent.id)} id={`agent-${agent.id}`} className="mt-1" />
                      <div className="min-w-0 flex-1 text-sm">
                        <span className="font-medium text-foreground">{agent.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{agent.email}</span>
                        {agent.locationCity ? (
                          <span className="text-xs text-muted-foreground">{agent.locationCity}</span>
                        ) : null}
                      </div>
                    </label>
                  ))}
                </RadioGroup>
              </ScrollArea>
            </div>
          )}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" type="button" onClick={closeApproveDialog} disabled={isApproving}>
              Cancel
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={isApproving}
              onClick={() => void confirmApproveSkipAgent()}
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Skip assignment
            </Button>
            <Button
              type="button"
              disabled={isApproving || assignableAgents.length === 0}
              onClick={() => void confirmApprove()}
            >
              {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Approve & assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showRejectDialog}
        onOpenChange={(open) => {
          setShowRejectDialog(open);
          if (!open) {
            setRejectTarget(null);
            setRejectReason("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject property</DialogTitle>
            <DialogDescription>
              Provide a reason for the owner or agent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this listing cannot be approved…"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setShowRejectDialog(false)} disabled={isRejecting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={isRejecting} onClick={() => void confirmReject()}>
              {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PropertyApproval;
