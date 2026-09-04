import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, Box, Layers, LineChart, Lightbulb, RefreshCw, 
  Search, Filter, ChevronLeft, ChevronRight, X, DollarSign, Package, AlertTriangle, ShieldCheck, Activity
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Legend, LineChart as RechartsLineChart, Line } from "recharts";
import api from "../services/api";
import { ErrorBoundary } from "../components/ErrorBoundary";

const fmtINR = (n) => n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";
const fmt = (n) => n != null ? new Intl.NumberFormat("en-IN").format(Math.round(n)) : "—";
const fmtPct = (n) => n != null ? `${Number(n).toFixed(1)}%` : "—";
const fmtCompact = (n) => n != null ? `₹${new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n)}` : "";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filters & Sorting for Product Table
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [marginFilter, setMarginFilter] = useState("All");
  const [sortBy, setSortBy] = useState("revenue"); // revenue, profit, margin, units, asp
  const [categorySortBy, setCategorySortBy] = useState("gross_profit");
  const itemsPerPage = 15;
  
  // Trend Period Toggle
  const [trendPeriod, setTrendPeriod] = useState("30D");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/analytics/profitability");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "products", label: "Product Profitability", icon: Box },
    { id: "categories", label: "Category Profitability", icon: Layers },
    { id: "risk", label: "Profitability Risk", icon: AlertTriangle },
    { id: "trends", label: "Profitability Trends", icon: LineChart },
    { id: "insights", label: "Actionable Insights", icon: Lightbulb },
  ];

  const overview = data?.overview || {};
  const products = data?.products || [];
  const categories = data?.categories || [];
  const risk = data?.risk || {};
  const trends = data?.trends || {};
  const insights = data?.insights || {};

  const isNoFinancialData = (row) => (row.revenue === 0 && row.units_sold === 0 && row.cogs === 0);

  // Product Table Filters
  const uniqueCategories = ["All", ...Array.from(new Set(products.map(d => d.category || "Uncategorized")))];
  const uniqueStatuses = ["All", "High Margin", "Healthy", "At Risk", "High Risk", "Zero Profit", "Negative Profit", "Insufficient Data"];
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (categoryFilter !== "All" && (p.category || "Uncategorized") !== categoryFilter) return false;
      if (statusFilter !== "All" && p.status !== statusFilter) return false;
      if (marginFilter !== "All") {
        const m = p.profit_margin_pct || 0;
        if (marginFilter === "<10%" && m >= 10) return false;
        if (marginFilter === "10%–<15%" && (m < 10 || m >= 15)) return false;
        if (marginFilter === "15%–<30%" && (m < 15 || m >= 30)) return false;
        if (marginFilter === "≥30%" && m < 30) return false;
      }
      if (search && !(p.product_id?.toLowerCase().includes(search.toLowerCase()) || p.product_name?.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === "revenue") return (b.revenue || 0) - (a.revenue || 0);
      if (sortBy === "profit") return (b.gross_profit || 0) - (a.gross_profit || 0);
      if (sortBy === "margin") return (b.profit_margin_pct || 0) - (a.profit_margin_pct || 0);
      if (sortBy === "units") return (b.units_sold || 0) - (a.units_sold || 0);
      if (sortBy === "asp") return (b.asp || 0) - (a.asp || 0);
      return 0;
    });
  }, [products, search, categoryFilter, statusFilter, marginFilter, sortBy]);

  const paginatedProducts = filteredProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  // Render pagination
  const PaginationFooter = ({ total }) => {
    if (total <= itemsPerPage) return null;
    return (
      <div className="p-4 border-t border-[#374151] bg-[#1F2937] flex items-center justify-between rounded-b-lg">
        <p className="text-sm text-gray-400">
          Showing <span className="font-bold text-gray-100">{page}</span> of <span className="font-bold text-gray-100">{totalPages}</span> ({total} items)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };
  
  const getStatusColor = (status) => {
    if (status === "High Margin" || status === "Healthy") return "text-green-500 bg-green-500/10 border-green-500/20";
    if (status === "At Risk") return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
    if (status === "High Risk" || status === "Negative Profit") return "text-red-500 bg-red-500/10 border-red-500/20";
    return "text-gray-400 bg-gray-500/10 border-gray-500/20";
  };

  const trendData = trends[trendPeriod] || [];

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-12 font-sans">
      
      {/* HEADER */}
      <div className="mb-6 pb-4 border-b border-[#374151] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50 tracking-tight">Profitability Analytics</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">Monitor product and category margins, revenue, and overall business health.</p>
        </div>
        <button 
          onClick={fetchData} 
          className="ent-btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} /> 
          Refresh Data
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION — horizontal scroll on mobile, vertical on lg+ */}
        <div className="w-full lg:w-64 flex-shrink-0 ent-panel overflow-hidden">
          <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setPage(1); }}
                  className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-3 lg:py-3.5 text-xs lg:text-sm font-semibold border-b border-[#374151] last:border-b-0 transition-colors text-left whitespace-nowrap flex-shrink-0 lg:flex-shrink
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-500 border-l-4 border-l-blue-500 lg:pl-3' 
                      : 'text-gray-400 hover:bg-[#374151]/50 border-l-4 border-l-transparent hover:text-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-500' : 'text-gray-500'}`} />
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 w-full ent-panel min-h-[600px] overflow-hidden relative">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 py-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" /> 
              <span className="font-bold tracking-wide">Calculating Financials...</span>
            </div>
          ) : !data ? (
             <div className="w-full h-full flex items-center justify-center py-32 text-gray-500">No Data Available</div>
          ) : (
            <div className="p-6">
              
              {/* OVERVIEW */}
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Financial Overview</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-blue-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
                      <p className="text-2xl font-black text-gray-50">{fmtINR(overview.total_revenue)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-orange-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total COGS</p>
                      <p className="text-2xl font-black text-gray-300">{fmtINR(overview.total_cogs)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-green-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gross Profit</p>
                      <p className="text-2xl font-black text-green-400">{fmtINR(overview.gross_profit)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Profit Margin</p>
                      <p className="text-2xl font-black text-blue-400">{fmtPct(overview.avg_margin)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Units Sold</p>
                      <p className="text-2xl font-black text-gray-50">{fmt(overview.units_sold)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Profitability Rate</p>
                      <p className="text-2xl font-black text-gray-50">{fmtPct(overview.profitability_rate)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">At-Risk Products</p>
                      <p className="text-2xl font-black text-red-400">{fmt(overview.risk_products)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Selling Price (ASP)</p>
                      <p className="text-2xl font-black text-gray-50">{fmtINR(overview.asp)}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">COGS % of Revenue</p>
                      <p className="text-2xl font-black text-orange-400">{fmtPct(overview.cogs_pct)}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-right">
                    <p className="text-sm text-gray-500 font-medium">Successfully analyzed {overview.total_analyzed} eligible products.</p>
                  </div>
                </div>
              )}

              {/* PRODUCT PROFITABILITY */}
              {activeTab === "products" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Product Profitability</h2>
                  
                  {/* Filters */}
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3" />
                        <input 
                          type="text" 
                          placeholder="Search Name/ID..." 
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5 pl-9 w-48"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select 
                          value={categoryFilter}
                          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5"
                        >
                          {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-gray-500" />
                        <select 
                          value={statusFilter}
                          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5"
                        >
                          {uniqueStatuses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <select 
                          value={marginFilter}
                          onChange={(e) => { setMarginFilter(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5"
                        >
                          {["All", "<10%", "10%–<15%", "15%–<30%", "≥30%"].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="ent-input text-sm py-1.5"
                      >
                        <option value="revenue">Highest Revenue</option>
                        <option value="profit">Highest Profit</option>
                        <option value="margin">Highest Margin %</option>
                        <option value="units">Highest Units Sold</option>
                        <option value="asp">Highest ASP</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">COGS</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Gross Profit</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Margin %</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">ASP</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Status</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {paginatedProducts.map((row, idx) => (
                          <tr key={idx} className="ent-table-row hover:bg-[#374151]/40">
                            <td className="px-4 py-2.5 font-bold text-gray-100 flex flex-col">
                                <span>{row.product_id}</span>
                                <span className="text-xs text-gray-500 font-medium">{row.product_name?.substring(0,25)}{row.product_name?.length>25?"...":""}</span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{row.category || "Uncategorized"}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.cogs)}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-green-400">{fmtINR(row.gross_profit)}</td>
                            <td className={`px-4 py-2.5 text-right font-bold ${row.profit_margin_pct < 15 ? 'text-red-400' : 'text-blue-400'}`}>
                                {fmtPct(row.profit_margin_pct)}
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-300">{fmtINR(row.asp)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${getStatusColor(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                                <button onClick={() => setSelectedProduct(row)} className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase">Analyze</button>
                            </td>
                          </tr>
                        ))}
                        {paginatedProducts.length === 0 && (
                          <tr><td colSpan="10" className="p-8 text-center text-gray-500 font-medium">No products match current filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                    <PaginationFooter total={filteredProducts.length} />
                  </div>
                </div>
              )}

              {/* CATEGORY PROFITABILITY */}
              {activeTab === "categories" && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-50">Category Profitability</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sort:</span>
                      <select 
                        value={categorySortBy}
                        onChange={(e) => setCategorySortBy(e.target.value)}
                        className="ent-input text-sm py-1.5"
                      >
                        <option value="revenue">Highest Revenue</option>
                        <option value="cogs">Highest COGS</option>
                        <option value="gross_profit">Highest Gross Profit</option>
                        <option value="margin_pct">Highest Margin %</option>
                        <option value="profit_contribution_pct">Highest Contribution %</option>
                        <option value="units_sold">Highest Units Sold</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-[300px] w-full mb-8 mt-4 bg-[#111827] border border-[#374151] rounded-lg p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categories.filter(c => !isNoFinancialData(c))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="category" stroke="#9CA3AF" tick={{fontSize: 12}} />
                        <YAxis yAxisId="left" stroke="#9CA3AF" tick={{fontSize: 12}} tickFormatter={fmtCompact} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                          formatter={(value, name) => [name === 'profit_contribution_pct' ? fmtPct(value) : fmtINR(value), name === 'profit_contribution_pct' ? 'Profit Contribution' : name === 'gross_profit' ? 'Gross Profit' : 'Revenue']}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" />
                        <Bar yAxisId="left" dataKey="gross_profit" fill="#10B981" name="Gross Profit" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">COGS</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Gross Profit</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Margin %</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Contribution %</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {[...categories].sort((a,b)=>(b[categorySortBy] || 0)-(a[categorySortBy] || 0)).map((row, idx) => {
                          const noData = isNoFinancialData(row);
                          return (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.category}</td>
                            {noData ? (
                              <td colSpan={6} className="px-4 py-2.5 text-center text-gray-500 font-medium italic">
                                No financial data
                              </td>
                            ) : (
                              <>
                                <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                                <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.cogs)}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-green-400">{fmtINR(row.gross_profit)}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtPct(row.margin_pct)}</td>
                                <td className="px-4 py-2.5 text-right font-bold text-blue-400">{fmtPct(row.profit_contribution_pct)}</td>
                                <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                              </>
                            )}
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PROFITABILITY RISK */}
              {activeTab === "risk" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Profitability Risk Analysis</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { name: "High Risk", count: risk["High Risk"] || 0, desc: "Margin < 10%", color: "border-red-500 text-red-500" },
                      { name: "At Risk", count: risk["At Risk"] || 0, desc: "10% ≤ Margin < 15%", color: "border-orange-500 text-orange-500" },
                      { name: "Healthy", count: risk["Healthy"] || 0, desc: "15% ≤ Margin < 30%", color: "border-green-500 text-green-500" },
                      { name: "High Margin", count: risk["High Margin"] || 0, desc: "Margin ≥ 30%", color: "border-blue-500 text-blue-500" },
                      { name: "Zero Profit", count: risk["Zero Profit"] || 0, desc: "Revenue > 0 but Zero Profit", color: "border-gray-500 text-gray-400" },
                      { name: "Negative Profit", count: risk["Negative Profit"] || 0, desc: "Selling below cost", color: "border-red-700 text-red-700" },
                      { name: "Insufficient Data", count: risk["Insufficient Data"] || 0, desc: "Missing financial records", color: "border-gray-700 text-gray-500" }
                    ].map(r => (
                      <button 
                        key={r.name} 
                        onClick={() => { setStatusFilter(r.name); setActiveTab("products"); setPage(1); }}
                        className={`p-5 bg-[#111827] border border-[#374151] rounded-lg border-l-4 ${r.color.split(' ')[0]} text-left hover:bg-[#1F2937] transition-colors`}
                      >
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{r.name}</h3>
                        <p className={`text-2xl font-black ${r.color.split(' ')[1]}`}>{r.count} <span className="text-sm text-gray-500 font-medium">Products</span></p>
                        <p className="text-xs text-gray-500 mt-2">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-400">Clicking a risk bucket will filter the Product Profitability table.</p>
                </div>
              )}

              {/* TRENDS */}
              {activeTab === "trends" && (
                <div>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-lg font-bold text-gray-50">Profitability Trends</h2>
                    <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-[#374151]">
                        {["7D", "30D", "90D"].map(p => (
                            <button 
                              key={p} 
                              onClick={() => setTrendPeriod(p)}
                              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${trendPeriod === p ? 'bg-[#1F2937] text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                  </div>

                  {trendData.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Period Revenue</p>
                                <p className="text-lg font-black text-gray-50">{fmtINR(trendData.reduce((acc, curr)=>acc+curr.revenue, 0))}</p>
                            </div>
                            <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Period Gross Profit</p>
                                <p className="text-lg font-black text-green-400">{fmtINR(trendData.reduce((acc, curr)=>acc+curr.gross_profit, 0))}</p>
                            </div>
                            <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Latest Margin %</p>
                                <p className="text-lg font-black text-blue-400">{fmtPct(trendData[trendData.length-1].margin_pct)}</p>
                            </div>
                            <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-blue-500">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Insight</p>
                                <p className="text-sm font-bold text-blue-400 leading-tight mt-1">{insights.trend_insight}</p>
                            </div>
                        </div>

                        <div className="h-[400px] w-full bg-[#111827] border border-[#374151] rounded-lg p-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsLineChart data={trendData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{fontSize: 12}} />
                                    <YAxis yAxisId="left" stroke="#9CA3AF" tick={{fontSize: 12}} tickFormatter={fmtCompact} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{fontSize: 12}} tickFormatter={(v) => `${v}%`} />
                                    <RechartsTooltip 
                                      contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                      formatter={(value, name) => [name === 'margin_pct' ? fmtPct(value) : fmtINR(value), name === 'margin_pct' ? 'Margin %' : name === 'gross_profit' ? 'Gross Profit' : 'Revenue']}
                                      labelFormatter={(l) => `Date: ${l}`}
                                    />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" strokeWidth={2} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="cogs" stroke="#EF4444" name="COGS" strokeWidth={2} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="gross_profit" stroke="#10B981" name="Gross Profit" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="margin_pct" stroke="#F59E0B" name="Margin %" strokeWidth={2} dot={false} />
                                </RechartsLineChart>
                            </ResponsiveContainer>
                        </div>
                      </>
                  ) : (
                      <div className="w-full h-64 flex items-center justify-center bg-[#111827] border border-[#374151] rounded-lg">
                          <p className="text-gray-500 font-medium">Insufficient trend data for selected period.</p>
                      </div>
                  )}
                </div>
              )}

              {/* INSIGHTS */}
              {activeTab === "insights" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Actionable Insights & Concentration</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-green-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Highest Profit Category</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.highest_profit_category || "N/A"}</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-blue-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Highest Margin Category</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.highest_margin_category || "N/A"}</p>
                    </div>
                    
                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-red-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Lowest Margin Category</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.lowest_margin_category || "N/A"}</p>
                    </div>
                    
                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-green-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Most Profitable Product</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.most_profitable_product || "N/A"}</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-red-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Lowest Profit Product</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.lowest_profit_product || "N/A"}</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-orange-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Margin Risk Exposure</h3>
                      <p className="text-xl font-bold text-gray-50">{insights.margin_risk_exposure || 0} Products</p>
                      <p className="text-sm text-gray-400 mt-1">Currently operating below healthy margin thresholds.</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-yellow-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Revenue Concentration (Top 10)</h3>
                      <p className="text-xl font-bold text-yellow-400">{fmtPct(insights.revenue_concentration_top_10)}</p>
                      <p className="text-sm text-gray-400 mt-1">Share of total revenue generated by the top 10 products.</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-yellow-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Profit Concentration (Top 10)</h3>
                      <p className="text-xl font-bold text-yellow-400">{fmtPct(insights.profit_concentration_top_10)}</p>
                      <p className="text-sm text-gray-400 mt-1">Share of total gross profit generated by the top 10 products.</p>
                    </div>

                    <div className="p-5 border border-[#374151] rounded-lg bg-[#111827] border-l-4 border-l-yellow-500">
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">COGS Concentration (Top 10)</h3>
                      <p className="text-xl font-bold text-yellow-400">{fmtPct(insights.cogs_concentration_top_10)}</p>
                      <p className="text-sm text-gray-400 mt-1">Share of total COGS contributed by the top 10 highest-cost products.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* PRODUCT DETAIL MODAL */}
          {selectedProduct && (
            <ErrorBoundary>
            <div className="absolute inset-0 bg-[#111827]/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 overflow-y-auto">
              <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-auto">
                <div className="p-6 border-b border-[#374151] flex justify-between items-center bg-[#111827]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Package className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        {selectedProduct.product_id}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border ${getStatusColor(selectedProduct.status)}`}>
                            {selectedProduct.status}
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400 font-medium">{selectedProduct.product_name} | {selectedProduct.category || "Uncategorized"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="p-2 text-gray-400 hover:text-white bg-[#1F2937] hover:bg-[#374151] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Financial Performance</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Revenue</p>
                        <p className="text-lg font-black text-gray-50">{fmtINR(selectedProduct.revenue)}</p>
                      </div>
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">COGS</p>
                        <p className="text-lg font-black text-gray-300">{fmtINR(selectedProduct.cogs)}</p>
                      </div>
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Gross Profit</p>
                        <p className="text-lg font-black text-green-400">{fmtINR(selectedProduct.gross_profit)}</p>
                      </div>
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Margin %</p>
                        <p className={`text-lg font-black ${(selectedProduct.profit_margin_pct || 0) < 15 ? 'text-red-400' : 'text-blue-400'}`}>
                          {fmtPct(selectedProduct.profit_margin_pct)}
                        </p>
                      </div>
                    </div>
                    
                    <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Unit Economics & Operations</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Units Sold</p>
                        <p className="text-lg font-black text-gray-50">{fmt(selectedProduct.units_sold)}</p>
                      </div>
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Avg Selling Price (ASP)</p>
                        <p className="text-lg font-black text-gray-50">{fmtINR(selectedProduct.asp)}</p>
                      </div>
                      <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Cost Price (Per Unit)</p>
                        <p className="text-lg font-black text-gray-400">{fmtINR(selectedProduct.cost_price)}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Profitability Diagnostic</h4>
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">
                            Margin is <strong className="text-white">{fmtPct(selectedProduct.profit_margin_pct)}</strong>, placing this product in the <strong className="text-white uppercase">{selectedProduct.status}</strong> profitability category.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            For pricing adjustments to improve margin or clear inventory, review this product in the Pricing Strategy dashboard.
                        </p>
                    </div>
                </div>
              </div>
            </div>
            </ErrorBoundary>
          )}

        </div>
      </div>
    </div>
  );
}
