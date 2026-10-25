/**
 * Chart palette for Recharts. Uses CSS variables so charts follow light/dark
 * theme. Series order: teal, blue, coral, violet, green, amber.
 */
export const chartColors = {
  teal: "#0ea5a4",
  blue: "#2563eb",
  coral: "#f97316",
  violet: "#8b5cf6",
  green: "#16a34a",
  amber: "#f59e0b",
  red: "#dc2626",
} as const;

export const chartSeries = [chartColors.teal, chartColors.blue, chartColors.coral, chartColors.violet, chartColors.green, chartColors.amber];

/** Shared props for axes, grid and tooltip so every chart looks the same. */
export const chartTheme = {
  grid: { stroke: "var(--border)", vertical: false },
  axis: { stroke: "var(--muted-foreground)", fontSize: 12, tickLine: false, axisLine: false },
  tooltip: {
    contentStyle: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "0 8px 24px -8px rgb(15 42 46 / 0.2)",
      color: "var(--foreground)",
      fontSize: 12,
    },
    labelStyle: { color: "var(--foreground)", fontWeight: 700 },
    cursor: { fill: "var(--muted)", opacity: 0.5 },
  },
} as const;
