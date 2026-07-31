import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  BarChart2,
  UploadCloud,
  Users,
  Database,
  Tag,
  Layers,
  RefreshCw,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Send,
  Lock,
} from "lucide-react";
import api from "../services/api";
import { getUser } from "../utils/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  n != null ? new Intl.NumberFormat("en-IN").format(Math.round(n)) : "—";

const fmtPrice = (n) =>
  n != null
    ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}`
    : "—";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const today = () =>
  new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// ─── Small reusable card ──────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`ent-panel ${className}`}>
    {children}
  </div>
);

// ─── KPI card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, icon: Icon, color = "#3b82f6" }) => (
  <Card className="p-4 flex flex-col gap-3">
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center"
      style={{ background: `${color}1A` }}
    >
      <Icon className="w-4 h-4" style={{ color }} />
    </div>
    <div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs font-medium text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </Card>
);

// ─── Quick nav card ───────────────────────────────────────────────────────────
const NavCard = ({ to, icon: Icon, label, desc, color = "#3b82f6", allowed }) => {
  if (!allowed) return null;
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 p-3.5 bg-[#1F2937] rounded-xl border border-[#374151] hover:border-[#4B5563] hover:bg-[#374151]/30 transition-all"
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}1A` }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-100">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-500 transition-colors flex-shrink-0" />
    </Link>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const user = getUser();
  const role = user?.role_name;
  const isViewer = role === "Viewer";
  const isAdmin = role === "Admin";
  const isPricingManager = role === "Pricing Manager";
  const isAnalyst = role === "Business Analyst";

  const [summary, setSummary] = useState(null);
  const [latestUpload, setLatestUpload] = useState(null);
  const [loading, setLoading] = useState(!isViewer);
  const [error, setError] = useState(null);

  // Viewer request state
  const [requestSent, setRequestSent] = useState(false);
  const [requestedRole, setRequestedRole] = useState("Pricing Manager");

  useEffect(() => {
    if (!isViewer) fetchData();
  }, [isViewer]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, uploadRes] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/upload-history"),
      ]);
      setSummary(summaryRes.data);
      if (uploadRes.data?.length > 0) setLatestUpload(uploadRes.data[0]);
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <p className="text-sm font-medium text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto mt-16">
        <Card className="p-6 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-semibold text-red-400">{error}</p>
          <button onClick={fetchData} className="ent-btn-primary text-xs">
            Retry
          </button>
        </Card>
      </div>
    );
  }

  // ── Viewer ─────────────────────────────────────────────────────────────────
  if (isViewer) {
    return (
      <div className="w-full max-w-md mx-auto pt-16 px-4">
        <Card className="p-8 flex flex-col items-center text-center gap-5">
          <div className="w-12 h-12 rounded-full bg-[#374151] flex items-center justify-center">
            <Lock className="w-5 h-5 text-gray-300" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white mb-1">Welcome to PricePilot AI</h1>
            <p className="text-sm text-gray-400">
              Your account has a <strong>Viewer</strong> role. Request access from the Admin to use the platform.
            </p>
          </div>
          {!requestSent ? (
            <div className="w-full max-w-xs">
              <label className="block text-left text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Request Role
              </label>
              <select
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="ent-input w-full mb-3"
              >
                <option value="Pricing Manager">Pricing Manager</option>
                <option value="Business Analyst">Business Analyst</option>
              </select>
              <button
                onClick={() => setRequestSent(true)}
                className="ent-btn-primary w-full flex items-center justify-center gap-2"
              >
                Submit Request <Send className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="w-full max-w-xs p-4 rounded-lg flex flex-col items-center gap-2 bg-green-500/10 border border-green-500/20">
              <CheckCircle className="w-7 h-7 text-green-500" />
              <p className="text-sm font-semibold text-green-400">Request Submitted</p>
              <p className="text-xs text-gray-400 text-center">Your Admin will assign your role.</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ── Main dashboard ─────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1200px] mx-auto pb-10">

      {/* ── 1. Welcome Header ─────────────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Retail Pricing Management Dashboard</h1>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#374151] bg-[#1F2937] text-xs font-medium text-gray-300 hover:bg-[#374151]/50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── 2. Quick KPIs ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Dataset Overview</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Total Records" value={fmt(summary?.total_products)} sub="Historical rows" icon={Database} color="#3b82f6" />
          <KpiCard label="Categories" value={fmt(summary?.total_categories)} sub="Product categories" icon={Layers} color="#8b5cf6" />
          <KpiCard label="Brands" value={fmt(summary?.total_brands)} sub="Unique brands" icon={Tag} color="#0ea5e9" />
          <KpiCard label="Avg Price" value={fmtPrice(summary?.average_price)} sub="Portfolio average" icon={TrendingUp} color="#22c55e" />
          <KpiCard label="Avg Discount" value={summary?.average_discount != null ? `${Number(summary.average_discount).toFixed(1)}%` : "—"} sub="Across records" icon={Package} color="#f59e0b" />
          <KpiCard label="Total Inventory" value={fmt(summary?.total_inventory)} sub="Units in stock" icon={Package} color="#a855f7" />
        </div>
      </div>


    </div>
  );
}
