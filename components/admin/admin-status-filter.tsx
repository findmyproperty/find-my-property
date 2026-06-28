"use client"

import { ChevronDown, ListFilter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  getAdminStatusStyle,
  type AdminStatusOption,
} from "@/lib/admin/status-config"

type AdminStatusFilterProps = {
  value: string
  onChange: (value: string) => void
  options: readonly AdminStatusOption[]
  counts?: Partial<Record<string, number>>
  totalCount?: number
  label?: string
  className?: string
}

export function AdminStatusFilter({
  value,
  onChange,
  options,
  counts,
  totalCount,
  label = "Status",
  className,
}: AdminStatusFilterProps) {
  const selectedMeta =
    value === "all"
      ? { label: "All statuses", className: "" }
      : getAdminStatusStyle(options, value)

  const displayCount =
    value === "all"
      ? (totalCount ??
        Object.values(counts ?? {}).reduce<number>(
          (sum, n) => sum + (n ?? 0),
          0,
        ))
      : counts?.[value]

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <Label className="sr-only">{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="min-w-[220px] justify-between gap-2 font-normal"
          >
            <span className="flex min-w-0 items-center gap-2 truncate">
              <ListFilter className="size-4 shrink-0 opacity-70" aria-hidden />
              <span className="truncate">
                {selectedMeta.label}
                {displayCount != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    ({displayCount.toLocaleString("en-IN")})
                  </span>
                ) : null}
              </span>
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[min(100vw-2rem,300px)]">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
            <DropdownMenuRadioItem value="all" className="gap-2">
              All statuses
              {totalCount != null ? (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {totalCount.toLocaleString("en-IN")}
                </span>
              ) : null}
            </DropdownMenuRadioItem>
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option.value}
                value={option.value}
                className="gap-2 capitalize"
              >
                {option.label}
                {counts?.[option.value] != null ? (
                  <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                    {counts[option.value]!.toLocaleString("en-IN")}
                  </span>
                ) : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
