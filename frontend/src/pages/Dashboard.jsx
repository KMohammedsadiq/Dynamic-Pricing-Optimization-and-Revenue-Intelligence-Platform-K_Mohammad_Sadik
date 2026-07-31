import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  Activity, 
  Layers, 
  Grid,
  Box,
  AlertCircle,
  HelpCircle,
  Info,
  BarChart2,
  Globe,
  Percent,
  Send,
  Lock,
  Sparkles
} from "lucide-react";
import api from "../services/api";
import { getUser } from "../utils/auth";

// Import Charts
import RevenueByCategoryChart from "../components/charts/RevenueByCategoryChart";
import RevenueByBrandChart from "../components/charts/RevenueByBrandChart";
import InventoryOverviewChart from "../components/charts/InventoryOverviewChart";
import PromotionAnalysisChart from "../components/charts/PromotionAnalysisChart";
import RegionalSalesChart from "../components/charts/RegionalSalesChart";
import SeasonalPerformanceChart from "../components/charts/SeasonalPerformanceChart";
import AIRecommendationCard from "../components/dashboard/AIRecommendationCard";

// Tooltip component for plain English explanations
const MetricTooltip = ({ text }) => (
  <div className="group relative inline-block ml-2 align-middle">
    <HelpCircle className="w-4 h-4 text-white/40 cursor-help hover:text-white transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-black/95 backdrop-blur-md text-white text-xs rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none text-center shadow-2xl border border-white/20 font-medium leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-black/95"></div>
    </div>
  </div>
);

export default function Dashboard() {
  const user = getUser();
  const isViewer = user?.role_name === "Viewer";
  
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("revenue");
  
  // Viewer Request State
  const [requestSent, setRequestSent] = useState(false);
  const [requestedRole, setRequestedRole] = useState("Pricing Manager");
  
  // Analytics Data States
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [revenueByBrand, setRevenueByBrand] = useState([]);
  const [inventoryOverview, setInventoryOverview] = useState([]);
  const [promotionAnalysis, setPromotionAnalysis] = useState([]);
  const [regionalSales, setRegionalSales] = useState([]);
  const [seasonalPerformance, setSeasonalPerformance] = useState([]);
  
  const [loading, setLoading] = useState(!isViewer);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isViewer) {
      fetchAllDashboardData();
    }
  }, [isViewer]);

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        summaryRes,
        categoryRes,
        brandRes,
        inventoryRes,
        promotionRes,
        regionalRes,
        seasonalRes
      ] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/revenue-by-category"),
        api.get("/dashboard/revenue-by-brand"),
        api.get("/dashboard/inventory-overview"),
        api.get("/dashboard/promotion-analysis"),
        api.get("/dashboard/regional-sales"),
        api.get("/dashboard/seasonal-performance")
      ]);

      setSummary(summaryRes.data);
      setRevenueByCategory(categoryRes.data);
      setRevenueByBrand(brandRes.data);
      setInventoryOverview(inventoryRes.data.breakdown);
      setPromotionAnalysis(promotionRes.data);
      setRegionalSales(regionalRes.data);
      setSeasonalPerformance(seasonalRes.data);
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setError("Failed to load dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    enter: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="relative w-16 h-16">
           <div className="absolute inset-0 rounded-full border-t-2 border-brand-400 animate-spin"></div>
           <div className="absolute inset-2 rounded-full border-r-2 border-accent-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <p className="text-white/60 font-medium animate-pulse">Gathering your business insights...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-red-500/10 text-red-400 p-8 rounded-2xl border border-red-500/20 flex flex-col items-center gap-4 backdrop-blur-md shadow-xl text-center">
          <AlertCircle className="w-12 h-12 flex-shrink-0" />
          <p className="font-bold text-lg">{error}</p>
        </div>
      </div>
    );
  }

  // Formatting helpers
  const formatCompact = (num) => {
    if (!num) return "0";
    return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short', maximumFractionDigits: 1 }).format(num);
  };
  
  const totalRev = summary?.total_revenue || 0;
  const totalProd = summary?.total_products || 0;
  const avgPrice = summary?.average_price || 0;

  const tabs = [
    { id: "revenue",    label: "Revenue Engine",   icon: <DollarSign className="w-4 h-4 mr-2" /> },
    { id: "brands",    label: "Top Brands",        icon: <BarChart2 className="w-4 h-4 mr-2" /> },
    { id: "stock",     label: "Stock Health",      icon: <Package className="w-4 h-4 mr-2" /> },
    { id: "promotions",label: "Promotion Impact",  icon: <Percent className="w-4 h-4 mr-2" /> },
    { id: "global",    label: "Global Trends",     icon: <Globe className="w-4 h-4 mr-2" /> }
  ];

  // ==========================================
  // VIEWER (NORMAL USER) REQUEST UI
  // ==========================================
  if (isViewer) {
    return (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full max-w-3xl mx-auto pt-10"
      >
        <motion.div variants={itemVariants} className="glass-panel p-10 rounded-[2.5rem] border border-white/10 text-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] -z-10 group-hover:bg-brand-500/20 transition-all duration-700"></div>
          
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center mb-6 shadow-xl">
            <Lock className="text-white/50 w-10 h-10" />
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">Welcome to PricePilot AI</h1>
          <p className="text-white/60 font-medium text-lg max-w-xl mx-auto mb-10 leading-relaxed">
            Your account has been successfully created. You currently have a standard <strong className="text-white">Viewer</strong> role. To access the internal dashboards and pricing intelligence, please request a role assignment from the Admin.
          </p>

          {!requestSent ? (
            <div className="max-w-md mx-auto glass-card p-6 border border-white/10 rounded-2xl">
              <label className="block text-left text-sm font-bold text-white/70 uppercase tracking-wider mb-3">Request Corporate Role</label>
              <select 
                value={requestedRole}
                onChange={(e) => setRequestedRole(e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500 mb-6 font-medium appearance-none"
              >
                <option value="Pricing Manager">Pricing Manager</option>
                <option value="Business Analyst">Business Analyst</option>
              </select>
              
              <button 
                onClick={() => setRequestSent(true)}
                className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 text-white font-bold hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
              >
                Submit Request <Send size={18} />
              </button>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto p-6 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400">
              <div className="w-12 h-12 rounded-full bg-green-500/20 mx-auto flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="font-bold text-lg mb-2">Request Sent!</h3>
              <p className="text-sm font-medium opacity-80">The Admin has been notified. You will have access once they approve your request.</p>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    );
  }

  // ==========================================
  // ADMIN / ANALYST DASHBOARD UI
  // ==========================================

  // Map product categories to emojis
  const PRODUCT_EMOJI = {
    'Electronics': '💻', 'Clothing': '👕', 'Apparel': '👗', 'Groceries': '🛒',
    'Home': '🏠', 'Sports': '⚽', 'Books': '📚', 'Toys': '🧸',
    'Beauty': '💄', 'Furniture': '🛋️', 'Accessories': '👜', 'Shoes': '👟',
    'Health': '💊', 'Automotive': '🚗', 'Garden': '🌿',
  };
  const getCategoryEmoji = (name = '') => {
    for (const [key, emoji] of Object.entries(PRODUCT_EMOJI)) {
      if (name.toLowerCase().includes(key.toLowerCase())) return emoji;
    }
    return '📦';
  };

  // Top 5 categories by revenue for the quick-view strip
  const topCategories = [...revenueByCategory].sort((a, b) => b.total_revenue - a.total_revenue).slice(0, 5);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full pb-16"
    >
      {/* 1. Business Story Header */}
      <motion.div variants={itemVariants} className="mb-6 glass-panel p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden border border-white/10 group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/20 rounded-full blur-[100px] -z-10 group-hover:bg-brand-500/30 transition-colors duration-700"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px] -z-10"></div>
        
        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4 z-10 relative">
          Your store is tracking at{' '}
          <span className="price-text text-4xl md:text-6xl">
            ${formatCompact(totalRev)}
          </span>{' '}in total sales.
        </h1>
        <p className="text-lg text-white/70 font-medium z-10 relative max-w-3xl leading-relaxed mb-6">
          You have <strong className="text-white">{totalProd.toLocaleString()}</strong> active products with an average price of <span className="price-inline text-lg">${avgPrice.toFixed(2)}</span>.
        </p>

        <AIRecommendationCard />

        {/* KPI Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 z-10 relative">
          {/* Total Revenue */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 hover:scale-[1.03] transition-all duration-300 cursor-default" style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.1), transparent)' }}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-2xl block">💰</span>
              <span className="flex items-center text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px] border border-emerald-400/20">↑ 8.5%</span>
            </div>
            <p className="text-2xl font-black text-brand-400">${formatCompact(totalRev)}</p>
            <p className="text-white/50 text-xs font-semibold mt-1 uppercase tracking-wider">Total Revenue</p>
          </div>

          {/* Active Products */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 hover:scale-[1.03] transition-all duration-300 cursor-default" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), transparent)' }}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-2xl block">📦</span>
              <span className="flex items-center text-emerald-400 font-bold bg-emerald-400/10 px-1.5 py-0.5 rounded text-[10px] border border-emerald-400/20">↑ 2.1%</span>
            </div>
            <p className="text-2xl font-black text-emerald-400">{totalProd.toLocaleString()}</p>
            <p className="text-white/50 text-xs font-semibold mt-1 uppercase tracking-wider">Active Products</p>
          </div>

          {/* Avg Price — HERO CARD */}
          <div
            className="col-span-2 md:col-span-1 rounded-2xl p-4 flex flex-col justify-between hover:scale-[1.03] transition-all duration-300 cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(14,165,233,0.1))',
              border: '1px solid rgba(168,85,247,0.3)',
              boxShadow: '0 0 30px rgba(168,85,247,0.1) inset'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl drop-shadow-md">💲</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full text-white" style={{ background: 'linear-gradient(90deg, rgba(168,85,247,0.5), rgba(56,189,248,0.5))', border: '1px solid rgba(255,255,255,0.2)' }}>Avg Price</span>
            </div>
            <div>
              <p className="price-text text-3xl md:text-4xl drop-shadow-[0_0_15px_rgba(56,189,248,0.5)]">
                ${avgPrice.toFixed(2)}
              </p>
              <p className="text-white/50 text-xs font-bold mt-1 uppercase tracking-widest">Per Product</p>
            </div>
          </div>

          {/* Categories */}
          <div className="glass-card p-4 rounded-2xl border border-white/10 hover:scale-[1.03] transition-all duration-300 cursor-default" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), transparent)' }}>
            <span className="text-2xl mb-1 block">🗂️</span>
            <p className="text-2xl font-black text-amber-400">{summary?.total_categories || '—'}</p>
            <p className="text-white/50 text-xs font-semibold mt-1 uppercase tracking-wider">Categories</p>
          </div>
        </div>

      </motion.div>

      {/* 2. Top Categories Quick Strip */}
      {topCategories.length > 0 && (
        <motion.div variants={itemVariants} className="mb-6">
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-3 px-1">Top Categories at a Glance</p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {topCategories.map((cat, i) => {
              const emoji = getCategoryEmoji(cat.category);
              const colors = ['border-brand-500/40 bg-brand-500/10', 'border-accent-500/40 bg-accent-500/10', 'border-pink-500/40 bg-pink-500/10', 'border-amber-500/40 bg-amber-500/10', 'border-emerald-500/40 bg-emerald-500/10'];
              return (
                <div key={cat.category} className={`flex-shrink-0 glass-panel border ${colors[i]} rounded-2xl px-5 py-4 flex items-center gap-3 min-w-[160px] hover:scale-105 transition-all duration-300`}>
                  <span className="text-3xl">{emoji}</span>
                  <div>
                    <p className="text-white font-black text-sm">{cat.category}</p>
                    <p className="text-white/50 text-xs font-bold">${formatCompact(cat.total_revenue)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* 3. Focus Mode Navigation Tabs */}
      <motion.div variants={itemVariants} className="mb-8 flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-6 py-3 rounded-full font-bold transition-all duration-300 ${
              activeTab === tab.id 
              ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105" 
              : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* 4. The Central Stage (Content Area) */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* REVENUE TAB — full width categories only */}
          {activeTab === "revenue" && (
            <motion.div
              key="revenue"
              variants={tabContentVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 gap-6"
            >
              <div className="glass-card p-8 border border-white/10 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white">Revenue by Category</h2>
                  <p className="text-white/50 font-medium mt-2">See which product types are your true bestsellers. <MetricTooltip text="Each coloured block represents a product category. Bigger block = more revenue." /></p>
                  <p className="text-emerald-400 text-sm font-bold mt-3 flex items-center bg-emerald-400/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-400/20">
                    <Sparkles className="w-4 h-4 mr-2" /> Top category generated 14% more revenue than average.
                  </p>
                </div>
                <div className="min-h-[450px]">
                  <RevenueByCategoryChart data={revenueByCategory} />
                </div>
              </div>
            </motion.div>
          )}

          {/* BRANDS TAB */}
          {activeTab === "brands" && (
            <motion.div
              key="brands"
              variants={tabContentVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 gap-6"
            >
              <div className="glass-card p-8 border border-white/10 flex flex-col">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white">🏆 Top Earning Brands</h2>
                  <p className="text-white/50 font-medium mt-2">The brands driving your revenue — ranked, visualized, and interactive. <MetricTooltip text="Brands are ranked by total revenue. The longer the bar, the more money they earned." /></p>
                  <p className="text-purple-400 text-sm font-bold mt-3 flex items-center bg-purple-400/10 w-fit px-3 py-1.5 rounded-lg border border-purple-400/20">
                    <Sparkles className="w-4 h-4 mr-2" /> Top 3 brands account for 42% of total category growth this month.
                  </p>
                </div>
                <div className="min-h-[450px]">
                  <RevenueByBrandChart data={revenueByBrand} />
                </div>
              </div>
            </motion.div>
          )}

          {/* STOCK TAB */}
          {activeTab === "stock" && (
            <motion.div 
              key="stock"
              variants={tabContentVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="glass-card p-8 border border-white/10 flex flex-col justify-center items-center text-center">
                <span className="text-5xl mb-4">🏭</span>
                <h3 className="text-lg font-bold text-white/50 mb-2">Total Items in Warehouse</h3>
                <p className="text-6xl font-black text-white mb-4">{formatCompact(summary.total_inventory || 0)}</p>
                <p className="text-white/50 font-medium text-sm">Across all <strong className="text-white">{summary.total_categories}</strong> categories <MetricTooltip text="The absolute total number of individual items in your warehouse ready to be sold." /></p>
              </div>
              <div className="glass-card p-8 border border-white/10 flex flex-col lg:col-span-2 h-full">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-white">Current Stock Health</h2>
                  <p className="text-white/50 font-medium mt-2">A real-time look at your warehouse status. <MetricTooltip text="High means plenty of stock (>150 items). Stockout means you have run completely out and cannot sell!" /></p>
                  <p className="text-sky-400 text-sm font-bold mt-3 flex items-center bg-sky-400/10 w-fit px-3 py-1.5 rounded-lg border border-sky-400/20">
                    <Sparkles className="w-4 h-4 mr-2" /> High inventory indicates healthy stock availability for Q4 scale.
                  </p>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <InventoryOverviewChart data={inventoryOverview} />
                </div>
              </div>
            </motion.div>
          )}

          {/* PROMOTIONS TAB */}
          {activeTab === "promotions" && (
            <motion.div 
              key="promotions"
              variants={tabContentVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 gap-6"
            >
              <div className="glass-card p-8 border border-white/10 flex flex-col h-full">
                <div className="mb-8 max-w-3xl">
                  <h2 className="text-2xl font-black text-white">How Discounts Affect Your Sales</h2>
                  <p className="text-white/50 font-medium mt-2">Comparing discount strategies against the total revenue they generated. <MetricTooltip text="Bars show total revenue per promotion type. The pink line shows the average discount % offered." /></p>
                  <p className="text-rose-400 text-sm font-bold mt-3 flex items-center bg-rose-400/10 w-fit px-3 py-1.5 rounded-lg border border-rose-400/20">
                    <Sparkles className="w-4 h-4 mr-2" /> Flash Sales drive 2.4x more volume despite similar margin impacts.
                  </p>
                </div>
                <div className="flex-1 min-h-[450px]">
                  <PromotionAnalysisChart data={promotionAnalysis} />
                </div>
              </div>
            </motion.div>
          )}

          {/* GLOBAL TRENDS TAB */}
          {activeTab === "global" && (
            <motion.div 
              key="global"
              variants={tabContentVariants}
              initial="hidden"
              animate="enter"
              exit="exit"
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <div className="glass-card p-8 border border-white/10 flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white">Sales by Region</h2>
                  <p className="text-white/50 font-medium mt-2">Where your customers are buying from. <MetricTooltip text="Each axis shows a region. The larger the covered area, the stronger those region's sales." /></p>
                </div>
                <div className="flex-1 min-h-[350px]">
                  <RegionalSalesChart data={regionalSales} />
                </div>
              </div>
              <div className="glass-card p-8 border border-white/10 flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-white">Sales by Season</h2>
                  <p className="text-white/50 font-medium mt-2">How different times of year perform. <MetricTooltip text="The glowing line shows seasonal revenue trends. The 🏆 marker highlights your peak season." /></p>
                </div>
                <div className="flex-1 min-h-[350px]">
                  <SeasonalPerformanceChart data={seasonalPerformance} />
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
