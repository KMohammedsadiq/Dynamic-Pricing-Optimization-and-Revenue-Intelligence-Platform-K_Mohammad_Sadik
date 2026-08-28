import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, DollarSign, Package, ShieldAlert,
  Target, BarChart3, ArrowUpRight, ArrowDownRight, Minus,
  RefreshCw, Printer, AlertTriangle, CheckCircle, Info,
  ChevronRight, Award, Activity, Users, Zap, Globe
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechTooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";
import api from "../services/api";

const fmtINR = (n) => n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";
const fmtPct = (n) => n != null ? `${Number(n).toFixed(1)}%` : "—";
const fmt    = (n) => n != null ? new Intl.NumberFormat("en-IN").format(Math.round(n)) : "—";

const STRAT_COLORS = {
  "CONSIDER PRICE INCREASE": "#22c55e",
  "CONSIDER PRICE DECREASE": "#ef4444",
  "PROTECT MARGIN":          "#a855f7",
  "MAINTAIN PRICE":          "#9ca3af",
  "MONITOR MARKET":          "#3b82f6",
};
const RISK_COLORS = {
  "High Risk": "#ef4444", "At Risk": "#f97316", "Healthy": "#22c55e",
  "High Margin": "#3b82f6", "Zero Profit": "#9ca3af", "Negative Profit": "#dc2626",
  "Insufficient Data": "#6b7280",
};
const SEVERITY_STYLE = {
  Critical:    { bg: "bg-red-950/60",    border: "border-red-700",    text: "text-red-400",    badge: "bg-red-700/30 text-red-300" },
  High:        { bg: "bg-orange-950/60", border: "border-orange-700", text: "text-orange-400", badge: "bg-orange-700/30 text-orange-300" },
  Medium:      { bg: "bg-yellow-950/60", border: "border-yellow-700", text: "text-yellow-400", badge: "bg-yellow-700/30 text-yellow-300" },
  Opportunity: { bg: "bg-green-950/60",  border: "border-green-700",  text: "text-green-400",  badge: "bg-green-700/30 text-green-300" },
  Low:         { bg: "bg-gray-900/60",   border: "border-gray-700",   text: "text-gray-400",   badge: "bg-gray-700/30 text-gray-300" },
};

function KpiCard({ label, value, sub, accent }) {
  const colors = {
    blue: "border-l-blue-500", green: "border-l-green-500", red: "border-l-red-500",
    purple: "border-l-purple-500", amber: "border-l-amber-500", gray: "border-l-gray-400",
  };
  return (
    <div className={`bg-[#111827] border border-[#374151] rounded-lg p-4 border-l-4 ${colors[accent] || colors.blue}`}>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-50 truncate">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle, linkTo, linkLabel }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5 text-blue-400" />
        <div>
          <h2 className="text-base font-bold text-gray-50">{title}</h2>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {linkTo && (
        <button
          onClick={() => navigate(linkTo)}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          {linkLabel} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function AttentionItem({ item }) {
  const navigate = useNavigate();
  const s = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.Low;
  return (
    <div className={`${s.bg} border ${s.border} rounded-lg p-4 flex items-start gap-3`}>
      <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.text}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${s.badge}`}>{item.severity}</span>
          <span className="text-[10px] text-gray-500 font-medium">{item.category}</span>
        </div>
        <p className="text-sm font-bold text-gray-100">{item.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
      </div>
      {item.link && (
        <button
          onClick={() => navigate(item.link)}
          className="flex-shrink-0 text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          {item.link_label} <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

const PRINT_STYLES = `
@media print {
  .no-print { display: none !important; }
  
  /* Force all layout wrappers to grow infinitely instead of scrolling */
  html, body, #root, .min-h-screen, .h-screen, .flex-1, main, div {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    position: static !important;
  }

  body { background: white !important; color: #111 !important; }
  .print-section { page-break-inside: avoid; margin-bottom: 24px; }
  .ent-panel, [class*="bg-["] { background: white !important; border-color: #ccc !important; }
  .text-gray-50, .text-gray-100 { color: #111 !important; }
  .text-gray-400, .text-gray-500 { color: #555 !important; }
  h1, h2 { color: #111 !important; }
}
`;

export default function ExecutiveBi() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const printRef = useRef();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await api.get("/analytics/executive-summary");
      setData(res.data);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load executive summary.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const styleEl = document.createElement("style");
    styleEl.textContent = PRINT_STYLES;
    document.head.appendChild(styleEl);
    window.print();
    setTimeout(() => document.head.removeChild(styleEl), 1000);
  };

  if (loading) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 py-32">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      <span className="font-bold text-lg tracking-wide">Generating Executive Report...</span>
      <span className="text-sm text-gray-500">Aggregating all modules — this may take a moment</span>
    </div>
  );

  if (error) return (
    <div className="w-full h-full flex flex-col items-center justify-center text-red-400 gap-3 py-32">
      <AlertTriangle className="w-8 h-8" />
      <span className="font-bold">Failed to load Executive Summary</span>
      <span className="text-xs text-gray-500">{error}</span>
      <button onClick={fetchData} className="ent-btn-primary mt-2">Retry</button>
    </div>
  );

  if (!data) return null;

  const ov  = data.overview || {};
  const risk = data.risk || {};
  const insights = data.insights || {};
  const market = data.market || {};
  const stratDist = data.strategy_distribution || {};
  const topPerf = data.top_performers || {};
  const attention = data.management_attention || [];
  const summary = data.executive_summary_text || "";
  const activeCats = data.active_categories || [];

  const mktPos = market.position || {};
  const movement = market.price_movement || {};
  const amzMov = movement.Amazon || {};
  const fkMov  = movement.Flipkart || {};

  const stratChartData = Object.entries(stratDist).map(([k, v]) => ({
    name: k.replace("CONSIDER ", "").replace(" PRICE", "→"),
    count: v.count, pct: v.pct, fill: STRAT_COLORS[k],
  }));

  const riskChartData = Object.entries(risk)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k, value: v, fill: RISK_COLORS[k] }));

  const catGpChart = (topPerf.top_categories_gp || []).map(c => ({
    name: c.category, gp: Math.round(c.gross_profit / 1e6), rev: Math.round(c.revenue / 1e6),
  }));

  const totalAnalyzed = ov.total_analyzed || 0;
  const mktAligned = mktPos.near || 0;
  const increaseOpps = stratDist["CONSIDER PRICE INCREASE"]?.count || 0;
  const decreaseOpps = stratDist["CONSIDER PRICE DECREASE"]?.count || 0;
  const atRiskProds = (risk["High Risk"] || 0) + (risk["At Risk"] || 0);

  return (
    <div ref={printRef} className="max-w-screen-xl mx-auto space-y-8">
      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-black text-gray-50">Executive Business Intelligence</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Comprehensive management overview — all modules aggregated
            {lastRefresh && ` · Refreshed ${lastRefresh.toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={fetchData} className="ent-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={handlePrint} className="ent-btn-primary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      {/* ── 1. EXECUTIVE SUMMARY TEXT ─────────────────────────────────── */}
      <div className="print-section ent-panel p-6 border-l-4 border-l-blue-500">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-gray-50">Executive Summary</h2>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
      </div>

      {/* ── 2. KPI OVERVIEW ───────────────────────────────────────────── */}
      <div className="print-section">
        <SectionHeader icon={DollarSign} title="Financial KPI Overview" subtitle="From Profitability Analytics" linkTo="/analytics" linkLabel="Open Analytics" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <KpiCard label="Total Revenue"       value={fmtINR(ov.total_revenue)} accent="blue" />
          <KpiCard label="Total COGS"          value={fmtINR(ov.total_cogs)}    accent="red"  />
          <KpiCard label="Gross Profit"        value={fmtINR(ov.gross_profit)}  accent="green" />
          <KpiCard label="Avg Profit Margin"   value={fmtPct(ov.avg_margin)}    accent="purple" />
          <KpiCard label="Units Sold"          value={fmt(ov.units_sold)}        accent="blue" />
          <KpiCard label="Products in Catalog"  value={fmt(totalAnalyzed)}        accent="gray"  sub={`${fmt(ov.total_analyzed - (risk["Insufficient Data"] || 0))} with financial history`} />
          <KpiCard label="Profitability Rate"  value={fmtPct(ov.profitability_rate)} accent="green" sub="Products with positive gross profit" />
          <KpiCard label="At-Risk Products"    value={fmt(atRiskProds)} accent="red" sub="Margin below 15%" />
          <KpiCard label="Near-Market Products" value={fmt(mktAligned)}  accent="blue" sub="Within ±3% of market average" />
          <KpiCard label="Increase Opps"       value={fmt(increaseOpps)} accent="green" sub="Strategy: Consider increase" />
          <KpiCard label="Decrease Opps"       value={fmt(decreaseOpps)} accent="amber" sub="Strategy: Consider decrease" />
          <KpiCard label="Revenue / Unit"      value={fmtINR(ov.asp)}    accent="purple" />
        </div>
      </div>

      {/* ── 3. FINANCIAL PERFORMANCE ──────────────────────────────────── */}
      <div className="print-section ent-panel p-5">
        <SectionHeader icon={BarChart3} title="Financial Performance by Category" subtitle="Top categories by gross profit (₹M = millions)" linkTo="/analytics" linkLabel="Full Analytics" />
        {catGpChart.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catGpChart} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}M`} />
                <RechTooltip
                  contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                  labelStyle={{ color: "#f9fafb" }}
                  formatter={(v, n) => [`₹${v}M`, n === "gp" ? "Gross Profit" : "Revenue"]}
                />
                <Legend />
                <Bar dataKey="rev" name="Revenue (₹M)"      fill="#3b82f6" radius={[3,3,0,0]} />
                <Bar dataKey="gp"  name="Gross Profit (₹M)" fill="#22c55e" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="text-gray-500 text-sm">No category financial data available.</p>}

        {/* Category table */}
        <div className="overflow-x-auto border border-[#374151] rounded-lg mt-4">
          <table className="w-full text-left text-sm">
            <thead className="ent-table-header">
              <tr>
                {["Category","Revenue","COGS","Gross Profit","Margin %","Contribution"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-xs font-bold text-gray-300 uppercase tracking-wider text-right first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#374151]">
              {(topPerf.top_categories_gp || []).map((c, i) => (
                <tr key={i} className="ent-table-row">
                  <td className="px-4 py-2.5 font-bold text-gray-50">{c.category}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{fmtINR(c.revenue)}</td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(c.cogs)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-green-400">{fmtINR(c.gross_profit)}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtPct(c.margin_pct)}</td>
                  <td className="px-4 py-2.5 text-right text-blue-400">{fmtPct(c.profit_contribution_pct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 4. MARKET INTELLIGENCE SUMMARY ───────────────────────────── */}
      <div className="print-section ent-panel p-5">
        <SectionHeader icon={Globe} title="Market Intelligence Summary" subtitle="Competitor &amp; market positioning" linkTo="/competitors" linkLabel="Full Competitor Analysis" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Below Market</p>
            <p className="text-3xl font-black text-green-400">{mktPos.cheaper ?? "—"}</p>
            <p className="text-[10px] text-gray-500 mt-1">{`>3% below avg`}</p>
          </div>
          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Near Market</p>
            <p className="text-3xl font-black text-blue-400">{mktPos.near ?? "—"}</p>
            <p className="text-[10px] text-gray-500 mt-1">Within ±3%</p>
          </div>
          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Above Market</p>
            <p className="text-3xl font-black text-red-400">{mktPos.expensive ?? "—"}</p>
            <p className="text-[10px] text-gray-500 mt-1">{`>3% above avg`}</p>
          </div>
          <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Avg Market Gap</p>
            <p className="text-3xl font-black text-purple-400">{market.avg_gap_pct != null ? `${market.avg_gap_pct > 0 ? "+" : ""}${market.avg_gap_pct?.toFixed(1)}%` : "—"}</p>
            <p className="text-[10px] text-gray-500 mt-1">Our price vs market</p>
          </div>
        </div>

        {/* Competitor movement — show actual coverage clearly */}
        <h3 className="text-sm font-bold text-gray-300 mb-1">Competitor Price Movement</h3>
        <p className="text-xs text-gray-500 mb-3">
          Based on products with 2+ price observations.
          {(() => {
            const amzInsuf = amzMov.insufficient ?? 0;
            const fkpInsuf = fkMov.insufficient ?? 0;
            const amzWith = (amzMov.increased ?? 0) + (amzMov.decreased ?? 0) + (amzMov.unchanged ?? 0);
            const fkpWith = (fkMov.increased ?? 0) + (fkMov.decreased ?? 0) + (fkMov.unchanged ?? 0);
            if (amzInsuf > 0 || fkpInsuf > 0) {
              return ` Amazon: ${amzWith} products with movement data, ${amzInsuf} with single observation only. Flipkart: ${fkpWith} products with movement data, ${fkpInsuf} with single observation only.`;
            }
            return null;
          })()}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[{ name: "Amazon", data: amzMov }, { name: "Flipkart", data: fkMov }].map(({ name, data: mov }) => {
            const withHistory = (mov.increased ?? 0) + (mov.decreased ?? 0) + (mov.unchanged ?? 0);
            const insufficient = mov.insufficient ?? 0;
            return (
              <div key={name} className="bg-[#111827] border border-[#374151] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-400 uppercase">{name}</p>
                  <span className="text-[10px] text-gray-500">{withHistory} with movement history</span>
                </div>
                {withHistory > 0 ? (
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 text-center">
                      <ArrowUpRight className="w-5 h-5 text-green-400 mx-auto mb-1" />
                      <p className="text-xl font-black text-green-400">{mov.increased ?? 0}</p>
                      <p className="text-[10px] text-gray-500">Increasing</p>
                    </div>
                    <div className="flex-1 text-center">
                      <Minus className="w-5 h-5 text-gray-400 mx-auto mb-1" />
                      <p className="text-xl font-black text-gray-300">{mov.unchanged ?? 0}</p>
                      <p className="text-[10px] text-gray-500">Stable</p>
                    </div>
                    <div className="flex-1 text-center">
                      <ArrowDownRight className="w-5 h-5 text-red-400 mx-auto mb-1" />
                      <p className="text-xl font-black text-red-400">{mov.decreased ?? 0}</p>
                      <p className="text-[10px] text-gray-500">Decreasing</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">No movement data available.</p>
                )}
                {insufficient > 0 && (
                  <div className="flex items-center gap-2 bg-[#1f2937] rounded px-3 py-1.5 border border-[#374151]">
                    <Info className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    <p className="text-[10px] text-gray-500">{insufficient} products have only one price observation — movement cannot be determined</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 5. PRICING STRATEGY DISTRIBUTION ─────────────────────────── */}
      <div className="print-section ent-panel p-5">
        <SectionHeader icon={Target} title="Pricing Strategy Distribution" subtitle={`All ${totalAnalyzed} catalog products evaluated`} linkTo="/revenue-optimization" linkLabel="Full Strategy View" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stratChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, pct }) => `${pct}%`} labelLine={false}>
                  {stratChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <RechTooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} formatter={(v, n) => [v, n]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {Object.entries(stratDist).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: STRAT_COLORS[k] }} />
                <div className="flex-1 text-sm text-gray-300 truncate">{k}</div>
                <span className="font-black text-gray-50">{v.count}</span>
                <span className="text-xs text-gray-500 w-12 text-right">{v.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 6. PROFITABILITY RISK SUMMARY ────────────────────────────── */}
      <div className="print-section ent-panel p-5">
        <SectionHeader icon={ShieldAlert} title="Profitability Risk Distribution" subtitle="Risk classification from Profitability Analytics" linkTo="/analytics" linkLabel="Full Analytics" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${value}`} labelLine>
                  {riskChartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <RechTooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {Object.entries(risk).map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: RISK_COLORS[k] }} />
                <div className="flex-1 text-sm text-gray-300">{k}</div>
                <span className="font-black text-gray-50">{v}</span>
                <span className="text-xs text-gray-500 w-12 text-right">
                  {totalAnalyzed > 0 ? `${((v / totalAnalyzed) * 100).toFixed(0)}%` : "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 7. TOP / BOTTOM PERFORMERS ───────────────────────────────── */}
      <div className="print-section">
        <SectionHeader icon={Award} title="Top & Bottom Performers" subtitle="Derived from Profitability Analytics — real database products" linkTo="/analytics" linkLabel="Full Analytics" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Top by Gross Profit */}
          <div className="ent-panel p-4">
            <h3 className="text-sm font-bold text-green-400 mb-3">Top 5 by Gross Profit</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-500 uppercase border-b border-[#374151]">
                  <th className="pb-2 text-left font-bold">Product</th>
                  <th className="pb-2 text-right font-bold">Category</th>
                  <th className="pb-2 text-right font-bold">Gross Profit</th>
                  <th className="pb-2 text-right font-bold">Margin</th>
                </tr></thead>
                <tbody className="divide-y divide-[#374151]/60">
                  {(topPerf.by_gross_profit || []).map((p, i) => (
                    <tr key={i} className="hover:bg-[#111827]/50">
                      <td className="py-2 font-bold text-blue-400">{p.product_id}</td>
                      <td className="py-2 text-right text-gray-400 text-xs">{p.category}</td>
                      <td className="py-2 text-right font-bold text-green-400">{fmtINR(p.gross_profit)}</td>
                      <td className="py-2 text-right text-gray-300">{fmtPct(p.profit_margin_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top by Revenue */}
          <div className="ent-panel p-4">
            <h3 className="text-sm font-bold text-blue-400 mb-3">Top 5 by Revenue</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-500 uppercase border-b border-[#374151]">
                  <th className="pb-2 text-left font-bold">Product</th>
                  <th className="pb-2 text-right font-bold">Category</th>
                  <th className="pb-2 text-right font-bold">Revenue</th>
                  <th className="pb-2 text-right font-bold">Margin</th>
                </tr></thead>
                <tbody className="divide-y divide-[#374151]/60">
                  {(topPerf.by_revenue || []).map((p, i) => (
                    <tr key={i} className="hover:bg-[#111827]/50">
                      <td className="py-2 font-bold text-blue-400">{p.product_id}</td>
                      <td className="py-2 text-right text-gray-400 text-xs">{p.category}</td>
                      <td className="py-2 text-right font-bold text-blue-400">{fmtINR(p.revenue)}</td>
                      <td className="py-2 text-right text-gray-300">{fmtPct(p.profit_margin_pct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lowest Margin */}
          <div className="ent-panel p-4">
            <h3 className="text-sm font-bold text-red-400 mb-3">Lowest Margin Products (Attention Required)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-500 uppercase border-b border-[#374151]">
                  <th className="pb-2 text-left font-bold">Product</th>
                  <th className="pb-2 text-right font-bold">Category</th>
                  <th className="pb-2 text-right font-bold">Margin</th>
                  <th className="pb-2 text-right font-bold">Revenue</th>
                </tr></thead>
                <tbody className="divide-y divide-[#374151]/60">
                  {(topPerf.lowest_margin || []).map((p, i) => (
                    <tr key={i} className="hover:bg-[#111827]/50">
                      <td className="py-2 font-bold text-blue-400">{p.product_id}</td>
                      <td className="py-2 text-right text-gray-400 text-xs">{p.category}</td>
                      <td className="py-2 text-right font-bold text-red-400">{fmtPct(p.profit_margin_pct)}</td>
                      <td className="py-2 text-right text-gray-300">{fmtINR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Highest Margin */}
          <div className="ent-panel p-4">
            <h3 className="text-sm font-bold text-purple-400 mb-3">Highest Margin Products</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs text-gray-500 uppercase border-b border-[#374151]">
                  <th className="pb-2 text-left font-bold">Product</th>
                  <th className="pb-2 text-right font-bold">Category</th>
                  <th className="pb-2 text-right font-bold">Margin</th>
                  <th className="pb-2 text-right font-bold">Revenue</th>
                </tr></thead>
                <tbody className="divide-y divide-[#374151]/60">
                  {(topPerf.highest_margin || []).map((p, i) => (
                    <tr key={i} className="hover:bg-[#111827]/50">
                      <td className="py-2 font-bold text-blue-400">{p.product_id}</td>
                      <td className="py-2 text-right text-gray-400 text-xs">{p.category}</td>
                      <td className="py-2 text-right font-bold text-purple-400">{fmtPct(p.profit_margin_pct)}</td>
                      <td className="py-2 text-right text-gray-300">{fmtINR(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 8. MANAGEMENT ATTENTION ───────────────────────────────────── */}
      <div className="print-section">
        <SectionHeader icon={AlertTriangle} title="Management Attention Required" subtitle="Issues and opportunities backed by real data — no fabricated conclusions" />
        {attention.length > 0 ? (
          <div className="space-y-3">
            {attention.map((item, i) => <AttentionItem key={i} item={item} />)}
          </div>
        ) : (
          <div className="ent-panel p-6 text-center text-green-400 flex flex-col items-center gap-2">
            <CheckCircle className="w-8 h-8" />
            <p className="font-bold">No critical issues identified.</p>
            <p className="text-sm text-gray-400">All metrics are within acceptable thresholds.</p>
          </div>
        )}
      </div>

      {/* ── DRILL-DOWN NAVIGATION ────────────────────────────────────── */}
      <div className="print-section no-print ent-panel p-5">
        <h2 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Navigate to Detailed Modules</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Profitability Analytics", sub: "Margin risk, product/category detail", path: "/analytics", icon: BarChart3, color: "border-t-green-500" },
            { label: "Competitor Analysis", sub: "Market position, pricing gaps", path: "/competitors", icon: Globe, color: "border-t-blue-500" },
            { label: "Pricing Strategy", sub: "Strategy recommendations", path: "/revenue-optimization", icon: Target, color: "border-t-purple-500" },
            { label: "Demand Forecasting", sub: "ML demand trends", path: "/forecasts", icon: TrendingUp, color: "border-t-amber-500" },
          ].map(({ label, sub, path, icon: Icon, color }) => (
            <button key={path} onClick={() => navigate(path)}
              className={`ent-panel p-4 border-t-2 ${color} text-left hover:bg-[#374151]/40 transition-colors`}>
              <Icon className="w-5 h-5 text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-100">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── REPORT FOOTER (print only) ───────────────────────────────── */}
      <div className="hidden print:block text-xs text-gray-500 border-t border-[#374151] pt-4 mt-4">
        <p>PricePilot Executive Business Intelligence Report</p>
        <p>Generated: {new Date().toLocaleString()} — All values from live database. TEST_HISTORICAL records excluded.</p>
      </div>
    </div>
  );
}
