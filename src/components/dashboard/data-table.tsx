"use client";

import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./empty-state";

export type { ColumnDef } from "@tanstack/react-table";

/**
 * Sortable, searchable, paginated table on TanStack Table.
 * - `toolbar` renders next to the search box (filters, buttons).
 * - `onRowClick` makes rows clickable (keyboard too).
 * - Columns can set `meta: { className }` to style both th and td (e.g. hide on mobile).
 */
export function DataTable<T>({
  columns,
  data,
  searchPlaceholder = "Search…",
  toolbar,
  pageSize = 10,
  onRowClick,
  empty,
  initialSorting = [],
  className,
  hideSearch,
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  empty?: { title: string; description?: string; image?: string };
  initialSorting?: SortingState;
  className?: string;
  hideSearch?: boolean;
}) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className={cn("rounded-2xl border border-border bg-surface shadow-soft", className)}>
      {(!hideSearch || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          {!hideSearch && (
            <label className="relative block flex-1 sm:max-w-xs">
              <span className="sr-only">{searchPlaceholder}</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={globalFilter}
                onChange={(e) => {
                  setGlobalFilter(e.target.value);
                  table.setPageIndex(0);
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-full border border-border bg-background pl-9 pr-4 text-sm focus-visible:border-brand-500 focus-visible:outline-none"
              />
            </label>
          )}
          {toolbar && <div className="flex flex-wrap items-center gap-2 sm:ml-auto">{toolbar}</div>}
        </div>
      )}

      <div className="relative overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  const meta = header.column.columnDef.meta as { className?: string } | undefined;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : undefined}
                      className={cn("whitespace-nowrap px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground", meta?.className)}
                    >
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : dir === "desc" ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-40" aria-hidden />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row.original);
                        }
                      }
                    : undefined
                }
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  "border-b border-border last:border-b-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none",
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { className?: string } | undefined;
                  return (
                    <td key={cell.id} className={cn("px-4 py-3 align-middle", meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <EmptyState
            compact
            image={empty?.image ?? "/images/dashboard/empty-search.png"}
            title={empty?.title ?? (globalFilter ? "No matches" : "Nothing here yet")}
            description={empty?.description ?? (globalFilter ? `Nothing matches "${globalFilter}".` : undefined)}
          />
        )}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
          <p className="text-muted-foreground tabular-nums">
            {from}–{to} of {total}
          </p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="grid size-9 place-items-center rounded-full border border-border hover:bg-muted disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
