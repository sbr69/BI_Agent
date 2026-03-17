// Chart color palette (orange-first for brand consistency)
export const CHART_COLORS = [
  "#F97316",
  "#3B82F6",
  "#22C55E",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F59E0B",
  "#6366F1",
  "#EF4444",
  "#06B6D4",
];

/**
 * Transform grouped data for Recharts line/bar charts.
 * Converts [{month: "Jan", category: "A", value: 10}, ...] into
 * [{month: "Jan", A: 10, B: 20}, ...] for Recharts multi-series.
 */
export function pivotData(data, xKey, yKey, groupBy) {
  if (!groupBy || !data.length) return data;

  const grouped = {};
  const allGroups = new Set();

  data.forEach((row) => {
    const xVal = row[xKey];
    const groupVal = row[groupBy];
    const yVal = row[yKey] ?? row[Object.keys(row).find(k => k !== xKey && k !== groupBy)];

    allGroups.add(groupVal);

    if (!grouped[xVal]) {
      grouped[xVal] = { [xKey]: xVal };
    }
    grouped[xVal][groupVal] = yVal;
  });

  return {
    pivotedData: Object.values(grouped),
    groups: Array.from(allGroups),
  };
}

/**
 * Format large numbers for display (e.g., 1,234,567.89 → $1.23M)
 */
export function formatValue(value) {
  if (typeof value !== "number") return value;
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format number with commas
 */
export function formatNumber(value) {
  if (typeof value !== "number") return value;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
