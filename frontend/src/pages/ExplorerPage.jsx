import { useState } from "react";
import { useAppContext } from "../components/layout/Layout";
import DataTable from "../components/DataTable";
import { fetchPreview, deleteDataset } from "../utils/api";
import {
  Database,
  Table2,
  Columns3,
  Hash,
  Type,
  Calendar,
  Search,
  Loader2,
  Trash2,
  AlertTriangle,
  X
} from "lucide-react";

export default function ExplorerPage() {
  const { datasets, activeDataset, setActiveDataset, refreshDatasets } =
    useAppContext();
  const [previewData, setPreviewData] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState(null);

  const currentDataset = datasets.find((d) => d.name === activeDataset);

  const getTypeIcon = (type) => {
    const t = type?.toUpperCase() || "";
    if (t.includes("INT") || t.includes("DOUBLE") || t.includes("NUMERIC"))
      return <Hash size={13} className="text-info" />;
    if (t.includes("DATE") || t.includes("TIME"))
      return <Calendar size={13} className="text-success" />;
    return <Type size={13} className="text-primary" />;
  };

  const handlePreview = async () => {
    if (!activeDataset) return;
    setLoadingPreview(true);
    try {
      const result = await fetchPreview(activeDataset, 100);
      if (result.data?.length) {
        setPreviewData(result.data);
      }
    } catch {
      setPreviewData(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const triggerDelete = (e, datasetName) => {
    e.stopPropagation();
    console.log("Triggering delete for:", datasetName);
    setDatasetToDelete(datasetName);
  };

  const confirmDelete = async (e) => {
    if (e) e.stopPropagation();
    if (!datasetToDelete) return;
    setIsDeleting(true);
    try {
      console.log("Confirming delete for:", datasetToDelete);
      await deleteDataset(datasetToDelete);
      await refreshDatasets();
      if (activeDataset === datasetToDelete) {
        setPreviewData(null);
        setActiveDataset(datasets.length > 1 ? datasets.find(d => d.name !== datasetToDelete)?.name : null);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert(`Failed to delete dataset: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setDatasetToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Data Explorer</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Browse datasets, inspect schemas, and preview data
        </p>
      </div>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {datasets.map((ds) => (
          <div
            key={ds.name}
            onClick={() => setActiveDataset(ds.name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveDataset(ds.name);
              }
            }}
            role="button"
            tabIndex={0}
            className={`relative card p-4 text-left transition-all card-hover group ${
              ds.name === activeDataset
                ? "ring-2 ring-primary border-primary"
                : ""
            }`}
          >
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => triggerDelete(e, ds.name)}
                disabled={isDeleting}
                className="p-1.5 bg-error-50 text-error hover:bg-error hover:text-white rounded-md transition-colors"
                title="Delete Dataset"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-3 pr-8">
              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                <Database size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {ds.name}
                </p>
                <p className="text-xs text-text-muted">
                  {ds.row_count?.toLocaleString()} rows
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Columns3 size={12} />
              <span>{ds.columns?.length} columns</span>
            </div>
          </div>
        ))}

        {datasets.length === 0 && (
          <div className="col-span-full card p-8 text-center">
            <Database size={32} className="text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-muted">
              No datasets available. Upload a CSV to get started.
            </p>
          </div>
        )}
      </div>

      {/* Schema Inspector */}
      {currentDataset && (
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface-light">
            <div className="flex items-center gap-2">
              <Table2 size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-text-primary">
                Schema: {currentDataset.name}
              </h2>
            </div>
            <button
              onClick={handlePreview}
              disabled={loadingPreview}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary-dark text-white transition-colors disabled:opacity-50"
            >
              {loadingPreview ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Search size={12} />
              )}
              Preview Data
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Column
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentDataset.columns?.map((col, i) => (
                  <tr
                    key={col.name}
                    className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-2.5 text-text-muted text-xs">
                      {i + 1}
                    </td>
                    <td className="px-5 py-2.5 font-medium text-text-primary">
                      {col.name}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-light text-xs text-text-secondary">
                        {getTypeIcon(col.type)}
                        {col.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {previewData && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-3">
            Data Preview
          </h3>
          <DataTable data={previewData} title={`${activeDataset} preview`} />
        </div>
      )}

      {/* Modern Delete Confirmation Modal */}
      {datasetToDelete && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setDatasetToDelete(null)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-border overflow-hidden animate-fade-in-up flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-error-50 flex items-center justify-center shrink-0 border border-error/10">
                  <AlertTriangle size={20} className="text-error" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary mb-1">Delete Dataset</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    Are you sure you want to delete <span className="font-semibold text-text-primary">"{datasetToDelete}"</span>? This action cannot be undone and will remove all associated data.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-4 bg-surface-light border-t border-border flex justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDatasetToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors border border-transparent hover:border-border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-error hover:bg-red-600 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {isDeleting ? "Deleting..." : "Delete Dataset"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
