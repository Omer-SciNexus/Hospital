"use client";

import { cn } from "@/lib/utils";

/** Compact money: $1.2M, $84K, $940. */
export function money(n: number, digits = 1) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(digits)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}K`;
  if (abs >= 1000) return `$${(n / 1000).toFixed(digits)}K`;
  return `$${Math.round(n)}`;
}

/** Compact count: 12.4K, 980. */
export function compact(n: number) {
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

export const number = (n: number) => n.toLocaleString("en-US");

/** Legend row: a colored key beside text-colored labels (never colored text). */
export function ChartLegend({
  items,
  className,
}: {
  items: { label: string; color: string; dashed?: boolean; value?: string }[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          {i.dashed ? (
            <span aria-hidden className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: i.color }} />
          ) : (
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          )}
          <span>{i.label}</span>
          {i.value && <span className="font-semibold text-foreground tabular-nums">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/**
 * Wraps a chart: the visual is hidden from screen readers (role="img" with a
 * one-line summary) and the numbers are read from a visually hidden table.
 */
export function ChartFigure({
  summary,
  height = 260,
  table,
  children,
  className,
}: {
  summary: string;
  height?: number;
  table?: { caption: string; head: string[]; rows: (string | number)[][] };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <figure className={cn("m-0", className)}>
      <div role="img" aria-label={summary} style={{ height }} className="w-full min-w-0">
        {children}
      </div>
      {table && (
        <div className="sr-only">
          <table>
            <caption>{table.caption}</caption>
            <thead>
              <tr>
                {table.head.map((h) => (
                  <th key={h} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{c}</td>))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
