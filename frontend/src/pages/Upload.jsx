import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import api from "../services/api";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith(".csv")) {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/products/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setResult(response.data);
      
      // Automatic redirect after short delay for better UX
      setTimeout(() => {
        navigate("/products", { state: { uploadSuccess: response.data } });
      }, 2500);

    } catch (err) {
      setError(err.response?.data?.detail || "An error occurred during upload.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Dataset Upload</h1>
      
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
        <p className="text-gray-600 mb-6">
          Upload the Kaggle Retail Price Optimization CSV dataset here. The system will automatically validate, clean, and insert the rows into PostgreSQL.
        </p>

        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
          <UploadCloud className="w-16 h-16 text-blue-500 mb-4" />
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Select CSV File
          </label>
          
          {file && (
            <p className="mt-4 text-sm text-gray-700 font-medium">
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-3 border border-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg flex items-start gap-3 border border-green-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-lg">{result.message}</p>
              <ul className="mt-2 list-disc list-inside text-sm space-y-1">
                <li>Total rows processed: {result.total_processed}</li>
                <li>Rows successfully imported: {result.rows_imported}</li>
                <li>Rows skipped (duplicates or errors): {result.rows_skipped}</li>
              </ul>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition-all
              ${!file || loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 shadow-md"}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {loading ? "Processing..." : "Upload and Import Dataset"}
          </button>
        </div>
      </div>
    </div>
  );
}
