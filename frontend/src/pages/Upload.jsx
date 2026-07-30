import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
        timeout: 120000, // Increase timeout to 120 seconds for large dataset uploads
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-8"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Dataset Upload</h1>
      </div>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-8 md:p-12 rounded-[2rem] border border-white/10 relative overflow-hidden"
      >
        {/* Decorative background glow */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        <p className="text-white/70 mb-8 text-lg font-medium relative z-10">
          Upload the Kaggle Retail Price Optimization CSV dataset here. The system will automatically validate, clean, and insert the rows into PostgreSQL.
        </p>

        <div className="relative z-10 flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/20 rounded-[2rem] bg-black/20 hover:bg-white/5 transition-all duration-300 group">
          <div className="p-4 bg-brand-500/20 rounded-full mb-6 group-hover:scale-110 transition-transform duration-300">
            <UploadCloud className="w-12 h-12 text-brand-400" />
          </div>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer bg-white/10 text-white px-8 py-3 rounded-xl hover:bg-white/20 transition-all font-bold tracking-wide border border-white/10 shadow-lg hover:shadow-brand-500/20 hover:border-brand-500/50"
          >
            Select CSV File
          </label>
          
          {file && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 text-sm text-brand-300 font-bold bg-brand-500/10 px-4 py-2 rounded-lg border border-brand-500/20"
            >
              Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </motion.p>
          )}
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="p-4 bg-red-500/10 text-red-400 rounded-xl flex items-start gap-3 border border-red-500/20 shadow-lg relative z-10"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-bold">{error}</p>
            </motion.div>
          )}

          {result && (
            <motion.div 
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              className="p-6 bg-green-500/10 text-green-400 rounded-xl flex items-start gap-4 border border-green-500/20 shadow-lg relative z-10"
            >
              <CheckCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-lg mb-2">{result.message}</p>
                <ul className="list-none space-y-2 text-sm text-green-200/80 font-medium">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Total rows processed: <span className="text-white font-bold">{result.total_processed}</span></li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Rows successfully imported: <span className="text-white font-bold">{result.rows_imported}</span></li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-400"></div> Rows skipped (duplicates/errors): <span className="text-white font-bold">{result.rows_skipped}</span></li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-10 flex justify-end relative z-10">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-black tracking-wide text-white transition-all shadow-xl
              ${!file || loading ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/10" : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 border border-green-400/50 hover:shadow-green-500/25 hover:-translate-y-1"}`}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
            {loading ? "Processing Upload..." : "Upload and Import Dataset"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
