"use client";

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const VIRTUAL_LIST_PAGE_SIZE = 20;

function getOffsetWithinScrollParent(
  child: HTMLElement,
  scrollParent: HTMLElement,
): number {
  let top = 0;
  let node: HTMLElement | null = child;

  while (node && node !== scrollParent) {
    top += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent || !scrollParent.contains(parent)) {
      const scrollRect = scrollParent.getBoundingClientRect();
      const childRect = child.getBoundingClientRect();
      return childRect.top - scrollRect.top + scrollParent.scrollTop;
    }
    node = parent;
  }

  return top;
}

type VirtualInfiniteListProps<T> = {
  items: T[];
  totalCount?: number;
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  getItemKey: (item: T, index: number) => string | number;
  estimateSize?: number;
  emptyLabel: string;
  loadingLabel: string;
  endLabel?: string;
  className?: string;
  /** When set, list virtualizes against this parent scroll container (no nested scroll). */
  scrollElementRef?: RefObject<HTMLElement | null>;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VirtualInfiniteList<T>({
  items,
  totalCount,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  getItemKey,
  estimateSize = 128,
  emptyLabel,
  loadingLabel,
  endLabel = "End of list",
  className,
  scrollElementRef,
  renderItem,
}: VirtualInfiniteListProps<T>) {
  const internalScrollRef = useRef<HTMLDivElement>(null);
  const listAnchorRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const usesExternalScroll = Boolean(scrollElementRef);
  const rowCount = hasNextPage ? items.length + 1 : items.length;

  useEffect(() => {
    if (!usesExternalScroll || !scrollElementRef?.current || !listAnchorRef.current) {
      return;
    }

    const scrollElement = scrollElementRef.current;
    const anchorElement = listAnchorRef.current;

    const updateScrollMargin = () => {
      setScrollMargin(getOffsetWithinScrollParent(anchorElement, scrollElement));
    };

    updateScrollMargin();

    const resizeObserver = new ResizeObserver(updateScrollMargin);
    resizeObserver.observe(scrollElement);
    resizeObserver.observe(anchorElement);

    return () => resizeObserver.disconnect();
  }, [usesExternalScroll, scrollElementRef, items.length, isLoading]);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () =>
      scrollElementRef?.current ?? internalScrollRef.current,
    estimateSize: () => estimateSize,
    overscan: 6,
    scrollMargin: usesExternalScroll ? scrollMargin : 0,
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? -1;

  useEffect(() => {
    if (lastVisibleIndex < 0) return;
    if (lastVisibleIndex >= items.length - 1 && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [lastVisibleIndex, items.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 p-6 text-sm text-muted-foreground",
          className,
        )}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        {loadingLabel}
      </div>
    );
  }

  if (!items.length) {
    return (
      <p
        className={cn(
          "rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyLabel}
      </p>
    );
  }

  const listBody = (
    <div
      ref={listContainerRef}
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {virtualItems.map((virtualRow) => {
        const isLoaderRow = virtualRow.index >= items.length;
        const item = items[virtualRow.index];
        const translateY = usesExternalScroll
          ? virtualRow.start - scrollMargin
          : virtualRow.start;

        return (
          <div
            key={isLoaderRow ? "loader-row" : getItemKey(item, virtualRow.index)}
            ref={virtualizer.measureElement}
            data-index={virtualRow.index}
            className="absolute left-0 top-0 w-full pb-3"
            style={{ transform: `translateY(${translateY}px)` }}
          >
            {isLoaderRow ? (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading more...
              </div>
            ) : (
              renderItem(item, virtualRow.index)
            )}
          </div>
        );
      })}
    </div>
  );

  if (usesExternalScroll) {
    return (
      <div ref={listAnchorRef} className={cn("flex flex-col gap-2", className)}>
        {typeof totalCount === "number" ? (
          <p className="shrink-0 text-xs text-muted-foreground">
            Showing {items.length} of {totalCount}
          </p>
        ) : null}
        <div className="rounded-lg border border-border/60 bg-muted/10 p-2">{listBody}</div>
        {!hasNextPage ? (
          <p className="shrink-0 text-center text-xs text-muted-foreground">{endLabel}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-2", className)}>
      {typeof totalCount === "number" ? (
        <p className="shrink-0 text-xs text-muted-foreground">
          Showing {items.length} of {totalCount}
        </p>
      ) : null}
      <div
        ref={internalScrollRef}
        className="min-h-[min(52vh,520px)] flex-1 overflow-auto scroll-smooth rounded-lg border border-border/60 bg-muted/10 p-2"
      >
        {listBody}
      </div>
      {!hasNextPage ? (
        <p className="shrink-0 text-center text-xs text-muted-foreground">{endLabel}</p>
      ) : null}
    </div>
  );
}
