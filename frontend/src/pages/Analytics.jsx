import React, { useState, useEffect } from "react";
import { 
  AlertCircle, AlertTriangle, Box, RefreshCw, 
  TrendingUp, Tag, Globe, Package, DollarSign, Filter, Search, CheckSquare, Square, ChevronLeft, ChevronRight
} from "lucide-react";
import api from "../services/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = (n) => n != null ? `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n)}` : "—";
const fmt = (n) => n != null ? new Intl.NumberFormat("en-IN").format(Math.round(n)) : "—";
const fmtPct = (n) => n != null ? `${Number(n).toFixed(1)}%` : "—";

const MLBadge = () => (
  <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shadow-sm border border-blue-200 ml-1">
    Available after ML
  </span>
);

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("alerts");
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Data States
  const [data, setData] = useState({
    alerts: [],
    performance: [],
    profitability: [],
    promotions: [],
    regional: [],
    inventory: [],
    revenue: [],
  });

  // Filter States
  const [showHealthyPerformance, setShowHealthyPerformance] = useState(false);
  const [showHealthyInventory, setShowHealthyInventory] = useState(false);
  
  // For Product Performance Filters
  const [perfFilters, setPerfFilters] = useState({ priority: "All", search: "" });

  useEffect(() => {
    fetchData();
  }, []);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab, showHealthyPerformance, showHealthyInventory, perfFilters]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertsRes, perfRes, profRes, promoRes, regRes, invRes, revRes] = await Promise.all([
        api.get("/analytics/alerts"),
        api.get("/analytics/product-performance"),
        api.get("/analytics/profitability"),
        api.get("/analytics/promotions"),
        api.get("/analytics/regional"),
        api.get("/analytics/inventory"),
        api.get("/analytics/revenue"),
      ]);
      setData({
        alerts: alertsRes.data,
        performance: perfRes.data,
        profitability: profRes.data,
        promotions: promoRes.data,
        regional: regRes.data,
        inventory: invRes.data,
        revenue: revRes.data,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "alerts", label: "Business Alerts", icon: AlertTriangle },
    { id: "performance", label: "Product Performance", icon: Box },
    { id: "profitability", label: "Profitability Analysis", icon: TrendingUp },
    { id: "promotions", label: "Promotion Analysis", icon: Tag },
    { id: "regional", label: "Regional Performance", icon: Globe },
    { id: "inventory", label: "Inventory Analysis", icon: Package },
    { id: "revenue", label: "Revenue Analysis", icon: DollarSign },
  ];

  const handleAlertClick = (section) => {
    setActiveTab(section);
    if (section === "inventory") setShowHealthyInventory(false);
    if (section === "performance") setShowHealthyPerformance(false);
  };

  // --- Filtered Data ---
  const filteredPerformance = data.performance.filter(row => {
    const isActionable = row.status !== "Healthy" && row.priority !== "Low" && row.recommendation !== "No Action Required";
    if (!showHealthyPerformance && !isActionable) return false;
    
    if (perfFilters.priority !== "All" && row.priority !== perfFilters.priority) return false;
    if (perfFilters.search && !row.product_id.toLowerCase().includes(perfFilters.search.toLowerCase())) return false;
    
    return true;
  });

  const filteredInventory = data.inventory.filter(row => {
    const isActionable = row.status !== "Healthy";
    return showHealthyInventory ? true : isActionable;
  });

  // --- Pagination Logic ---
  const getPaginated = (arr) => arr.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const PaginationFooter = ({ totalItems }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    if (totalItems <= itemsPerPage) return null; // Hide pagination if not needed
    return (
      <div className="p-4 border-t border-[#374151] bg-[#1F2937] flex items-center justify-between rounded-b-lg">
        <p className="text-sm text-gray-400">
          Showing Page <span className="font-bold text-gray-100">{page}</span> of <span className="font-bold text-gray-100">{totalPages}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="p-1.5 rounded border border-[#374151] bg-[#111827] hover:bg-[#374151] text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-[1500px] mx-auto pb-12 font-sans">
      
      {/* HEADER */}
      <div className="mb-6 pb-4 border-b border-[#374151] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-50 tracking-tight">Business Decision Support System</h1>
          <p className="text-sm font-medium text-gray-400 mt-1">Pricing, Inventory, and Promotion Intelligence</p>
        </div>
        <button 
          onClick={fetchData} 
          className="ent-btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} /> 
          Refresh Data
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-64 flex-shrink-0 ent-panel overflow-hidden">
          <div className="p-4 border-b border-[#374151] bg-[#111827]">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Workflows</h3>
          </div>
          <div className="flex flex-col">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 text-sm font-semibold border-b border-[#374151] last:border-b-0 transition-colors text-left
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-500 border-l-4 border-l-blue-500 pl-3' 
                      : 'text-gray-400 hover:bg-[#374151]/50 border-l-4 border-l-transparent hover:text-gray-100'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-500' : 'text-gray-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN WORKSPACE CONTENT */}
        <div className="flex-1 w-full ent-panel min-h-[600px] overflow-hidden">
          {loading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-3 py-32">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" /> 
              <span className="font-bold tracking-wide">Compiling Business Rules...</span>
            </div>
          ) : (
            <div className="p-6">
              
              {/* 1. ALERTS SECTION */}
              {activeTab === "alerts" && (
                <div>
                  <div className="flex justify-between items-end mb-6 pb-4 border-b border-[#374151]">
                    <div>
                      <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" /> Actionable Business Alerts
                      </h2>
                      <p className="text-sm font-medium text-gray-400 mt-1">High-priority items requiring immediate management attention.</p>
                    </div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Generated: {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                  
                  {data.alerts.length === 0 ? (
                    <div className="p-8 border border-[#374151] bg-[#111827] text-center text-sm font-medium text-gray-400 rounded-lg">
                      No active alerts requiring attention.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {data.alerts.map((alert, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleAlertClick(alert.section)}
                          className={`p-5 flex items-start justify-between bg-[#111827] shadow-sm border border-[#374151] rounded-lg cursor-pointer transition-colors hover:bg-[#374151]/50
                            ${alert.type === 'Critical' ? 'border-l-4 border-l-red-500' : 
                              alert.type === 'High' ? 'border-l-4 border-l-orange-500' : 
                              'border-l-4 border-l-amber-500'}
                          `}
                        >
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm text-white
                                ${alert.type === 'Critical' ? 'bg-red-500' : alert.type === 'High' ? 'bg-orange-500' : 'bg-amber-500 text-amber-950'}
                              `}>
                                {alert.type}
                              </span>
                              <span className="text-xs font-bold text-gray-400">{alert.count} Products Affected</span>
                            </div>
                            <p className="font-bold text-gray-50 text-base">{alert.message}</p>
                          </div>
                          <button className="bg-[#374151] hover:bg-gray-600 text-white text-xs font-bold py-2 px-4 rounded transition-colors whitespace-nowrap">
                            {alert.action} →
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 2. PRODUCT PERFORMANCE */}
              {activeTab === "performance" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151]">
                    <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                      <Box className="w-5 h-5 text-blue-500" /> Product Performance Analysis
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">Identify specific products requiring pricing or inventory interventions.</p>
                  </div>
                  
                  {/* Filters */}
                  <div className="bg-[#111827] border border-[#374151] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Priority:</span>
                        <select 
                          value={perfFilters.priority}
                          onChange={(e) => setPerfFilters({...perfFilters, priority: e.target.value})}
                          className="ent-input text-sm py-1.5"
                        >
                          <option value="All">All</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                      
                      <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-gray-500 absolute left-3" />
                        <input 
                          type="text" 
                          placeholder="Search Product ID..." 
                          value={perfFilters.search}
                          onChange={(e) => setPerfFilters({...perfFilters, search: e.target.value})}
                          className="ent-input text-sm py-1.5 pl-9 w-48"
                        />
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowHealthyPerformance(!showHealthyPerformance)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-100"
                    >
                      {showHealthyPerformance ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-500" />}
                      Show Healthy Products
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product ID</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Brand</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Inventory</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Price</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Discount</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Priority</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Action <MLBadge /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(filteredPerformance).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.product_id}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{row.brand}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{fmt(row.inventory)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.avg_price)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtPct(row.discount)}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-300">{row.status}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border
                                ${row.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                  row.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                  'bg-[#111827] text-gray-400 border-[#374151]'}
                              `}>
                                {row.priority}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.recommendation}</td>
                          </tr>
                        ))}
                        {filteredPerformance.length === 0 && (
                          <tr><td colSpan="10" className="p-8 text-center text-gray-500 font-medium">No products match current filters.</td></tr>
                        )}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={filteredPerformance.length} />
                  </div>
                </div>
              )}

              {/* 3. PROFITABILITY ANALYSIS */}
              {activeTab === "profitability" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151]">
                    <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-500" /> Profitability Analysis
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">Review margins and discount depths to prevent margin erosion.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Price</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Discount</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Inventory</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center bg-yellow-500/10 text-yellow-500">Margin</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(data.profitability).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.product_id}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.avg_price)}</td>
                            <td className={`px-4 py-2.5 text-right font-bold ${row.discount > 30 ? 'text-red-500' : 'text-gray-400'}`}>{fmtPct(row.discount)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.inventory)}</td>
                            <td className="px-4 py-2.5 text-center text-xs font-bold text-yellow-500 bg-yellow-500/5 italic">
                              {row.margin}
                            </td>
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={data.profitability.length} />
                  </div>
                </div>
              )}

              {/* 4. PROMOTION ANALYSIS */}
              {activeTab === "promotions" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151]">
                    <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-blue-500" /> Promotion Analysis
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">Evaluate promotion effectiveness based on volume and discount depth.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Promotion Type</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Products Covered</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Discount</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue Gen.</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Business Impact</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Recommendation <MLBadge /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(data.promotions).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.promotion_type}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{fmt(row.products_covered)}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-300">{fmtPct(row.avg_discount)}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-center font-bold text-gray-300">{row.business_impact}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={data.promotions.length} />
                  </div>
                </div>
              )}

              {/* 5. REGIONAL PERFORMANCE */}
              {activeTab === "regional" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151]">
                    <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-500" /> Regional Performance
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">Identify regional underperformance and volume leaders.</p>
                  </div>
                  
                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Region</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Price</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Observation</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(data.regional).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.region}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.avg_price)}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-300">{row.observation}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={data.regional.length} />
                  </div>
                </div>
              )}

              {/* 6. INVENTORY ANALYSIS */}
              {activeTab === "inventory" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151]">
                    <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-500" /> Inventory Analysis
                    </h2>
                    <p className="text-sm font-medium text-gray-400 mt-1">Manage stock health and prevent dead-stock accumulation.</p>
                  </div>
                  
                  <div className="bg-[#111827] border border-[#374151] p-4 mb-6 flex items-center justify-between rounded-lg">
                    <div className="flex items-center gap-3">
                       <Filter className="w-4 h-4 text-gray-500" />
                       <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inventory Views</span>
                    </div>
                    <button 
                      onClick={() => setShowHealthyInventory(!showHealthyInventory)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-100"
                    >
                      {showHealthyInventory ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4 text-gray-500" />}
                      Show Healthy Inventory
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Inventory Level</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-center">Priority</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Recommendation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(filteredInventory).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.product_id}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmt(row.inventory)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 font-bold text-gray-300">{row.status}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm border
                                ${row.priority === 'High' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                  row.priority === 'Medium' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                                  'bg-[#111827] text-gray-400 border-[#374151]'}
                              `}>
                                {row.priority}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.recommendation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={filteredInventory.length} />
                  </div>
                </div>
              )}

              {/* 7. REVENUE ANALYSIS */}
              {activeTab === "revenue" && (
                <div>
                  <div className="mb-6 pb-4 border-b border-[#374151] flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-bold text-gray-50 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-blue-500" /> Revenue Analysis
                      </h2>
                      <p className="text-sm font-medium text-gray-400 mt-1">Historical validation of past business decisions. (Reporting only)</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto border border-[#374151] rounded-lg">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="ent-table-header">
                        <tr>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider">Brand</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Total Revenue</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Units Sold</th>
                          <th className="px-4 py-3 font-bold text-gray-300 text-xs uppercase tracking-wider text-right">Avg Selling Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#374151]">
                        {getPaginated(data.revenue).map((row, idx) => (
                          <tr key={idx} className="ent-table-row">
                            <td className="px-4 py-2.5 font-bold text-gray-50">{row.product_id}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{row.category}</td>
                            <td className="px-4 py-2.5 text-gray-400 font-medium">{row.brand}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-gray-100">{fmtINR(row.revenue)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmt(row.units_sold)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-400">{fmtINR(row.avg_price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <PaginationFooter totalItems={data.revenue.length} />
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
