// Chart color palette
export const CHART_COLORS = [
  "#667eea",
  "#4fd1c5",
  "#f093fb",
  "#fbbf24",
  "#34d399",
  "#f87171",
  "#a78bfa",
  "#fb923c",
  "#38bdf8",
  "#e879f9",
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
