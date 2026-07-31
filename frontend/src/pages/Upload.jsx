import React, { useState } from "react";
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith(".csv")) {
      setFile(f);
      setUploadError(null);
    } else {
      setFile(null);
      setUploadError("Please select a valid .csv file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setUploadError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/products/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setResult(response.data);
      setFile(null);
    } catch (err) {
      setUploadError(err.response?.data?.detail || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[800px] mx-auto pb-12">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-50">Upload Dataset</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          Import CSV pricing records into the system database.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="ent-panel p-8">
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            Upload the Kaggle Retail Pricing CSV dataset. The system will
            validate, clean, and insert new rows into PostgreSQL. Duplicate
            rows are automatically skipped.
          </p>

          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-[#374151] rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all"
          >
            <UploadCloud className="w-10 h-10 text-gray-500 mb-4" />
            <p className="text-base font-semibold text-gray-300">
              {file ? file.name : "Click to select a CSV file"}
            </p>
            {file && (
              <p className="text-sm text-gray-500 mt-2">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {uploadError && (
            <div className="flex items-start gap-2 p-4 mt-6 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm font-medium text-red-400">{uploadError}</p>
            </div>
          )}

          {result && (
            <div className="p-5 mt-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-base font-bold text-green-400">{result.message}</p>
              </div>
              <div className="text-sm text-green-500/80 space-y-1">
                <p>Total processed: <strong className="text-green-400">{result.total_processed}</strong></p>
                <p>Imported: <strong className="text-green-400">{result.rows_imported}</strong></p>
                <p>Skipped: <strong className="text-green-400">{result.rows_skipped}</strong></p>
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white transition-all ${
              !file || loading
                ? "bg-[#374151] text-gray-500 cursor-not-allowed border border-[#4B5563]"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
            {loading ? "Processing..." : "Upload and Import"}
          </button>
        </div>

        <div className="ent-panel p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            Expected CSV Format
          </p>
          <div className="flex flex-wrap gap-2">
            {["product_id", "brand", "category", "region", "channel", "season", "current_price", "base_price", "discount_pct", "units_sold", "revenue", "inventory_level", "demand_index", "promotion_type", "date"].map((col) => (
              <span key={col} className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#111827] text-gray-400 border border-[#374151]">
                {col}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
