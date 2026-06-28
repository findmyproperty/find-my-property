"use client";

import { useEffect, useState } from "react";
import type { AdminSortState } from "@/components/admin/admin-data-table";

export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}

export function useAdminListControls<TKey extends string>(options: {
  defaultSort: AdminSortState<TKey>;
  resetPageDeps?: readonly unknown[];
  pageSize?: number;
}) {
  const { defaultSort, resetPageDeps = [], pageSize = 20 } = options;
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [sort, setSort] = useState(defaultSort);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies filter deps
  }, [debouncedSearch, ...resetPageDeps]);

  const toggleSort = (key: TKey) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );
    setPage(1);
  };

  return {
    page,
    setPage,
    pageSize,
    search,
    setSearch,
    debouncedSearch,
    sort,
    setSort,
    toggleSort,
    filterSheetOpen,
    setFilterSheetOpen,
  };
}

export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): { items: T[]; total: number; totalPages: number; page: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
  };
}

export function compareStrings(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function compareDates(a: string | Date, b: string | Date): number {
  return new Date(a).getTime() - new Date(b).getTime();
}
