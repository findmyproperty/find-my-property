"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { type ReactNode } from "react"

import { DataTableSkeleton } from "@/components/skeletons/data-table-skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type AdminSortState<TKey extends string> = {
  key: TKey
  dir: "asc" | "desc"
}

declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className?: string
    sortKey?: string
    headerClassName?: string
  }
}

type AdminDataTableProps<TData, TSortKey extends string = string> = {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  getRowId?: (row: TData) => string
  sort?: AdminSortState<TSortKey>
  onSort?: (key: TSortKey) => void
  emptyMessage?: ReactNode
  className?: string
  onRowClick?: (row: TData) => void
  isLoading?: boolean
}

export function AdminSortableHeader<TKey extends string>({
  label,
  column,
  sort,
  onSort,
  className,
}: {
  label: ReactNode
  column: TKey
  sort: AdminSortState<TKey>
  onSort: (key: TKey) => void
  className?: string
}) {
  const isActive = sort.key === column

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center font-medium hover:text-foreground",
        className,
      )}
      onClick={() => onSort(column)}
    >
      {label}
      {isActive ? (
        sort.dir === "asc" ? (
          <ArrowUp className="ml-1 size-3.5" aria-hidden />
        ) : (
          <ArrowDown className="ml-1 size-3.5" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="ml-1 size-3.5 opacity-40" aria-hidden />
      )}
    </button>
  )
}

function headerAlignmentClass(className?: string) {
  if (!className) return undefined
  if (className.includes("text-right")) return "w-full justify-end"
  if (className.includes("text-center")) return "justify-center"
  return undefined
}

export function AdminDataTable<TData, TSortKey extends string = string>({
  columns,
  data,
  getRowId,
  sort,
  onSort,
  emptyMessage = "No results.",
  className,
  onRowClick,
  isLoading = false,
}: AdminDataTableProps<TData, TSortKey>) {
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table's useReactTable is flagged by React Compiler; safe here.
  const table = useReactTable({
    data: isLoading ? [] : data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: getRowId ? (originalRow) => getRowId(originalRow) : undefined,
  })

  if (isLoading) {
    return (
      <div className={cn("overflow-hidden rounded-md border bg-card", className)}>
        <DataTableSkeleton columns={columns.length} />
      </div>
    )
  }

  return (
    <div className={cn("overflow-hidden rounded-md border bg-card", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta
                const headClass = meta?.headerClassName ?? meta?.className
                const sortKey = meta?.sortKey as TSortKey | undefined
                const label = header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())

                return (
                  <TableHead key={header.id} className={headClass}>
                    {sortKey && sort && onSort ? (
                      <AdminSortableHeader
                        label={label ?? header.column.id}
                        column={sortKey}
                        sort={sort}
                        onSort={onSort}
                        className={headerAlignmentClass(headClass)}
                      />
                    ) : (
                      label
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={onRowClick ? "cursor-pointer" : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn("align-middle", cell.column.columnDef.meta?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center italic text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
