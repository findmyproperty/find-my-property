"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"
import {
  AdminListEmpty,
  AdminListError,
  AdminListLoading,
} from "@/components/admin/admin-list-states"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminPagination } from "@/components/admin/admin-pagination"

export type AdminListPagePagination = {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  isFetching?: boolean
}

type AdminListPageProps = {
  title: string
  description?: string
  headerAction?: ReactNode
  isLoading?: boolean
  loadingLabel?: string
  isError?: boolean
  error?: unknown
  errorTitle?: string
  toolbar?: ReactNode
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  pagination?: AdminListPagePagination
  animateTable?: boolean
  /** When true, omits the page title block (e.g. inside a tabbed hub). */
  hideHeader?: boolean
  children?: ReactNode
  footer?: ReactNode
}

export function AdminListPage({
  title,
  description,
  headerAction,
  isLoading = false,
  loadingLabel = "Loading…",
  isError = false,
  error,
  errorTitle = "Could not load data",
  toolbar,
  isEmpty = false,
  emptyTitle = "No results match your filters",
  emptyDescription = "Try clearing search or adjusting filters.",
  pagination,
  animateTable = true,
  hideHeader = false,
  children,
  footer,
}: AdminListPageProps) {
  const tableContent =
    isEmpty || !children ? null : animateTable ? (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {children}
      </motion.div>
    ) : (
      children
    )

  return (
    <div className="space-y-6">
      {hideHeader ? (
        headerAction ? (
          <div className="flex justify-end">{headerAction}</div>
        ) : null
      ) : headerAction ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <AdminPageHeader title={title} description={description} />
          <div className="sm:pt-0.5">{headerAction}</div>
        </div>
      ) : (
        <AdminPageHeader title={title} description={description} />
      )}

      {isError ? (
        <AdminListError
          title={errorTitle}
          message={(error as Error)?.message ?? "Please refresh the page or try again."}
        />
      ) : null}

      {isLoading ? (
        <AdminListLoading label={loadingLabel} />
      ) : (
        <div className="w-full space-y-4">
          {toolbar}

          {isEmpty ? (
            <AdminListEmpty title={emptyTitle} description={emptyDescription} />
          ) : (
            tableContent
          )}

          {pagination ? (
            <AdminPagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              pageSize={pagination.pageSize}
              onPageChange={pagination.onPageChange}
              isFetching={pagination.isFetching}
            />
          ) : null}

          {footer}
        </div>
      )}
    </div>
  )
}
