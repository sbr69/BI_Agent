import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 15;

function sanitize(value) {
  if (value == null) return "";
  const str = String(value);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function DataTable({ data, title }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);

  const columns = useMemo(() => {
    if (!data?.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleFilter = (key, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(0);
  };

  const processedData = useMemo(() => {
    let result = [...(data || [])];

    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      const lower = value.toLowerCase();
      result = result.filter((row) => {
        const cell = row[key];
        if (cell == null) return false;
        return String(cell).toLowerCase().includes(lower);
      });
    }

    // Apply sort
    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDir === "asc" ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal));
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, filters, sortKey, sortDir]);

  const totalPages = Math.ceil(processedData.length / PAGE_SIZE);
  const pageData = processedData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const activeFilters = Object.keys(filters).length;

  if (!data?.length) return null;

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">
          {title || "Data Table"}
        </h3>
        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span>{processedData.length} of {data.length} rows</span>
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilters({}); setPage(0); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border/50">
        <table className="w-full text-sm">
          <thead>
            {/* Sort headers */}
            <tr className="border-b border-border/50 bg-surface-light/50">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider cursor-pointer select-none hover:text-primary transition-colors whitespace-nowrap"
                >
                  <span className="flex items-center gap-1.5">
                    {sanitize(col)}
                    {sortKey === col ? (
                      sortDir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                    ) : (
                      <ArrowUpDown size={12} className="text-text-muted opacity-40" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
            {/* Filter row */}
            <tr className="border-b border-border/30 bg-surface-light/30">
              {columns.map((col) => (
                <th key={`filter-${col}`} className="px-3 py-2">
                  <div className="relative">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={filters[col] || ""}
                      onChange={(e) => handleFilter(col, e.target.value)}
                      placeholder="Filter..."
                      className="w-full bg-surface border border-border/50 rounded-md pl-6 pr-2 py-1 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary/40 transition-colors min-w-[80px]"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className="border-b border-border/20 hover:bg-surface-light/30 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                    {typeof row[col] === "number"
                      ? row[col].toLocaleString("en-US", { maximumFractionDigits: 2 })
                      : sanitize(row[col])}
                  </td>
                ))}
              </tr>
            ))}
            {pageData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-text-muted">
                  No matching rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-xs text-text-muted">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-light border border-border text-text-secondary hover:border-primary/40 disabled:opacity-30 disabled:hover:border-border transition-colors"
            >
              <ChevronLeft size={13} /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-light border border-border text-text-secondary hover:border-primary/40 disabled:opacity-30 disabled:hover:border-border transition-colors"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
