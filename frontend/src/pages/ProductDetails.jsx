import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Package, IndianRupee, BarChart2, Globe } from "lucide-react";
import { motion } from "framer-motion";
import api from "../services/api";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      // 1. Fetch Catalog Data
      const catalogRes = await api.get(`/products/${id}`);
      const catalogData = catalogRes.data;
      
      // 2. Fetch Historical Analytics Data using SKU
      let analyticsData = {};
      if (catalogData.product_id) {
        try {
          const analyticsRes = await api.get(`/dashboard/product-analytics/${catalogData.product_id}`);
          analyticsData = analyticsRes.data;
        } catch (analyticsErr) {
          console.warn("Could not fetch analytics for this SKU.", analyticsErr);
        }
      }

      // 3. Fetch Competitor History Data
      let compData = null;
      if (catalogData.product_id) {
        try {
          const compRes = await api.get(`/competitors/history/${catalogData.product_id}`);
          compData = compRes.data.history;
        } catch (compErr) {
          console.warn("Could not fetch competitor history for this SKU.", compErr);
        }
      }

      setHistoryData(compData);
      setProduct({
        ...catalogData,
        ...analyticsData
      });
    } catch (err) {
      setError("Product not found or an error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <div className="flex items-center gap-3 text-brand-400 font-bold">
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          Loading product details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full max-w-2xl mx-auto py-8">
        <div className="bg-red-500/10 text-red-400 p-8 rounded-2xl border border-red-500/20 text-center backdrop-blur-md shadow-xl">
          <h2 className="text-2xl font-extrabold mb-4 text-white">Error</h2>
          <p className="mb-6">{error}</p>
          <button onClick={() => navigate("/products")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all shadow-md">
            Return to Products
          </button>
        </div>
      </div>
    );
  }

  // Calculate competitor metrics safely
  const latestAmazon = historyData?.Amazon?.[historyData.Amazon.length - 1];
  const latestFlipkart = historyData?.Flipkart?.[historyData.Flipkart.length - 1];
  
  const amzPrice = latestAmazon?.price ? Number(latestAmazon.price) : null;
  const fkpPrice = latestFlipkart?.price ? Number(latestFlipkart.price) : null;
  
  const compPrices = [amzPrice, fkpPrice].filter(p => p !== null);
  const lowestComp = compPrices.length > 0 ? Math.min(...compPrices) : null;
  const highestComp = compPrices.length > 0 ? Math.max(...compPrices) : null;
  const avgComp = compPrices.length > 0 ? (compPrices.reduce((a,b)=>a+b,0) / compPrices.length) : null;
  
  const currentPrice = parseFloat(product.current_price || product.base_price || 0);
  const priceGap = lowestComp ? currentPrice - lowestComp : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-8 pb-16"
    >
      <button 
        onClick={() => navigate("/products")}
        className="flex items-center gap-2 text-white/50 hover:text-brand-400 mb-8 transition-colors font-bold group"
      >
        <div className="p-2 bg-white/5 rounded-full group-hover:bg-brand-500/20 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </div>
        Back to Products
      </button>

      <div className="glass-panel rounded-[2rem] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-white/10 bg-black/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-0 w-64 h-64 bg-brand-500/20 rounded-full blur-[100px] -translate-y-1/2 -z-10"></div>
          
          <div className="z-10">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-4 py-1.5 bg-brand-500/20 text-brand-400 text-xs font-black uppercase tracking-widest rounded-full border border-brand-500/30">
                {(product.category || "Uncategorized").replace("_", " ")}
              </span>
              <span className="flex items-center gap-1 text-orange-400 text-xs font-bold bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-full">
                Demand: {product.demand_index != null ? Number(product.demand_index).toFixed(2) : "N/A"}
              </span>
              {product.brand && (
                <span className="flex items-center gap-1 text-white/70 text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                  {product.brand}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-mono font-black text-white tracking-tight">
              {product.product_name || product.product_id}
            </h1>
          </div>
          
          <div className="text-left md:text-right z-10 p-6 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1">Current Price</p>
            <p className="price-text text-5xl">
              {currentPrice > 0 ? `₹${currentPrice.toFixed(2)}` : 'Not available'}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Sales & Inventory */}
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 text-white border-b border-white/10 pb-4">
              <div className="p-2 bg-brand-500/20 rounded-xl">
                <Package className="w-5 h-5 text-brand-400" />
              </div>
              Sales & Inventory
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Units Sold</span>
                <span className="font-bold text-white text-lg">{product.units_sold != null ? product.units_sold : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Total Revenue</span>
                <span className="font-black price-inline text-lg">{product.revenue != null ? `₹${parseFloat(product.revenue).toFixed(2)}` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Inventory Level</span>
                <span className="font-bold text-white text-lg">{product.inventory_level != null ? product.inventory_level : (product.initial_inventory != null ? product.initial_inventory : "N/A")}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Stockout Flag</span>
                {product.stockout_flag != null ? (
                  <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider ${product.stockout_flag ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]" : "bg-green-500/20 text-green-400 border border-green-500/30"}`}>
                    {product.stockout_flag ? "CRITICAL" : "HEALTHY"}
                  </span>
                ) : (
                  <span className="text-white/90 font-bold">N/A</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 text-white border-b border-white/10 pb-4">
              <div className="p-2 bg-green-500/20 rounded-xl">
                <IndianRupee className="w-5 h-5 text-green-400" />
              </div>
              Pricing Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Base Price</span>
                <span className="font-black price-inline text-lg">{product.base_price > 0 ? `₹${parseFloat(product.base_price).toFixed(2)}` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Discount %</span>
                <span className="font-bold text-accent-400 text-lg">{product.discount_pct != null ? `${Number(product.discount_pct).toFixed(2)}%` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Promotion Type</span>
                <span className="font-bold text-white/90">{!product.promotion_type || product.promotion_type === 'NaN' ? "None" : product.promotion_type}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Price Change %</span>
                <span className={`font-bold text-lg ${product.price_change_pct > 0 ? "text-green-400" : product.price_change_pct < 0 ? "text-red-400" : "text-white/90"}`}>
                  {product.price_change_pct != null ? `${product.price_change_pct > 0 ? "+" : ""}${Number(product.price_change_pct).toFixed(2)}%` : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Market Context */}
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 text-white border-b border-white/10 pb-4">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <BarChart2 className="w-5 h-5 text-purple-400" />
              </div>
              Market Context
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Region</span>
                <span className="font-bold text-white/90">{product.region || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Sales Channel</span>
                <span className="font-bold text-white/90">{product.channel || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Season</span>
                <span className="font-bold text-white/90 capitalize">{product.season || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Date Recorded</span>
                <span className="font-bold text-white/90">{product.date ? new Date(product.date).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>

          {/* Competitor Analysis */}
          <div className="space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3 text-white border-b border-white/10 pb-4">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Globe className="w-5 h-5 text-blue-400" />
              </div>
              Competitors
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Amazon</span>
                <span className="font-bold text-amber-400">{amzPrice ? `₹${amzPrice.toFixed(2)}` : "Pending/N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Flipkart</span>
                <span className="font-bold text-blue-400">{fkpPrice ? `₹${fkpPrice.toFixed(2)}` : "Pending/N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Lowest Competitor</span>
                <span className="font-bold text-white/90">{lowestComp ? `₹${lowestComp.toFixed(2)}` : "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                <span className="text-white/60 font-medium">Price Gap</span>
                <span className={`font-bold ${priceGap != null ? (priceGap > 0 ? "text-red-400" : "text-green-400") : "text-white/90"}`}>
                  {priceGap != null ? `${priceGap > 0 ? "+" : ""}₹${Math.abs(priceGap).toFixed(2)}` : "N/A"}
                </span>
              </div>
              <div className="mt-2 text-center">
                <button onClick={() => navigate("/competitors")} className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2">
                  View Full Competitor Analysis
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
