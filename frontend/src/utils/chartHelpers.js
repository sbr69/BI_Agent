// Fallback hex values matching index.css --color-chart-* tokens.
// At runtime we try to read the CSS custom properties so chart colors
// stay in sync with the theme; the fallbacks are used during SSR or
// if the DOM isn't ready yet.
const FALLBACK_COLORS = [
  "#F97316", "#3B82F6", "#22C55E", "#8B5CF6", "#EC4899",
  "#14B8A6", "#F59E0B", "#6366F1", "#EF4444", "#06B6D4",
];

function readCSSChartColors() {
  if (typeof document === "undefined") return FALLBACK_COLORS;
  const style = getComputedStyle(document.documentElement);
  const colors = [];
  for (let i = 1; i <= 8; i++) {
    const v = style.getPropertyValue(`--color-chart-${i}`).trim();
    if (v) colors.push(v);
  }
  // Append extra fallbacks so we always have at least 10 entries
  return colors.length > 0
    ? [...colors, ...FALLBACK_COLORS.slice(colors.length)]
    : FALLBACK_COLORS;
}

// Lazy-initialised: resolved once on first access then cached.
let _resolved = null;
export const CHART_COLORS = new Proxy(FALLBACK_COLORS, {
  get(target, prop) {
    if (!_resolved) _resolved = readCSSChartColors();
    if (prop === "length") return _resolved.length;
    if (typeof prop === "string" && !isNaN(prop)) return _resolved[Number(prop)];
    if (prop === Symbol.iterator) return () => _resolved[Symbol.iterator]();
    return Reflect.get(_resolved, prop);
  },
});

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
