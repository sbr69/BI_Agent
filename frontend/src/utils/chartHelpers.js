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

export function parseNumberField(val) {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const parsed = parseFloat(String(val).replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? 0 : parsed;
}

export function parseChartData(data, yKeys) {
  if (!data || !data.length) return [];
  return data.map((row) => {
    const newRow = { ...row };
    if (yKeys && yKeys.length > 0) {
      yKeys.forEach((k) => {
        if (newRow[k] != null) {
          newRow[k] = parseNumberField(newRow[k]);
        }
      });
    } else {
      Object.keys(newRow).forEach((k) => {
        const val = newRow[k];
        if (typeof val === "string") {
          const stripped = val.replace(/[^0-9.-]+/g, "");
          if (stripped !== "" && !isNaN(stripped)) {
            newRow[k] = parseFloat(stripped);
          }
        }
      });
    }
    return newRow;
  });
}

export function pivotData(data, xKey, yKey, groupBy) {
  if (!groupBy || !data.length) return data;

  const grouped = {};
  const allGroups = new Set();

  data.forEach((row) => {
    const xVal = row[xKey];
    const groupVal = row[groupBy];
    const rawYVal = row[yKey] ?? row[Object.keys(row).find((k) => k !== xKey && k !== groupBy)];
    const yVal = parseNumberField(rawYVal);

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

export function formatNumber(value) {
  if (typeof value !== "number") return value;
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}
