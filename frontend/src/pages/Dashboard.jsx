import React, { useState, useEffect } from "react";
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  Tag, 
  Activity, 
  Layers, 
  Grid,
  Box,
  AlertCircle
} from "lucide-react";
import api from "../services/api";

// Import Charts
import RevenueByCategoryChart from "../components/charts/RevenueByCategoryChart";
import RevenueByBrandChart from "../components/charts/RevenueByBrandChart";
import InventoryOverviewChart from "../components/charts/InventoryOverviewChart";
import PromotionAnalysisChart from "../components/charts/PromotionAnalysisChart";
import RegionalSalesChart from "../components/charts/RegionalSalesChart";
import SeasonalPerformanceChart from "../components/charts/SeasonalPerformanceChart";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  
  // Analytics Data States
  const [revenueByCategory, setRevenueByCategory] = useState([]);
  const [revenueByBrand, setRevenueByBrand] = useState([]);
  const [inventoryOverview, setInventoryOverview] = useState([]);
  const [promotionAnalysis, setPromotionAnalysis] = useState([]);
  const [regionalSales, setRegionalSales] = useState([]);
  const [seasonalPerformance, setSeasonalPerformance] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllDashboardData();
  }, []);

  const fetchAllDashboardData = async () => {
    try {
      setLoading(true);
      
      // We can run these concurrently using Promise.all
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Executive Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-pulse h-32">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">Executive Dashboard</h1>
        <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Products",
      value: summary.total_products?.toLocaleString() || 0,
      icon: <Package className="w-6 h-6 text-blue-500" />,
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Revenue",
      value: `$${(summary.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <DollarSign className="w-6 h-6 text-green-500" />,
      bgColor: "bg-green-50",
    },
    {
      title: "Average Selling Price",
      value: `$${(summary.average_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <TrendingUp className="w-6 h-6 text-indigo-500" />,
      bgColor: "bg-indigo-50",
    },
    {
      title: "Avg Discount",
      value: `${(summary.average_discount || 0).toFixed(2)}%`,
      icon: <Tag className="w-6 h-6 text-red-500" />,
      bgColor: "bg-red-50",
    },
    {
      title: "Average Demand Score",
      value: (summary.average_demand || 0).toFixed(2),
      icon: <Activity className="w-6 h-6 text-orange-500" />,
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Brands",
      value: summary.total_brands?.toLocaleString() || 0,
      icon: <Layers className="w-6 h-6 text-purple-500" />,
      bgColor: "bg-purple-50",
    },
    {
      title: "Total Categories",
      value: summary.total_categories?.toLocaleString() || 0,
      icon: <Grid className="w-6 h-6 text-teal-500" />,
      bgColor: "bg-teal-50",
    },
    {
      title: "Total Inventory",
      value: summary.total_inventory?.toLocaleString() || 0,
      icon: <Box className="w-6 h-6 text-yellow-600" />,
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Executive Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{kpi.title}</h3>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                {kpi.icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-800">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <RevenueByCategoryChart data={revenueByCategory} />
        <RevenueByBrandChart data={revenueByBrand} />
        <InventoryOverviewChart data={inventoryOverview} />
        <RegionalSalesChart data={regionalSales} />
        <PromotionAnalysisChart data={promotionAnalysis} />
        <SeasonalPerformanceChart data={seasonalPerformance} />
      </div>
    </div>
  );
}
