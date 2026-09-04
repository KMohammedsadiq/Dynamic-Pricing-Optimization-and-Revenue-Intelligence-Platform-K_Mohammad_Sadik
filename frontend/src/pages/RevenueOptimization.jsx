import React, { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, TrendingDown, Target, Shield, Eye,
  Search, Filter, ChevronLeft, ChevronRight, X, RefreshCw, Layers, ArrowUpRight, ArrowDownRight, Minus, Package
} from "lucide-react";
import api from "../services/api";
import { ErrorBoundary } from "../components/ErrorBoundary";

const fmtINR = (n) => n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";
const fmtPct = (n) => n != null ? `${Number(n).toFixed(1)}%` : "—";
const fmt = (n) => n != null ? new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n) : "—";

const StrategyBadge = ({ action }) => {
  if (action === "CONSIDER PRICE INCREASE") return <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max"><TrendingUp className="w-3 h-3" /> Increase</span>;
  if (action === "CONSIDER PRICE DECREASE") return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max"><TrendingDown className="w-3 h-3" /> Decrease</span>;
  if (action === "PROTECT MARGIN") return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max"><Shield className="w-3 h-3" /> Protect</span>;
  if (action === "MONITOR MARKET") return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max"><Eye className="w-3 h-3" /> Monitor</span>;
  return <span className="bg-[#374151] text-gray-300 border border-[#4B5563] px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider flex items-center gap-1 w-max"><Minus className="w-3 h-3" /> Maintain</span>;
};

export default function RevenueOptimization() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const itemsPerPage = 15;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/analytics/pricing-strategies");
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Strategy Overview", icon: Target },
    { id: "recommendations", label: "Recommendations", icon: Layers },
  ];

  // ==========================================
  // SUMMARIES
  // ==========================================
  const summary = useMemo(() => {
    const counts = { evaluated: data.length, increase: 0, decrease: 0, maintain: 0, protect: 0, monitor: 0 };
    data.forEach(d => {
      if (d.recommendation === "CONSIDER PRICE INCREASE") counts.increase++;
      else if (d.recommendation === "CONSIDER PRICE DECREASE") counts.decrease++;
      else if (d.recommendation === "PROTECT MARGIN") counts.protect++;
      else if (d.recommendation === "MONITOR MARKET") counts.monitor++;
      else counts.maintain++;
    });
    return counts;
  }, [data]);

  // ==========================================
  // FILTERS
  // ==========================================
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (actionFilter !== "All" && d.recommendation !== actionFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!d.product.id.toLowerCase().includes(s) && 
            !d.product.name.toLowerCase().includes(s) && 
            !(d.product.category || "").toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [data, search, actionFilter]);

  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const PaginationFooter = ({ total }) => {
    if (total <= itemsPerPage) return null;
    return (
      <div className="p-4 border-t border-[#374151] bg-[#1F2937] flex items-center justify-between rounded-b-lg">
        <p className="text-sm text-gray-400">
          Showing <span className="font-bold text-gray-100">{page}</span> of <span className="font-bold text-gray-100">{totalPages}</span>
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

  const handleRowClick = (item) => {
    setSelectedProduct(item);
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-12 font-sans">
      
      {/* HEADER */}
      <div className="mb-6 pb-4 border-b border-[#374151] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50 tracking-tight">Pricing Strategy</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">Data-driven recommendations balancing profitability and market position.</p>
        </div>
        <button onClick={fetchData} className="ent-btn-secondary flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} /> 
          Recalculate Rules
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
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
                  {item.label}
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
              <span className="font-bold tracking-wide">Evaluating Pricing Strategies...</span>
            </div>
          ) : (
            <div className="p-6">
              
              {/* STRATEGY OVERVIEW */}
              {activeTab === "overview" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Strategy Distribution Overview</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-blue-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Products Evaluated</p>
                      <p className="text-2xl font-black text-gray-50">{summary.evaluated}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-green-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Consider Price Increase</p>
                      <p className="text-2xl font-black text-green-400">{summary.increase}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-red-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Consider Price Decrease</p>
                      <p className="text-2xl font-black text-red-400">{summary.decrease}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-purple-500">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Protect Margin</p>
                      <p className="text-2xl font-black text-purple-400">{summary.protect}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-gray-400">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Maintain Price</p>
                      <p className="text-2xl font-black text-gray-300">{summary.maintain}</p>
                    </div>
                    <div className="p-4 bg-[#111827] border border-[#374151] rounded-lg border-l-4 border-l-blue-400">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Monitor Market</p>
                      <p className="text-2xl font-black text-blue-300">{summary.monitor}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* RECOMMENDATIONS */}
              {activeTab === "recommendations" && (
                <div>
                  <h2 className="text-lg font-bold text-gray-50 mb-4">Pricing Recommendations</h2>
                  
                  {/* Filters */}
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 mb-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3" />
                        <input 
                          type="text" 
                          placeholder="Search Product/Category..." 
                          value={search}
                          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5 pl-9 w-56"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select 
                          value={actionFilter}
                          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                          className="ent-input text-sm py-1.5"
                        >
                          <option value="All">All Strategies</option>
                          <option value="CONSIDER PRICE INCREASE">Consider Price Increase</option>
                          <option value="CONSIDER PRICE DECREASE">Consider Price Decrease</option>
                          <option value="MAINTAIN PRICE">Maintain Price</option>
                          <option value="PROTECT MARGIN">Protect Margin</option>
                          <option value="MONITOR MARKET">Monitor Market</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap min-w-[700px]">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Our Price</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Market Avg</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Gap %</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Margin %</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Demand</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Strategy</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {paginatedData.map((row, idx) => {
                          const gap = row.supporting_metrics.price_gap_pct;
                          return (
                            <tr key={idx} className="ent-table-row hover:bg-[#374151]/40 transition-colors">
                              <td className="px-4 py-2.5">
                                <p className="font-bold text-blue-400">{row.product.id}</p>
                                <p className="text-[10px] text-gray-400 truncate w-32">{row.product.category || "Uncategorized"}</p>
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.supporting_metrics.current_price)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.supporting_metrics.market_average)}</td>
                              <td className={`px-4 py-2.5 text-right font-bold ${gap > 0 ? 'text-red-400' : gap < 0 ? 'text-green-400' : 'text-gray-400'}`}>
                                {fmtPct(gap)}
                              </td>
                              <td className={`px-4 py-2.5 text-right font-bold ${row.supporting_metrics.profit_margin_pct < 15 ? 'text-red-400' : 'text-gray-100'}`}>
                                {fmtPct(row.supporting_metrics.profit_margin_pct)}
                              </td>
                              <td className="px-4 py-2.5 text-center">
                                {row.supporting_metrics.forecast_trend === "Increasing" ? <ArrowUpRight className="w-4 h-4 text-green-500 mx-auto" /> :
                                 row.supporting_metrics.forecast_trend === "Decreasing" ? <ArrowDownRight className="w-4 h-4 text-red-500 mx-auto" /> :
                                 <Minus className="w-4 h-4 text-gray-500 mx-auto" />}
                              </td>
                              <td className="px-4 py-2.5">
                                <StrategyBadge action={row.recommendation} />
                              </td>
                              <td className="px-4 py-2.5">
                                <button 
                                  onClick={() => handleRowClick(row)}
                                  className="text-xs font-bold text-blue-400 hover:text-blue-300 underline"
                                >
                                  Analyze
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {paginatedData.length === 0 && (
                          <tr><td colSpan="8" className="p-8 text-center text-gray-500 font-medium">No strategy recommendations match current filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                    <PaginationFooter total={filteredData.length} />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* SELECTED PRODUCT STRATEGY MODAL */}
          {selectedProduct && (
            <ErrorBoundary>
              <div className="absolute inset-0 bg-[#111827]/95 backdrop-blur-sm z-10 flex flex-col items-center p-6 animate-in fade-in duration-200 overflow-y-auto">
                <div className="bg-[#1F2937] border border-[#374151] rounded-xl shadow-2xl w-full max-w-4xl my-auto flex flex-col">
                  <div className="p-6 border-b border-[#374151] flex justify-between items-center bg-[#111827]">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Target className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-3">
                          {selectedProduct?.product?.id || "Unknown"}
                          {selectedProduct?.recommendation && <StrategyBadge action={selectedProduct.recommendation} />}
                        </h3>
                        <p className="text-sm text-gray-400 font-medium">
                          {selectedProduct?.product?.name || "Unknown"} | {selectedProduct?.product?.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedProduct(null)}
                      className="p-2 text-gray-400 hover:text-white bg-[#1F2937] hover:bg-[#374151] rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Data points */}
                    <div className="flex flex-col gap-6">
                      <div>
                        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Supporting Metrics</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Current Price</p>
                            <p className="text-lg font-bold text-gray-50">{fmtINR(selectedProduct?.supporting_metrics?.current_price)}</p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Market Avg</p>
                            <p className="text-lg font-bold text-gray-300">{fmtINR(selectedProduct?.supporting_metrics?.market_average)}</p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Market Gap</p>
                            <p className={`text-lg font-bold ${(selectedProduct?.supporting_metrics?.price_gap_pct || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {fmtPct(selectedProduct?.supporting_metrics?.price_gap_pct)}
                            </p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Profit Margin</p>
                            <p className={`text-lg font-bold ${(selectedProduct?.supporting_metrics?.profit_margin_pct || 0) < 15 ? 'text-red-400' : 'text-blue-400'}`}>
                              {fmtPct(selectedProduct?.supporting_metrics?.profit_margin_pct)}
                            </p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Competitor Movement</p>
                            <p className="text-sm font-bold text-gray-50 mt-1">{selectedProduct?.supporting_metrics?.competitor_movement || "—"}</p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Demand Trend</p>
                            <p className="text-sm font-bold text-gray-50 mt-1">{selectedProduct?.supporting_metrics?.forecast_trend || "—"}</p>
                          </div>
                          <div className="p-3 bg-[#111827] border border-[#374151] rounded-lg">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Inventory Level</p>
                            <p className="text-sm font-bold text-gray-50 mt-1">{fmt(selectedProduct?.supporting_metrics?.inventory_level)} units</p>
                          </div>
                          {selectedProduct?.supporting_metrics?.ml_optimal_price && (
                            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg shadow-[inset_0_0_10px_rgba(59,130,246,0.05)]">
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                ML Predicted Optimal Price
                              </p>
                              <p className="text-lg font-black text-blue-400">{fmtINR(selectedProduct?.supporting_metrics?.ml_optimal_price)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Strategy Explanation */}
                    <div className="flex flex-col gap-6">
                      <div className="p-5 border border-blue-500/20 bg-blue-500/5 rounded-lg flex flex-col h-full shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] relative">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                          <Target className="w-24 h-24" />
                        </div>
                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">Recommended Strategy</h4>
                        <p className="text-2xl font-black text-white mb-6 relative z-10">{selectedProduct?.recommendation || "—"}</p>
                        
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Why?</h4>
                        <p className="text-base text-gray-300 leading-relaxed font-medium mb-6 relative z-10">
                          {selectedProduct?.reason || "No reasoning provided."}
                        </p>

                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Key Factors Considered</h4>
                        <ul className="flex flex-col gap-2 relative z-10">
                          {selectedProduct?.key_factors?.map((factor, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                              {factor}
                            </li>
                          ))}
                          {(!selectedProduct?.key_factors || selectedProduct?.key_factors?.length === 0) && (
                            <li className="text-sm text-gray-500 italic">Standard market condition evaluation.</li>
                          )}
                        </ul>
                      </div>
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
