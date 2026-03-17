import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, Check, X } from "lucide-react";
import { uploadCSV } from "../utils/api";

export default function FileUpload({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = async (file) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only CSV files are supported");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await uploadCSV(file);
      setResult(res);
      if (onUploadSuccess) onUploadSuccess(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const dismiss = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`card p-8 cursor-pointer transition-all duration-300 text-center border-2 border-dashed ${
          isDragging
            ? "border-primary bg-primary-50 scale-[1.01]"
            : "border-border hover:border-primary-200"
        } ${uploading ? "opacity-60 pointer-events-none" : ""}`}
        id="file-upload"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          className="hidden"
        />
        <Upload size={32} className={`mx-auto mb-3 ${isDragging ? "text-primary" : "text-text-muted"} transition-colors`} />
        <p className="text-sm font-medium text-text-secondary mb-1">
          {uploading ? "Uploading..." : "Drop a CSV file here or click to browse"}
        </p>
        <p className="text-xs text-text-muted">
          Upload your own dataset and start querying instantly
        </p>
      </div>

      {/* Success */}
      {result && (
        <div className="mt-3 card p-4 animate-fade-in-up border-success/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet size={18} className="text-success" />
              <div>
                <p className="text-sm font-medium text-success">{result.message}</p>
                <p className="text-xs text-text-muted mt-0.5">
                  {result.columns?.length} columns • {result.row_count?.toLocaleString()} rows
                </p>
              </div>
            </div>
            <button onClick={dismiss} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-3 card p-4 animate-fade-in-up border-error/30">
          <div className="flex items-center justify-between">
            <p className="text-sm text-error">{error}</p>
            <button onClick={dismiss} className="text-text-muted hover:text-text-primary">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
