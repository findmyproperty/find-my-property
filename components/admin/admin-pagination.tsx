"use client"

import { Button } from "@/components/ui/button"

type AdminPaginationProps = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  isFetching?: boolean
}

export function AdminPagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  isFetching = false,
}: AdminPaginationProps) {
  if (total <= pageSize) return null

  return (
    <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <span className="text-muted-foreground">
        Page {page} of {totalPages} · {total.toLocaleString("en-IN")} total
        {isFetching ? " · Refreshing…" : null}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
