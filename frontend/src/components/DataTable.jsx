import { useState, useMemo } from "react";
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, X,
  ChevronLeft, ChevronRight, EyeOff, Eye, Download,
} from "lucide-react";
import { exportChartCSV } from "../utils/api";

const PAGE_SIZE = 15;

export default function DataTable({ data, title }) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [hiddenCols, setHiddenCols] = useState(new Set());
  const [showColPicker, setShowColPicker] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [colOrder, setColOrder] = useState([]);

  const allColumns = useMemo(() => {
    if (!data?.length) return [];
    return Object.keys(data[0]);
  }, [data]);

  const columns = useMemo(() => {
    const activeCols = colOrder.length ? colOrder : allColumns;
    return activeCols.filter((c) => !hiddenCols.has(c));
  }, [allColumns, hiddenCols, colOrder]);

  const moveColumn = (index, direction) => {
    setColOrder((prev) => {
      const next = [...(prev.length ? prev : allColumns)];
      if (direction === -1 && index > 0) {
        [next[index - 1], next[index]] = [next[index], next[index - 1]];
      } else if (direction === 1 && index < next.length - 1) {
        [next[index], next[index + 1]] = [next[index + 1], next[index]];
      }
      return next;
    });
  };

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

  const toggleColumn = (col) => {
    setHiddenCols((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        if (allColumns.length - next.size > 1) {
          next.add(col);
        }
      }
      return next;
    });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportData = data.map((row) => {
        const filtered = {};
        columns.forEach((col) => { filtered[col] = row[col]; });
        return filtered;
      });
      await exportChartCSV(exportData, title || "table_export");
    } catch { /* ignore */ }
    setExporting(false);
  };

  const processedData = useMemo(() => {
    let result = [...(data || [])];
    for (const [key, value] of Object.entries(filters)) {
      const lower = value.toLowerCase();
      result = result.filter((row) => {
        const cell = row[key];
        if (cell == null) return false;
        return String(cell).toLowerCase().includes(lower);
      });
    }
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
    <div className="animate-fade-in-up overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          {title || "Data Table"}
        </h3>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{processedData.length} of {data.length} rows</span>
          {activeFilters > 0 && (
            <button
              onClick={() => { setFilters({}); setPage(0); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <X size={12} /> Clear filters
            </button>
          )}
          {/* Column picker toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-colors ${
                hiddenCols.size > 0
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-text-muted hover:text-text-secondary"
              }`}
              title="Show/hide columns"
            >
              {hiddenCols.size > 0 ? <EyeOff size={12} /> : <Eye size={12} />}
              Columns
            </button>
            {showColPicker && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-border rounded-lg shadow-lg py-1 z-50 max-h-64 overflow-y-auto animate-fade-in">
                {allColumns.map((col) => (
                  <label
                    key={col}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-hover cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCols.has(col)}
                      onChange={() => toggleColumn(col)}
                      className="rounded border-border"
                    />
                    <span className="truncate">{col}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {/* Export CSV */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
            title="Download CSV"
          >
            <Download size={12} />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-light">
              {columns.map((col, index) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider select-none hover:text-primary transition-colors whitespace-nowrap group"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 cursor-pointer" onClick={() => handleSort(col)}>
                      {col}
                      {sortKey === col ? (
                        sortDir === "asc" ? <ArrowUp size={12} className="text-primary" /> : <ArrowDown size={12} className="text-primary" />
                      ) : (
                        <ArrowUpDown size={12} className="text-text-muted opacity-40" />
                      )}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveColumn(colOrder.indexOf(col), -1); }} 
                        disabled={index === 0}
                        className="p-1 hover:bg-surface-hover rounded disabled:opacity-30"
                      >
                        <ChevronLeft size={12} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); moveColumn(colOrder.indexOf(col), 1); }} 
                        disabled={index === columns.length - 1}
                        className="p-1 hover:bg-surface-hover rounded disabled:opacity-30"
                      >
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
            <tr className="border-b border-border bg-surface-light/50">
              {columns.map((col) => (
                <th key={`filter-${col}`} className="px-3 py-2">
                  <div className="relative">
                    <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      value={filters[col] || ""}
                      onChange={(e) => handleFilter(col, e.target.value)}
                      placeholder="Filter..."
                      className="w-full bg-white border border-border rounded-md pl-6 pr-2 py-1 text-xs text-text-primary placeholder-text-muted outline-none focus:border-primary/40 transition-colors min-w-[80px]"
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
                className="border-b border-border hover:bg-surface-hover transition-colors"
              >
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2.5 text-text-secondary whitespace-nowrap">
                    {typeof row[col] === "number"
                      ? row[col].toLocaleString("en-US", { maximumFractionDigits: 2 })
                      : row[col]}
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
          <span>Page {page + 1} of {totalPages}</span>
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
