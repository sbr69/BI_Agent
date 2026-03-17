import { useAppContext } from "../components/layout/Layout";
import FileUpload from "../components/FileUpload";
import {
  Upload,
  FileSpreadsheet,
  Database,
  CheckCircle2,
} from "lucide-react";

export default function UploadPage() {
  const { datasets, setActiveDataset, refreshDatasets } = useAppContext();

  const handleUploadSuccess = (result) => {
    if (result.table_name) {
      setActiveDataset(result.table_name);
    }
    refreshDatasets();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Upload Data</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Import CSV files to start analyzing with AI
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Area */}
        <div className="lg:col-span-2">
          <FileUpload onUploadSuccess={handleUploadSuccess} />

          {/* Instructions */}
          <div className="card p-5 mt-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3">
              Upload Guidelines
            </h3>
            <ul className="space-y-2">
              {[
                "CSV files up to 50MB supported",
                "First row should contain column headers",
                "Data types are automatically detected (text, number, date)",
                "Table name is derived from the file name",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <CheckCircle2
                    size={14}
                    className="text-success shrink-0 mt-0.5"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Existing Datasets */}
        <div className="card p-5 h-fit">
          <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <Database size={14} className="text-primary" />
            Available Datasets
          </h3>
          {datasets.length === 0 ? (
            <p className="text-sm text-text-muted">No datasets yet.</p>
          ) : (
            <div className="space-y-2">
              {datasets.map((ds) => (
                <div
                  key={ds.name}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-light"
                >
                  <FileSpreadsheet
                    size={16}
                    className="text-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {ds.name}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {ds.row_count?.toLocaleString()} rows &middot;{" "}
                      {ds.columns?.length} cols
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
